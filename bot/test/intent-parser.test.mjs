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

test('parses /invite with and without a wallet', () => {
  assert.deepEqual(parseIntent('/invite'), {type: 'invite', wallet: undefined, raw: '/invite'});
  const intent = parseIntent('/invite 0x62f5a416c0077472822B3Ceb60bA2A6577D68784');
  assert.equal(intent.type, 'invite');
  assert.equal(intent.wallet, '0x62f5a416c0077472822B3Ceb60bA2A6577D68784');
  assert.equal(parseIntent('/invite not-a-wallet').type, 'unknown');
});

test('accepts the @botname suffix Telegram adds in groups', () => {
  assert.equal(parseIntent('/vote@circlabasebot yes').support, true);
  assert.equal(parseIntent('/deposit@circlabasebot 25').amountUsdc, '25');
  assert.equal(parseIntent('/invite@circlabasebot 0x62f5a416c0077472822B3Ceb60bA2A6577D68784').type, 'invite');
});
