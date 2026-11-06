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
