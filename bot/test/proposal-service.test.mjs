import assert from 'node:assert/strict';
import test from 'node:test';
import {buildProposalPreview} from '../src/proposal-service.mjs';

test('resolves proposals to official Base stock addresses', () => {
  const proposal = buildProposalPreview('buy 100 USDC of NVDAc');
  assert.equal(proposal.chainId, 8453);
  assert.equal(proposal.asset.token, '0xb20000000000000000000078ee7ce2fE4908108C');
  assert.equal(proposal.status, 'awaiting_votes');
});

test('rejects unsupported stock symbols', () => {
  assert.throws(() => buildProposalPreview('buy 100 USDC of FAKEc'), /unsupported Coinbase stock/);
});

test('enforces the proposal spending cap before execution', () => {
  assert.throws(() => buildProposalPreview('buy 101 USDC of NVDAc'), /between 0 and 100/);
});
