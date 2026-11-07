import assert from 'node:assert/strict';
import test from 'node:test';
import {VAULT_DEPLOY_BLOCK, baseRpcUrls, peekContributionTotals, syncContributionTotals} from '../src/base-client.mjs';

const member = '0x62f5a416c0077472822B3Ceb60bA2A6577D68784';
let vaultSeq = 0;
const freshVault = () => `0x${(++vaultSeq).toString(16).padStart(40, '0')}`;

// A fake chain with deposits at given block offsets from the deploy block.
function fakeClient({head, deposits, maxRange = Infinity, failOnce = new Set()}) {
  const calls = [];
  return {
    calls,
    async getBlockNumber() {
      return head;
    },
    async getLogs({fromBlock, toBlock}) {
      calls.push([fromBlock, toBlock]);
      if (toBlock - fromBlock + 1n > maxRange) throw new Error('range too large');
      const key = String(fromBlock);
      if (failOnce.has(key)) {
        failOnce.delete(key);
        throw new Error('429 request limit reached');
      }
      return deposits
        .filter((d) => d.block >= fromBlock && d.block <= toBlock)
        .map((d, i) => ({blockNumber: d.block, logIndex: i, transactionHash: `0x${d.block.toString(16)}`, args: {member, amount: d.amount}}));
    },
  };
}

test('configured RPC URLs come first, then public fallbacks, without duplicates', () => {
  assert.deepEqual(baseRpcUrls({BASE_RPC_URL: 'https://my.rpc/key'}), ['https://my.rpc/key', 'https://mainnet.base.org', 'https://base-rpc.publicnode.com']);
  assert.deepEqual(baseRpcUrls({BASE_RPC_URLS: 'https://a, https://mainnet.base.org'}), ['https://a', 'https://mainnet.base.org', 'https://base-rpc.publicnode.com']);
  assert.deepEqual(baseRpcUrls({}), ['https://mainnet.base.org', 'https://base-rpc.publicnode.com']);
});

test('scans the history once, then only new blocks', async () => {
  const vault = freshVault();
  const deposits = [{block: VAULT_DEPLOY_BLOCK + 5n, amount: 1_000_000n}, {block: VAULT_DEPLOY_BLOCK + 25_000n, amount: 2_000_000n}];
  const client = fakeClient({head: VAULT_DEPLOY_BLOCK + 30_000n, deposits});
  assert.equal(peekContributionTotals(vault).complete, false);
  await syncContributionTotals(client, vault, {pauseMs: 0});
  const first = peekContributionTotals(vault);
  assert.equal(first.complete, true);
  assert.equal(first.totals.get(member.toLowerCase()), 3_000_000n);
  const callsAfterHistory = client.calls.length;

  deposits.push({block: VAULT_DEPLOY_BLOCK + 30_010n, amount: 500_000n});
  client.getBlockNumber = async () => VAULT_DEPLOY_BLOCK + 30_020n;
  await syncContributionTotals(client, vault, {pauseMs: 0});
  assert.equal(peekContributionTotals(vault).totals.get(member.toLowerCase()), 3_500_000n);
  assert.equal(client.calls.length, callsAfterHistory + 1);
  assert.equal(client.calls.at(-1)[0], VAULT_DEPLOY_BLOCK + 30_001n);
});

test('halves the range when an endpoint caps eth_getLogs', async () => {
  const vault = freshVault();
  const client = fakeClient({head: VAULT_DEPLOY_BLOCK + 6_000n, deposits: [{block: VAULT_DEPLOY_BLOCK + 5_999n, amount: 7n}], maxRange: 2_500n});
  await syncContributionTotals(client, vault, {pauseMs: 0});
  assert.equal(peekContributionTotals(vault).totals.get(member.toLowerCase()), 7n);
  assert.ok(client.calls.every(([from, to]) => to - from + 1n <= 10_000n));
});

test('keeps progress when a scan fails and resumes from there', async () => {
  const vault = freshVault();
  const head = VAULT_DEPLOY_BLOCK + 25_000n;
  // Fails every attempt at the third chunk until the range bottoms out.
  const failing = {
    async getBlockNumber() {
      return head;
    },
    async getLogs({fromBlock}) {
      if (fromBlock >= VAULT_DEPLOY_BLOCK + 20_000n) throw new Error('429 request limit reached');
      return [];
    },
  };
  await assert.rejects(syncContributionTotals(failing, vault, {pauseMs: 0}));
  assert.equal(peekContributionTotals(vault).complete, false);

  const healthy = fakeClient({head, deposits: []});
  await syncContributionTotals(healthy, vault, {pauseMs: 0});
  assert.equal(healthy.calls[0][0], VAULT_DEPLOY_BLOCK + 20_000n);
  assert.equal(peekContributionTotals(vault).complete, true);
});

test('concurrent callers share one scan', async () => {
  const vault = freshVault();
  const client = fakeClient({head: VAULT_DEPLOY_BLOCK + 15_000n, deposits: []});
  await Promise.all([syncContributionTotals(client, vault, {pauseMs: 0}), syncContributionTotals(client, vault, {pauseMs: 0})]);
  assert.equal(client.calls.length, 2);
});
