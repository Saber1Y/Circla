import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSwapReceipt, formatContribution } from '../src/receipts.mjs';

test('formats Aerodrome swap receipts with Basescan link', () => {
  const out = formatSwapReceipt({ assetSymbol: 'NVDAc', amountOut: '1.14', valueUsdc: '250', txHash: '0xabc', explorerBase: 'https://sepolia.basescan.org' });
  assert.match(out, /Swap executed! 1\.14 NVDAc @ \$250/);
  assert.match(out, /sepolia\.basescan\.org\/tx\/0xabc/);
  assert.match(out, /scaledBalanceOf/);
});

test('formats contribution receipts deterministically', () => {
  const out = formatContribution({ member: 'you', amountUsdc: '50', txHash: '', explorerBase: 'https://sepolia.basescan.org' });
  assert.match(out, /\/contribute 50 USDC/);
});
