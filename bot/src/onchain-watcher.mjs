import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { getAddress } from 'viem';
import { formatUnits } from 'viem';
import { LOG_SCAN_CHUNK, getLogsResilient } from './base-client.mjs';

// Must mirror CirclaVault's event declarations exactly, including `indexed`,
// or getLogs decodes the data fields at the wrong offsets.
export const vaultEventsAbi = parseAbi([
  'event MemberJoined(address indexed member)',
  'event InviteChanged(address indexed account, bool invited)',
  'event CircleClosed()',
  'event ContributionReceived(address indexed member, uint256 amount, uint256 units)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed asset, uint256 amountIn, uint256 minAmountOut, uint256 deadline)',
  'event VoteCast(uint256 indexed proposalId, address indexed member, bool support)',
  'event ProposalExecuted(uint256 indexed proposalId, address indexed router, uint256 amountIn, uint256 amountOut)',
  'event Withdrawal(address indexed member, address indexed recipient, uint256 units, uint256 usdcAmount, uint256 assetAmount)',
  'event LiquidationWithdrawal(address indexed member, address indexed recipient, uint256 units, uint256 reservedUsdc, uint256 liquidatedUsdc, uint256 assetAmount, address router)',
]);

const readAbi = parseAbi([
  'function quorum() view returns (uint8)',
  'function circleName() view returns (string)',
]);

export function createWatcher({ rpcUrl = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org' } = {}) {
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  return { client };
}

// Format a raw chain event into a human short code for the GC. Handles the
// actual event log (from viem getLogs), not formatted chat state.
// Proposal events optionally carry a fresh onchain `proposal` read so the
// message shows authoritative amountIn/asset even when log args are partial.

export function formatEvent(event, { quorum = 0, name = 'CIRCLA pool', proposal = undefined } = {}) {
  const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  switch (event.eventName) {
    case 'MemberJoined':
      return `👋 ${short(event.args.member)} joined ${name}`;
    case 'InviteChanged':
      return event.args.invited
        ? `✉️ ${short(event.args.account)} was invited to ${name}. Open the app with that wallet and tap Join circle.`
        : `${short(event.args.account)}'s invite to ${name} was revoked`;
    case 'CircleClosed':
      return `🔒 ${name} is now closed to new members`;
    case 'ContributionReceived':
      return `💰 ${short(event.args.member)} contributed ${formatUsdc(event.args.amount)} USDC (${formatUnits(event.args.units, 18)} units)`;
    case 'ProposalCreated':
      return `🗳 Proposal #${event.args.proposalId}: buy ${formatUsdc(proposal?.amountIn ?? event.args.amountIn)} USDC → ${short(proposal?.asset ?? event.args.asset)}`;
    case 'VoteCast': {
      const side = event.args.support ? 'yes' : 'no';
      const tally = proposal ? ` · ${proposal.yesVotes}/${proposal.quorum} yes · ${proposal.noVotes} no` : '';
      return `${short(event.args.member)} voted ${side} on Proposal #${event.args.proposalId}${tally}${quorum && !proposal ? ` (quorum ${quorum})` : ''}`;
    }
    case 'ProposalExecuted':
      return `✅ Proposal #${event.args.proposalId} executed: ${formatUsdc(event.args.amountIn)} USDC → ${shortAssetOut(event.args.amountOut)}`;
    case 'Withdrawal': {
      // assetAmount sums raw B20 balances across held stocks, all 8 decimals.
      const stock = event.args.assetAmount > 0n ? ` + ${formatUnits(event.args.assetAmount, 8)} in stock` : '';
      return `↩️ ${short(event.args.member)} withdrew ${formatUnits(event.args.units, 18)} units: ${formatUsdc(event.args.usdcAmount)} USDC${stock}`;
    }
    case 'LiquidationWithdrawal':
      return `↩️ ${short(event.args.member)} withdrew ${formatUnits(event.args.units, 18)} units as ${formatUsdc(event.args.reservedUsdc + event.args.liquidatedUsdc)} USDC`;
    default:
      return `⚡ ${event.eventName}`;
  }
}

export function formatUsdc(rawUnits) {
  return formatUnits(BigInt(rawUnits), 6);
}

function shortAssetOut(rawUnits) {
  // asset out is 8-decimal NVDAc most of the time
  return `${formatUnits(BigInt(rawUnits), 8)}` === '0' ? `${rawUnits}` : `${formatUnits(BigInt(rawUnits), 8)}`;
}

// Poll a vault for new events since `lastBlock`. Returns { events, lastBlock }.
// Returns [] if the lookback window is null (nothing new to report).

export async function pollVaultEvents({ client, vault, lastBlock = undefined, eventCount = undefined }) {
  const current = await client.getBlockNumber();
  const from = lastBlock === undefined ? current - 1n : BigInt(lastBlock) + 1n;
  if (from > current) return { events: [], lastBlock: current };

  // Public mainnet.base.org caps eth_getLogs around 2-3k blocks and throttles
  // bursts, so chunk the scan with retry/backoff (larger ranges return 413).
  const MAX_RANGE = LOG_SCAN_CHUNK;
  const raw = [];
  let cursor = from;
  while (cursor <= current) {
    const end = cursor + MAX_RANGE > current ? current : cursor + MAX_RANGE;
    const chunk = await getLogsResilient(client, {
      address: vault,
      events: vaultEventsAbi,
      fromBlock: cursor,
      toBlock: end,
    });
    raw.push(...chunk);
    cursor = end + 1n;
  }

  const deduped = dedupeEvents(raw);
  const events = deduped.slice(-(eventCount ?? deduped.length));
  return { events, lastBlock: current };
}

// getLogs can return the same log twice on RPC edge cases; collapse duplicates.
function dedupeEvents(logs) {
  const seen = new Set();
  const out = [];
  for (const log of logs) {
    const key = `${log.blockNumber}-${log.logIndex}-${log.transactionHash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(log);
  }
  return out;
}

export async function readQuorum(client, vault) {
  try {
    const [quorum, name] = await Promise.all([
      client.readContract({ address: vault, abi: readAbi, functionName: 'quorum' }),
      client.readContract({ address: vault, abi: readAbi, functionName: 'circleName' }),
    ]);
    return { quorum, name };
  } catch {
    return { quorum: 0, name: 'CIRCLA pool' };
  }
}

export { getAddress };