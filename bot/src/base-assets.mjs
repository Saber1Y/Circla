export const BASE_CHAIN_ID = 8453;
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const COINBASE_STOCKS = Object.freeze({
  AAPLC: Object.freeze({
    symbol: 'AAPLC',
    name: 'Apple',
    token: '0xb200000000000000000000C2e324d24d7eEcd1fb',
    priceFeed: '0x787f13dEa48Db0897CbCDD985de77809D837F988',
    decimals: 6,
  }),
  NVDAC: Object.freeze({
    symbol: 'NVDAC',
    name: 'NVIDIA',
    token: '0xb20000000000000000000078ee7ce2fE4908108C',
    priceFeed: '0x04689a41629776563E6822F76f2e57D148d28513',
    decimals: 6,
  }),
});

export function resolveStock(symbol) {
  const normalized = String(symbol ?? '').trim().toUpperCase();
  const stock = COINBASE_STOCKS[normalized];
  if (!stock) throw new Error(`unsupported Coinbase stock: ${normalized || 'empty symbol'}`);
  return stock;
}
