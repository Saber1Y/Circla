export const BASE_CHAIN_ID = 8453;
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Official Coinbase Tokenized Stock catalog on Base. Addresses verified against
// https://www.base.org/stocks (checked Sep 2026) and the on-chain registry at
// 0x3f3E8cf41cdd3b1D118c16471aB0113DfDDd5CaD. Only tokens listed there are
// issued by Coinbase; anything else is not official.
//
// token: the B20 contract address from base.org/stocks.
// name: the underlying company.
// priceFeed: the Chainlink total-return feed proxy for the token on Base. Only
//   two are verified at present (NVDAc, AAPLc); the rest are null until verified
//   against the Chainlink tokenized-equity feed list. The field is advisory only
//   - on-chain execution reads the feed from the vault's allowlisted registry,
//   not from here.

export const COINBASE_STOCKS = Object.freeze({
  NVDAC: Object.freeze({
    symbol: 'NVDAC',
    name: 'NVIDIA',
    token: '0xb20000000000000000000078ee7ce2fE4908108C',
    priceFeed: '0x04689a41629776563E6822F76f2e57D148d28513',
  }),
  METAC: Object.freeze({
    symbol: 'METAC',
    name: 'Meta',
    token: '0xb2000000000000000000008bC8786B856E61707C',
    priceFeed: null,
  }),
  AAPLC: Object.freeze({
    symbol: 'AAPLC',
    name: 'Apple',
    token: '0xb200000000000000000000C2e324d24d7eEcd1fb',
    priceFeed: '0x787f13dEa48Db0897CbCDD985de77809D837F988',
  }),
  GOOGLC: Object.freeze({
    symbol: 'GOOGLC',
    name: 'Alphabet (Google)',
    token: '0xb2000000000000000000002D0BA3164cc74f58B7',
    priceFeed: null,
  }),
  AMZNC: Object.freeze({
    symbol: 'AMZNC',
    name: 'Amazon',
    token: '0xb200000000000000000000d9192b6B456483C2E8',
    priceFeed: null,
  }),
  MSFTC: Object.freeze({
    symbol: 'MSFTC',
    name: 'Microsoft',
    token: '0xB200000000000000000000Ab99cFa739E253872B',
    priceFeed: null,
  }),
  MSTRC: Object.freeze({
    symbol: 'MSTRC',
    name: 'MicroStrategy (Strategy)',
    token: '0xb2000000000000000000004884b426556b92883d',
    priceFeed: null,
  }),
  SNDKC: Object.freeze({
    symbol: 'SNDKC',
    name: 'SanDisk',
    token: '0xb200000000000000000000397293Cb8cda9a10c5',
    priceFeed: null,
  }),
  SPCXC: Object.freeze({
    symbol: 'SPCXC',
    name: 'SpaceX',
    token: '0xb2000000000000000000007b9fcbd005511aCBd5',
    priceFeed: null,
  }),
  TSLAC: Object.freeze({
    symbol: 'TSLAC',
    name: 'Tesla',
    token: '0xb2000000000000000000001e800a7f5189430cD0',
    priceFeed: null,
  }),
  COINC: Object.freeze({
    symbol: 'COINC',
    name: 'Coinbase',
    token: '0xb200000000000000000000c85a31389D71F3ecfb',
    priceFeed: null,
  }),
  CRCLC: Object.freeze({
    symbol: 'CRCLC',
    name: 'Circle',
    token: '0xB20000000000000000000019f6E7C675b73C2e4D',
    priceFeed: null,
  }),
  INTCC: Object.freeze({
    symbol: 'INTCC',
    name: 'Intel',
    token: '0xB2000000000000000000004AFF16039bA04bdFBc',
    priceFeed: null,
  }),
});

export function resolveStock(symbol) {
  const normalized = String(symbol ?? '').trim().toUpperCase();
  const stock = COINBASE_STOCKS[normalized];
  if (!stock) throw new Error(`unsupported Coinbase stock: ${normalized || 'empty symbol'}`);
  return stock;
}
