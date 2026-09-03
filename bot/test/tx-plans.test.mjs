import assert from 'node:assert/strict';
import test from 'node:test';
import {depositPlan, joinPlan, proposalPlan, votePlan} from '../src/tx-plans.mjs';

const vault = '0x1111111111111111111111111111111111111111';
const usdc = '0x2222222222222222222222222222222222222222';
const asset = '0x3333333333333333333333333333333333333333';
const router = '0x4444444444444444444444444444444444444444';

test('builds a join call without value transfer', () => {
  const plan = joinPlan(vault);
  assert.equal(plan.to, vault);
  assert.equal(plan.value, 0n);
  assert.match(plan.data, /^0x/);
});

test('builds exact USDC approval and deposit calls', () => {
  const [approval, deposit] = depositPlan({vault, usdc, amountUsdc: '50'});
  assert.equal(approval.to, usdc);
  assert.equal(deposit.to, vault);
  assert.match(approval.data, /^0x095ea7b3/);
});

test('builds a proposal and vote call with integer arguments', () => {
  const proposal = proposalPlan({vault, asset, router, amountUsdc: '100', minAmountOut: '1000000'});
  const vote = votePlan({vault, proposalId: 4, support: true});
  assert.match(proposal.data, /^0x/);
  assert.match(vote.data, /^0x/);
});
