import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSwapReceipt, formatContribution, formatStockList } from '../src/receipts.mjs';

test('formats Aerodrome swap receipts with Basescan link', () => {
  const out = formatSwapReceipt({ assetSymbol: 'NVDAc', amountOut: '1.14', valueUsdc: '250', txHash: '0xabc', explorerBase: 'https://basescan.org' });
  assert.match(out, /Swap executed! 1\.14 NVDAc @ \$250/);
  assert.match(out, /basescan\.org\/tx\/0xabc/);
  assert.match(out, /scaledBalanceOf/);
});

test('formats contribution receipts deterministically', () => {
  const out = formatContribution({ member: 'you', amountUsdc: '50', txHash: '', explorerBase: 'https://basescan.org' });
  assert.match(out, /\/contribute 50 USDC/);
});

test('lists registry-enabled stocks with the propose usage hint', () => {
  const out = formatStockList([
    { symbol: 'NVDAC', name: 'NVIDIA', token: '0x1' },
    { symbol: 'AAPLC', name: 'Apple', token: '0x2' },
  ]);
  assert.match(out, /NVDAC — NVIDIA/);
  assert.match(out, /AAPLC — Apple/);
  assert.match(out, /\/propose buy <USDC> <SYMBOL>/);
});

test('empty or missing stock list explains nothing is enabled yet', () => {
  assert.match(formatStockList([]), /No Coinbase Tokenized Stocks are enabled/);
  assert.match(formatStockList(undefined), /No Coinbase Tokenized Stocks are enabled/);
});
