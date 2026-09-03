import {createPublicClient, http} from 'viem';
import {base} from 'viem/chains';
import {BASE_USDC, COINBASE_STOCKS} from '../src/base-assets.mjs';

const erc20Abi = [
  {type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{type: 'string'}]},
  {type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{type: 'uint8'}]},
];

const feedAbi = [{
  type: 'function',
  name: 'latestRoundData',
  stateMutability: 'view',
  inputs: [],
  outputs: [
    {name: 'roundId', type: 'uint80'},
    {name: 'answer', type: 'int256'},
    {name: 'startedAt', type: 'uint256'},
    {name: 'updatedAt', type: 'uint256'},
    {name: 'answeredInRound', type: 'uint80'},
  ],
}];

const client = createPublicClient({chain: base, transport: http(process.env.BASE_RPC_URL ?? 'https://mainnet.base.org')});

const entries = [{symbol: 'USDC', token: BASE_USDC, feed: null}, ...Object.values(COINBASE_STOCKS).map((stock) => ({
  symbol: stock.symbol,
  token: stock.token,
  feed: stock.priceFeed,
}))];

for (const entry of entries) {
  const [symbol, decimals] = await client.multicall({
    contracts: [
      {address: entry.token, abi: erc20Abi, functionName: 'symbol'},
      {address: entry.token, abi: erc20Abi, functionName: 'decimals'},
    ],
  }).then((results) => results.map((result) => {
    if (result.status !== 'success') throw result.error;
    return result.result;
  }));
  process.stdout.write(`${entry.symbol}: ${symbol} at ${entry.token}, decimals=${decimals}`);
  if (entry.feed) {
    const feed = await client.readContract({address: entry.feed, abi: feedAbi, functionName: 'latestRoundData'});
    process.stdout.write(`, feedAnswer=${feed[1].toString()}, updatedAt=${feed[3].toString()}`);
  }
  process.stdout.write('\n');
}
