import {getAddress, parseAbi} from 'viem';

const EXPLORER_BASE = 'https://basescan.org';

const inviteAbi = parseAbi([
  'function owner() view returns (address)',
  'function circleOpen() view returns (bool)',
  'function maxMembers() view returns (uint8)',
  'function members() view returns (address[])',
  'function isMember(address) view returns (bool)',
  'function invited(address) view returns (bool)',
]);

// Reads everything /invite needs to tell a wallet where it stands. Vaults
// deployed before invites existed have no invited() getter: when only that
// read fails, the vault is treated as open-join (`supported: false`).
export async function readInviteStatus(client, vault, wallet) {
  const account = getAddress(wallet);
  const read = (functionName, args) => client.readContract({address: vault, abi: inviteAbi, functionName, args});
  const [owner, open, maxMembers, members, isMember] = await Promise.all([
    read('owner'),
    read('circleOpen'),
    read('maxMembers'),
    read('members'),
    read('isMember', [account]),
  ]);
  let invited = false;
  let supported = true;
  try {
    invited = await read('invited', [account]);
  } catch {
    supported = false;
  }
  return {
    wallet: account,
    owner: getAddress(owner),
    open,
    maxMembers: Number(maxMembers),
    memberCount: members.length,
    isMember,
    invited,
    supported,
  };
}

// One of: member, closed, full, open (legacy vault), invited, needs_invite.
export function inviteState(status) {
  if (status.isMember) return 'member';
  if (!status.open) return 'closed';
  if (status.memberCount >= status.maxMembers) return 'full';
  if (!status.supported) return 'open';
  return status.invited ? 'invited' : 'needs_invite';
}

const link = (addr) => `<a href="${EXPLORER_BASE}/address/${addr}">${addr.slice(0, 6)}…${addr.slice(-4)}</a>`;

// Builds the group reply for /invite <wallet>. `action` tells the caller which
// Mini App button to attach: 'invite' (owner panel), 'join', or null.
export function formatInviteReply(status) {
  const who = link(status.wallet);
  const seats = `${status.memberCount}/${status.maxMembers} seats taken`;
  switch (inviteState(status)) {
    case 'member':
      return {text: `${who} is already a member of this circle.`, action: null};
    case 'closed':
      return {text: `This circle is closed to new members, so ${who} cannot join.`, action: null};
    case 'full':
      return {text: `This circle is full (${seats}), so ${who} cannot join.`, action: null};
    case 'open':
      return {
        text: [`${who} can join now: this vault accepts any wallet while it is open.`, '', 'Open the app and tap Join circle.'].join('\n'),
        action: 'join',
      };
    case 'invited':
      return {text: [`${who} is invited.`, '', 'Open the app with that wallet and tap Join circle.'].join('\n'), action: 'join'};
    default:
      return {
        text: [
          `Invite request for ${who} (${seats}).`,
          '',
          `Circle owner ${link(status.owner)}: open the app, go to Actions → Circle membership, paste the address, and tap Invite.`,
          'The group is notified here once the invite confirms onchain.',
        ].join('\n'),
        action: 'invite',
      };
  }
}
