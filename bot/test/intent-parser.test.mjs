import assert from 'node:assert/strict';
import test from 'node:test';
import {parseIntent} from '../src/intent-parser.mjs';

test('parses a stock purchase command', () => {
  assert.deepEqual(parseIntent('/propose buy 100 nvdac'), {
    type: 'create_proposal',
    action: 'buy',
    amountUsdc: '100',
    assetSymbol: 'NVDAC',
    raw: '/propose buy 100 nvdac',
  });
});

test('parses natural language purchase intent', () => {
  assert.equal(parseIntent('buy 25 USDC of AAPLc').assetSymbol, 'AAPLC');
});

test('rejects malformed votes', () => {
  assert.equal(parseIntent('/vote maybe').type, 'unknown');
});

test('rejects unsupported asset syntax instead of guessing', () => {
  assert.equal(parseIntent('buy 50 of NVDAc').type, 'unknown');
});
