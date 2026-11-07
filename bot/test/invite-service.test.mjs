import assert from 'node:assert/strict';
import test from 'node:test';
import {formatInviteReply, inviteState, readInviteStatus} from '../src/invite-service.mjs';
import {formatEvent} from '../src/onchain-watcher.mjs';

const wallet = '0x62f5a416c0077472822B3Ceb60bA2A6577D68784';
const owner = '0xcDdb81532740E54b89300595C7586480260FCb7f';
const base = {wallet, owner, open: true, maxMembers: 5, memberCount: 2, isMember: false, invited: false, supported: true};

function stubClient(values, {legacy = false} = {}) {
  return {
    async readContract({functionName}) {
      if (functionName === 'invited' && legacy) throw new Error('execution reverted');
      return values[functionName];
    },
  };
}

test('classifies every invite state', () => {
  assert.equal(inviteState({...base, isMember: true}), 'member');
  assert.equal(inviteState({...base, open: false}), 'closed');
  assert.equal(inviteState({...base, memberCount: 5}), 'full');
  assert.equal(inviteState({...base, supported: false}), 'open');
  assert.equal(inviteState({...base, invited: true}), 'invited');
  assert.equal(inviteState(base), 'needs_invite');
});

test('an uninvited wallet gets an owner prompt and the invite panel button', () => {
  const reply = formatInviteReply(base);
  assert.equal(reply.action, 'invite');
  assert.match(reply.text, /2\/5 seats taken/);
  assert.match(reply.text, /Circle owner/);
  assert.match(reply.text, new RegExp(owner));
});

test('an invited wallet is told to join', () => {
  const reply = formatInviteReply({...base, invited: true});
  assert.equal(reply.action, 'join');
  assert.match(reply.text, /is invited/);
});

test('members, closed and full circles get no button', () => {
  assert.equal(formatInviteReply({...base, isMember: true}).action, null);
  assert.equal(formatInviteReply({...base, open: false}).action, null);
  assert.equal(formatInviteReply({...base, memberCount: 5}).action, null);
});

test('reads status from the vault and checksums the wallet', async () => {
  const client = stubClient({owner, circleOpen: true, maxMembers: 5, members: [owner], isMember: false, invited: true});
  const status = await readInviteStatus(client, owner, wallet.toLowerCase());
  assert.equal(status.wallet, wallet);
  assert.equal(status.memberCount, 1);
  assert.equal(status.invited, true);
  assert.equal(status.supported, true);
});

test('a vault without invited() is treated as open-join', async () => {
  const client = stubClient({owner, circleOpen: true, maxMembers: 5, members: [], isMember: false}, {legacy: true});
  const status = await readInviteStatus(client, owner, wallet);
  assert.equal(status.supported, false);
  assert.equal(inviteState(status), 'open');
});

test('formats invite and close events for the group feed', () => {
  const invitedText = formatEvent({eventName: 'InviteChanged', args: {account: wallet, invited: true}}, {name: 'Nairobi Tech Circle'});
  assert.match(invitedText, /was invited to Nairobi Tech Circle/);
  const revokedText = formatEvent({eventName: 'InviteChanged', args: {account: wallet, invited: false}}, {name: 'Nairobi Tech Circle'});
  assert.match(revokedText, /invite to Nairobi Tech Circle was revoked/);
  assert.match(formatEvent({eventName: 'CircleClosed', args: {}}, {name: 'Nairobi Tech Circle'}), /closed to new members/);
});

test('decodes ProposalCreated with the contract layout (asset indexed)', async () => {
  const {encodeAbiParameters, encodeEventTopics, parseEventLogs} = await import('viem');
  const {vaultEventsAbi} = await import('../src/onchain-watcher.mjs');
  const asset = '0xb20000000000000000000078ee7ce2fE4908108C';
  const topics = encodeEventTopics({abi: vaultEventsAbi, eventName: 'ProposalCreated', args: {proposalId: 1n, proposer: owner, asset}});
  const data = encodeAbiParameters([{type: 'uint256'}, {type: 'uint256'}, {type: 'uint256'}], [5_000_000n, 2_612_920n, 1_793_969_762n]);
  const [log] = parseEventLogs({abi: vaultEventsAbi, logs: [{topics, data, address: owner, blockNumber: 1n, logIndex: 0, transactionHash: '0x' + '0'.repeat(64), transactionIndex: 0, blockHash: '0x' + '0'.repeat(64), removed: false}]});
  assert.equal(log.args.asset.toLowerCase(), asset.toLowerCase());
  assert.equal(log.args.amountIn, 5_000_000n);
  assert.equal(log.args.minAmountOut, 2_612_920n);
  assert.equal(log.args.deadline, 1_793_969_762n);
});

test('announces both withdrawal paths in the group feed', () => {
  const usdc = formatEvent({eventName: 'LiquidationWithdrawal', args: {member: wallet, units: 5n * 10n ** 18n, reservedUsdc: 0n, liquidatedUsdc: 4_995_000n}}, {name: 'Circle'});
  assert.match(usdc, /withdrew 5 units as 4\.995 USDC/);
  const raw = formatEvent({eventName: 'Withdrawal', args: {member: wallet, units: 10n ** 18n, usdcAmount: 1_000_000n, assetAmount: 2_644_824n}}, {name: 'Circle'});
  assert.match(raw, /withdrew 1 units: 1 USDC \+ 0\.02644824 in stock/);
});
