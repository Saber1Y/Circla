import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { getAddress } from 'viem';
import { formatUnits } from 'viem';

const vaultAbi = parseAbi([
  'event MemberJoined(address indexed member)',
  'event ContributionReceived(address indexed member, uint256 amount, uint256 units)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address asset, uint256 amountIn, uint256 minAmountOut, uint256 deadline)',
  'event VoteCast(uint256 indexed proposalId, address indexed member, bool support)',
  'event ProposalExecuted(uint256 indexed proposalId, address indexed router, uint256 amountIn, uint256 amountOut)',
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

  // Base RPC caps eth_getLogs at a 10,000-block range, so chunk the scan.
  const MAX_RANGE = 8_000n;
  const raw = [];
  let cursor = from;
  while (cursor <= current) {
    const end = cursor + MAX_RANGE > current ? current : cursor + MAX_RANGE;
    const chunk = await client.getLogs({
      address: vault,
      events: vaultAbi,
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