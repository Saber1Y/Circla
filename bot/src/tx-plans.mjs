import {encodeFunctionData, parseUnits} from 'viem';

const vaultAbi = [
  {type: 'function', name: 'join', stateMutability: 'nonpayable', inputs: [], outputs: []},
  {type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{name: 'amount', type: 'uint256'}], outputs: []},
  {
    type: 'function',
    name: 'createProposal',
    stateMutability: 'nonpayable',
    inputs: [
      {name: 'asset', type: 'address'},
      {name: 'router', type: 'address'},
      {name: 'amountIn', type: 'uint256'},
      {name: 'minAmountOut', type: 'uint256'},
    ],
    outputs: [{name: 'proposalId', type: 'uint256'}],
  },
  {
    type: 'function',
    name: 'vote',
    stateMutability: 'nonpayable',
    inputs: [{name: 'proposalId', type: 'uint256'}, {name: 'support', type: 'bool'}],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeProposal',
    stateMutability: 'nonpayable',
    inputs: [
      {name: 'router', type: 'address'},
      {name: 'proposalId', type: 'uint256'},
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          {name: 'from', type: 'address'},
          {name: 'to', type: 'address'},
          {name: 'stable', type: 'bool'},
          {name: 'factory', type: 'address'},
        ],
      },
    ],
    outputs: [{name: 'amountOut', type: 'uint256'}],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{name: 'units', type: 'uint256'}, {name: 'recipient', type: 'address'}],
    outputs: [{name: 'usdcAmount', type: 'uint256'}, {name: 'assetAmount', type: 'uint256'}],
  },
];

const erc20Abi = [{
  type: 'function',
  name: 'approve',
  stateMutability: 'nonpayable',
  inputs: [{name: 'spender', type: 'address'}, {name: 'amount', type: 'uint256'}],
  outputs: [{name: '', type: 'bool'}],
}];

export function joinPlan(vault) {
  return call(vault, encodeFunctionData({abi: vaultAbi, functionName: 'join'}));
}

export function depositPlan({vault, usdc, amountUsdc}) {
  const amount = parseUnits(String(amountUsdc), 6);
  return [
    call(usdc, encodeFunctionData({abi: erc20Abi, functionName: 'approve', args: [vault, amount]})),
    call(vault, encodeFunctionData({abi: vaultAbi, functionName: 'deposit', args: [amount]})),
  ];
}

export function proposalPlan({vault, asset, router, amountUsdc, minAmountOut}) {
  return call(vault, encodeFunctionData({
    abi: vaultAbi,
    functionName: 'createProposal',
    args: [asset, router, parseUnits(String(amountUsdc), 6), BigInt(minAmountOut)],
  }));
}

export function votePlan({vault, proposalId, support}) {
  return call(vault, encodeFunctionData({abi: vaultAbi, functionName: 'vote', args: [BigInt(proposalId), support]}));
}

export function executePlan({vault, router, proposalId, routes}) {
  return call(vault, encodeFunctionData({abi: vaultAbi, functionName: 'executeProposal', args: [router, BigInt(proposalId), routes]}));
}

export function withdrawPlan({vault, units, recipient}) {
  return call(vault, encodeFunctionData({abi: vaultAbi, functionName: 'withdraw', args: [BigInt(units), recipient]}));
}

function call(to, data) {
  return {to, data, value: 0n};
}
