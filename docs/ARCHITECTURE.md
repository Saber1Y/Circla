# CIRCLA Architecture

## 1. Design Principle

Telegram is the user interface, not the trust boundary.

The Base contracts are the source of truth for funds, proposals, votes, claims, and settlement.

The backend coordinates messages and indexing, but it cannot override contract policy.

## 2. System Context

```text
Telegram user
    |
    v
CIRCLA Telegram bot
    |
    v
Typed intent and approval service
    |
    +--> Circle and proposal reads
    |
    v
Policy-aware execution service
    |
    v
CirclaVault on Base
    |
    +--> Base USDC
    +--> Coinbase B20 tokenized stocks
    +--> Aerodrome router
    +--> B20 Policy Registry
    +--> Chainlink price feeds
```

## 3. Component Boundaries

### Telegram and Aegis Layer

The Aegis repository is the reference for Telegram transport, inline approvals, conversational state, and transaction status notifications.

The CIRCLA adapter MUST replace Solana and Zerion-specific tools with Base-specific tools.

The bot MUST convert user messages into typed intents before any transaction is constructed.

The bot MUST ask for clarification when the asset, amount, circle, or action is ambiguous.

### Group Coordination Layer

The ChainCircle repository is the reference for group membership, contribution schedules, circle progress, governance, and activity history.

The Push Chain and mock CUSD assumptions MUST be removed from the Base implementation.

The group layer SHOULD keep presentation metadata offchain while storing authorization-critical state onchain.

### Policy and Execution Layer

The Spenda repository is the reference for fail-closed policies, allowlists, spending caps, approvals, emergency revocation, and receipts.

Spenda's BOT Chain deployment MUST NOT be reused as a CIRCLA deployment.

The Base implementation MUST enforce the equivalent policy in `CirclaVault.sol`.

### Vault Layer

`CirclaVault.sol` owns pooled USDC and B20 assets.

It maintains pool units for member claims.

It validates group authorization before executing a trade.

It validates withdrawal policy before transferring B20.

### Market Data Layer

Coinbase Tokenized Stock addresses and Chainlink feeds MUST come from the official Base registry and technical documentation.

The frontend MAY cache market data for display, but settlement decisions MUST use fresh onchain reads.

### Receipt and Indexing Layer

The backend listens for vault events and Base receipts.

It stores transaction hashes and decoded metadata for fast Telegram responses.

Onchain state remains authoritative when the cache and chain disagree.

## 4. Onchain Data Model

### Circle

```text
Circle {
    id
    creator
    memberCount
    maxMembers
    quorum
    contributionTarget
    active
}
```

### Member

```text
Member {
    circleId
    wallet
    units
    depositedValue
    joinedAt
    active
}
```

### Proposal

```text
Proposal {
    id
    circleId
    proposer
    asset
    amountIn
    minAmountOut
    router
    deadline
    nonce
    yesVotes
    noVotes
    executed
    cancelled
}
```

### Asset Configuration

```text
AssetConfig {
    token
    priceFeed
    enabled
    decimals
    maxTradeAmount
}
```

## 5. Tokenized Stock Valuation

Coinbase's Chainlink tokenized-equity feeds report total-return values that incorporate the B20 multiplier.

The vault MUST value raw B20 units using the tokenized-stock feed.

```text
tokenValue = rawBalanceOf(vault) * tokenPrice
```

The vault MAY read `scaledBalanceOf(vault)` to display the adjusted underlying share quantity.

It MUST NOT multiply the scaled balance by a feed that already includes the multiplier.

All calculations MUST normalize token, USDC, and feed decimals before multiplication.

## 6. Proposal Execution

1. A member submits a proposal.
2. The contract validates the asset, amount, and expiry.
3. Members vote once each.
4. The contract records the quorum result.
5. An approved executor submits the exact swap data.
6. The contract verifies the proposal nonce, router, asset, amount, and deadline.
7. The contract executes the router call.
8. The contract records the resulting balances and emits a settlement event.
9. The backend waits for confirmation and posts the BaseScan receipt.

The agent MUST NOT be able to execute a proposal with modified parameters.

## 7. Withdrawal Execution

1. The member requests a withdrawal.
2. The contract calculates the member's claim from pool units.
3. If the claim is B20, the contract reads the token's configured receiver policy.
4. The Policy Registry is queried with the configured policy ID and recipient.
5. An authorized recipient receives B20.
6. An unauthorized recipient may receive USDC after a guarded liquidation.
7. If no safe path exists, the claim remains recorded and the operation explains why it was deferred.

## 8. Offchain Trust Rules

The backend MUST treat Telegram user IDs as presentation identities, not wallet identities.

Every value-moving operation MUST resolve to a verified wallet address.

The backend MUST not mark deposits, trades, or withdrawals complete before receipt confirmation.

The backend MUST use idempotency keys for retries after timeouts.

## 9. Deployment Environments

Local development uses Foundry or Hardhat with B20-compatible test doubles only for unit tests.

Integration testing uses a Base environment supported by the Quest and verified asset availability.

The final demo uses Coinbase Tokenized Stocks on Base and publicly inspectable receipts.

The deployment configuration MUST separate test keys, operational keys, and user-facing configuration.
