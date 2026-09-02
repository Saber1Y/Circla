# CIRCLA Security Model

## 1. Security Objective

CIRCLA must ensure that a Telegram agent can coordinate a group investment without obtaining unrestricted control of member funds.

The contract is the final enforcement layer.

Offchain policy checks improve user experience but do not replace onchain checks.

## 2. Trust Boundaries

### User

The user controls their wallet and confirms deposits and final execution approvals.

### Telegram

Telegram transports commands and buttons.

Telegram identity alone MUST NOT authorize a wallet transaction.

### Agent

The agent parses intent, reads state, formats proposals, and submits already-authorized actions.

The agent MUST NOT make arbitrary contract calls.

### Backend

The backend indexes events and manages conversational state.

The backend MUST be treated as an untrusted coordinator for financial correctness.

### Vault

The vault enforces membership, proposals, voting, caps, allowlists, oracle conditions, and withdrawals.

## 3. Required Controls

- Asset allowlist.
- Router allowlist.
- Per-proposal amount limit.
- Per-circle spending limit.
- Minimum output amount.
- Proposal expiry.
- Unique proposal nonce.
- One vote per member.
- Quorum requirement.
- Emergency pause.
- Restricted administration.
- Confirmed receipt handling.

## 4. Reentrancy and External Calls

State MUST be updated before external token or router calls where that ordering is safe.

External calls MUST use checked return values or safe wrappers.

The contract MUST use a reentrancy guard on deposit, execution, and withdrawal paths.

Router calldata MUST be constrained by the proposal and MUST NOT become an arbitrary-call escape hatch.

## 5. Agent Permission Model

The Telegram agent receives only the ability to:

- Read supported assets.
- Read circle state.
- Create a typed proposal.
- Record a vote through the approved interface.
- Submit an existing approved proposal for execution.

The agent does not receive permission to:

- Choose an arbitrary target.
- Choose an arbitrary token.
- Move funds outside the vault.
- Change policy.
- Change circle membership.
- Change an approved proposal.
- Bypass quorum.

## 6. Replay Protection

Every executable proposal MUST contain a unique nonce and expiry timestamp.

The vault MUST mark the nonce as consumed before or atomically with settlement.

Telegram callback payloads MUST be authenticated against the current proposal and circle.

Retries after network timeouts MUST use idempotent request identifiers and MUST never create a second proposal unintentionally.

## 7. B20 Policy Handling

The vault MUST read the configured B20 receiver policy using the token's policy scope.

The scope identifier is not itself the policy ID.

The vault MUST call the Policy Registry with the token's configured policy ID and recipient address.

An unauthorized B20 recipient MUST NOT receive a direct transfer.

The liquidation fallback MUST be independently guarded by router, output, and oracle checks.

## 8. Oracle Handling

The contract MUST read price, `updatedAt`, and pause-related state where available.

A stale feed MAY be displayed but MUST NOT be used for unsafe forced liquidation.

Corporate-action pauses MUST fail closed for value-sensitive settlement.

The system MUST expose the price timestamp to users.

## 9. Administrative Risk

Administrative functions MUST be protected by an explicit owner or role.

Admin changes SHOULD emit events.

The asset and router registry MUST not be mutable by the Telegram agent.

Production deployment would require multisig administration, timelocks, monitoring, and an independent audit.

## 10. Hackathon Limitation

CIRCLA is a prototype and MUST use small demo amounts.

It MUST NOT be represented as audited, production custody infrastructure, a broker, or financial advice.
