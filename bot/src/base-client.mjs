import {createPublicClient, fallback, http, parseAbi} from 'viem';
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
export const VAULT_DEPLOY_BLOCK = 53844368n;

// public mainnet.base.org caps eth_getLogs around 2-3k blocks (413 otherwise)
export const LOG_SCAN_CHUNK = 2_000n;
// Deposit-history scans start wide and halve down to MIN_SCAN_CHUNK on errors.
const HISTORY_SCAN_CHUNK = 10_000n;
const MIN_SCAN_CHUNK = 500n;

// contribution events, indexed for /members
const contributionEvent = parseAbi(['event ContributionReceived(address indexed member, uint256 amount, uint256 units)']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Public mainnet.base.org throttles shared IPs and may transiently reject
// ranged eth_getLogs (413/429/5xx). Retry with exponential backoff so a
// single burst doesn't fail an entire command or watcher poll.
export async function getLogsResilient(client, params, { maxRetries = 4, baseDelayMs = 600, chunk = LOG_SCAN_CHUNK } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.getLogs(params);
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) throw error;
      const wait = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 150);
      await sleep(wait);
    }
  }
  throw lastError;
}

// Public endpoints tried after any configured ones. mainnet.base.org throttles
// shared hosts like Render hard; publicnode serves eth_getLogs over wide ranges.
const PUBLIC_RPC_URLS = ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'];

// BASE_RPC_URL (one URL) or BASE_RPC_URLS (comma-separated) come first, so a
// dedicated endpoint is always preferred when one is configured.
export function baseRpcUrls(env = process.env) {
  const configured = [env.BASE_RPC_URLS, env.BASE_RPC_URL]
    .filter(Boolean)
    .flatMap((v) => v.split(','))
    .map((u) => u.trim())
    .filter(Boolean);
  return [...new Set([...configured, ...PUBLIC_RPC_URLS])];
}

// A rate-limited or failing endpoint falls through to the next one instead of
// failing the command.
export function createBaseClient({rpcUrls = baseRpcUrls()} = {}) {
  return createPublicClient({
    chain: base,
    transport: fallback(rpcUrls.map((url) => http(url, {retryCount: 1, timeout: 15_000}))),
  });
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
// Base produces several blocks a second, so a vault's history quickly spans
// hundreds of thousands of blocks. History is scanned once, then only new
// blocks: progress is kept per vault and saved after every chunk, so a
// throttled request resumes where it stopped instead of starting over.
const contributionState = new Map();

function stateFor(vaultAddress) {
  const key = String(vaultAddress).toLowerCase();
  if (!contributionState.has(key)) {
    contributionState.set(key, {scannedTo: VAULT_DEPLOY_BLOCK - 1n, head: undefined, totals: new Map(), syncing: null});
  }
  return contributionState.get(key);
}

// Totals scanned so far; `complete` is true once the scan has reached the
// chain head it last saw.
export function peekContributionTotals(vaultAddress) {
  const state = stateFor(vaultAddress);
  return {totals: new Map(state.totals), complete: state.head !== undefined && state.scannedTo >= state.head};
}

// Scans any blocks not seen yet. Concurrent callers share one scan.
export function syncContributionTotals(client, vaultAddress, {pauseMs = 150} = {}) {
  const state = stateFor(vaultAddress);
  if (state.syncing) return state.syncing;
  state.syncing = (async () => {
    const head = await client.getBlockNumber();
    state.head = head;
    // Wide ranges keep a long history to a few dozen requests; endpoints that
    // cap eth_getLogs ranges get a smaller chunk on the next attempt.
    let chunk = HISTORY_SCAN_CHUNK;
    while (state.scannedTo < head) {
      const from = state.scannedTo + 1n;
      const to = from + chunk - 1n > head ? head : from + chunk - 1n;
      let logs;
      try {
        logs = await getLogsResilient(client, {
          address: vaultAddress,
          event: contributionEvent[0],
          fromBlock: from,
          toBlock: to,
        }, {maxRetries: 2});
      } catch (error) {
        if (chunk <= MIN_SCAN_CHUNK) throw error;
        chunk /= 2n;
        continue;
      }
      const seen = new Set();
      for (const log of logs) {
        const key = `${log.blockNumber}-${log.logIndex}-${log.transactionHash}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const member = log.args.member.toLowerCase();
        state.totals.set(member, (state.totals.get(member) ?? 0n) + log.args.amount);
      }
      state.scannedTo = to;
      if (pauseMs > 0 && state.scannedTo < head) await sleep(pauseMs);
    }
    return peekContributionTotals(vaultAddress);
  })().finally(() => {
    state.syncing = null;
  });
  return state.syncing;
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
