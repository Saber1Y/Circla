import {createPublicClient, http, parseAbi} from 'viem';
import {base, baseSepolia} from 'viem/chains';

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
  const chain = rpcUrl.includes('sepolia') ? baseSepolia : base;
  return createPublicClient({chain, transport: http(rpcUrl)});
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
  return {
    name: unwrap(name),
    members: unwrap(members),
    poolValue: unwrap(poolValue),
    totalUnits: unwrap(totalUnits),
    asset: unwrap(asset),
    adjustedBalance: unwrap(adjustedBalance),
  };
}

export async function readProposal(client, vaultAddress, proposalId) {
  if (!vaultAddress) throw new Error('CIRCLA_VAULT_ADDRESS is not configured');
  const count = await client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'proposalCount' });
  const id = proposalId ?? count;
  if (id < 1n || id > count) throw new Error(`Proposal #${id} does not exist (1–${count})`);
  const [p, quorum, members] = await Promise.all([
    client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'proposals', args: [id] }),
    client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'quorum' }),
    client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'members' }),
  ]);
  const voted = [];
  for (const m of members) {
    const v = await client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: 'hasVoted', args: [id, m] });
    if (v) voted.push(m);
  }
  return {
    id, quorum, members, voted,
    proposer: p[0], asset: p[1], router: p[2], amountIn: p[3], minAmountOut: p[4],
    deadline: p[5], nonce: p[6], yesVotes: p[7], noVotes: p[8],
    executed: p[9], cancelled: p[10],
  };
}

function unwrap(result) {
  if (result.status !== 'success') throw result.error;
  return result.result;
}
