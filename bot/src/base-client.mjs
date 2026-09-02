import {createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';

const vaultAbi = parseAbi([
  'function circleName() view returns (string)',
  'function members() view returns (address[])',
  'function poolValue() view returns (uint256)',
  'function totalUnits() view returns (uint256)',
  'function portfolioAsset() view returns (address)',
  'function adjustedAssetBalance() view returns (uint256)',
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
  return {
    name: unwrap(name),
    members: unwrap(members),
    poolValue: unwrap(poolValue),
    totalUnits: unwrap(totalUnits),
    asset: unwrap(asset),
    adjustedBalance: unwrap(adjustedBalance),
  };
}

function unwrap(result) {
  if (result.status !== 'success') throw result.error;
  return result.result;
}
