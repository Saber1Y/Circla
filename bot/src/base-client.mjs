import {createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';
import {COINBASE_STOCKS} from './base-assets.mjs';

const vaultAbi = parseAbi([
  'function circleName() view returns (string)',
  'function members() view returns (address[])',
  'function poolValue() view returns (uint256)',
  'function totalUnits() view returns (uint256)',
  'function portfolioAsset() view returns (address)',
  'function adjustedAssetBalance() view returns (uint256)',
  'function proposalCount() view returns (uint256)',
  'function quorum() view returns (uint8)',
  'function memberUnits(address) view returns (uint256)',
  'function proposals(uint256) view returns (address proposer, address asset, address router, uint256 amountIn, uint256 minAmountOut, uint256 deadline, uint256 nonce, uint256 yesVotes, uint256 noVotes, bool executed, bool cancelled)',
  'function hasVoted(uint256, address) view returns (bool)',
  'function registry() view returns (address)',
]);

// The demo vault was deployed at this block; scanning ContributionReceived
// logs from here yields every member's lifetime deposits.
export const VAULT_DEPLOY_BLOCK = 50985040n;

// contribution events, indexed for /members
const contributionEvent = parseAbi(['event ContributionReceived(address indexed member, uint256 amount, uint256 units)']);

export function createBaseClient({rpcUrl = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'} = {}) {
  return createPublicClient({chain: base, transport: http(rpcUrl)});
}

export async function readVaultSnapshot(client, vaultAddress) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  const [name, members, poolValue, totalUnits, asset, adjustedBalance] = await client.multicall({
    contracts: [
      {address: vaultAddress, abi: vaultAbi, functionName: 'circleName'},
      {address: vaultAddress, abi: vaultAbi, functionName: 'members'},
      {address: vaultAddress, abi: vaultAbi, functionName: 'poolValue'},
      {address: vaultAddress, abi: vaultAbi, functionName: 'totalUnits'},
      {address: vaultAddress, abi: vaultAbi, functionName: 'portfolioAsset'},
      {address: vaultAddress, abi: vaultAbi, functionName: 'adjustedAssetBalance'},
    ],
  });
  // poolValue reverts while a Chainlink feed is stale (market closed) — that is
  // the fail-closed design. Report it instead of failing the whole snapshot.
  const pool = poolValue.status === 'success' ? poolValue.result : null;
  return {
    name: unwrap(name),
    members: unwrap(members),
    poolValue: pool,
    totalUnits: unwrap(totalUnits),
    asset: unwrap(asset),
    adjustedBalance: unwrap(adjustedBalance),
  };
}

export async function readProposal(client, vaultAddress, proposalId) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  let id = proposalId;
  if (id === undefined) {
    const count = await client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'proposalCount' });
    id = count;
  }
  id = BigInt(id);
  if (id < 1n) throw new Error(`Proposal #${id} does not exist (1–${id})`);
  const [_count, p, quorum, members] = await client.multicall({
    contracts: [
      { address: vaultAddress, abi: vaultAbi, functionName: 'proposalCount' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'proposals', args: [id] },
      { address: vaultAddress, abi: vaultAbi, functionName: 'quorum' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'members' },
    ],
  });
  const pRes = unwrap(p);
  if (typeof pRes === 'bigint' || pRes.proposer === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Proposal #${id} does not exist (unset)`);
  }
  const q = unwrap(quorum);
  const m = unwrap(members);
  const voted = [];
  for (const member of m) {
    const v = await client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'hasVoted', args: [id, member] });
    if (v) voted.push(member);
  }
  return {
    id, quorum: q, members: m, voted,
    proposer: pRes[0], asset: pRes[1], router: pRes[2], amountIn: pRes[3], minAmountOut: pRes[4],
    deadline: pRes[5], nonce: pRes[6], yesVotes: pRes[7], noVotes: pRes[8],
    executed: pRes[9], cancelled: pRes[10],
  };
}

export async function readMemberShares(client, vaultAddress) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  const [members, totalUnits] = await client.multicall({
    contracts: [
      { address: vaultAddress, abi: vaultAbi, functionName: 'members' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'totalUnits' },
    ],
  });
  const m = unwrap(members);
  const shares = await client.multicall({
    contracts: m.map((member) => ({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'memberUnits',
      args: [member],
    })),
  });
  return {
    totalUnits: unwrap(totalUnits),
    members: m.map((address, i) => ({
      address,
      units: shares[i].status === 'success' ? shares[i].result : 0n,
    })),
  };
}

// Lifetime USDC each member deposited, from ContributionReceived logs.
// Scanned in 8k-block chunks (Base RPC caps eth_getLogs payloads), then
// dedupled - mirrors pollVaultEvents so /members works for older vaults too.
export async function readContributionTotals(client, vaultAddress) {
  const current = await client.getBlockNumber();
  const MAX_RANGE = 8_000n;
  const totals = new Map();
  let cursor = VAULT_DEPLOY_BLOCK;
  while (cursor <= current) {
    const end = cursor + MAX_RANGE > current ? current : cursor + MAX_RANGE;
    const chunk = await client.getLogs({
      address: vaultAddress,
      event: contributionEvent[0],
      fromBlock: cursor,
      toBlock: end,
    });
    const seen = new Set();
    for (const log of chunk) {
      const key = `${log.blockNumber}-${log.logIndex}-${log.transactionHash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const member = log.args.member.toLowerCase();
      totals.set(member, (totals.get(member) ?? 0n) + log.args.amount);
    }
    cursor = end + 1n;
  }
  return totals;
}

// Tradable stocks = catalog entries enabled in the vault's onchain asset
// registry. The registry is the source of truth; the local catalog only adds
// display metadata (company name). /stocks reads this live, so assets the
// registry owner configures onchain appear without touching the bot.
export async function readEnabledStocks(client, vaultAddress) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  const registryAddress = await client.readContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'registry',
  });
  const registryAbi = parseAbi([
    'function getAsset(address token) view returns (address token, address priceFeed, uint8 tokenDecimals, int24 tickSpacing, uint256 maxTradeAmount, bool enabled)',
  ]);
  const entries = Object.values(COINBASE_STOCKS);
  const configs = await client.multicall({
    contracts: entries.map((stock) => ({
      address: registryAddress,
      abi: registryAbi,
      functionName: 'getAsset',
      args: [stock.token],
    })),
  });
  return entries
    .map((stock, i) => {
      // viem decodes multi-output calls as arrays by index — AssetConfig is
      // (token, priceFeed, tokenDecimals, tickSpacing, maxTradeAmount, enabled).
      const cfg = configs[i].status === 'success' ? configs[i].result : undefined;
      const enabled = Array.isArray(cfg) ? cfg[5] : cfg?.enabled;
      return {...stock, enabled: enabled === true};
    })
    .filter((stock) => stock.enabled);
}

function unwrap(result) {
  if (result.status !== 'success') throw result.error;
  return result.result;
}
