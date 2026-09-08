import {createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';

const vaultAbi = parseAbi([
  'function circleName() view returns (string)',
  'function members() view returns (address[])',
  'function poolValue() view returns (uint256)',
  'function totalUnits() view returns (uint256)',
  'function portfolioAsset() view returns (address)',
  'function adjustedAssetBalance() view returns (uint256)',
  'function proposalCount() view returns (uint256)',
  'function quorum() view returns (uint8)',
  'function proposals(uint256) view returns (address proposer, address asset, address router, uint256 amountIn, uint256 minAmountOut, uint256 deadline, uint256 nonce, uint256 yesVotes, uint256 noVotes, bool executed, bool cancelled)',
  'function hasVoted(uint256, address) view returns (bool)',
]);

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

function unwrap(result) {
  if (result.status !== 'success') throw result.error;
  return result.result;
}
