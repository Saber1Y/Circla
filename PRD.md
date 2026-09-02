# CIRCLA Product Requirements Document

## 1. Product Summary

CIRCLA is a Telegram-native group investing experience for eligible users who want to collectively buy and use Coinbase Tokenized Stocks on Base.

Friends create a private investment circle, contribute USDC, vote on a stock purchase, and receive transparent pro-rata claims on the circle's portfolio.

The Telegram agent handles conversation and coordination.

The Base smart contract controls custody, accounting, policy enforcement, and settlement.

The agent can propose an action, but it cannot bypass the group's vote or the vault's onchain guardrails.

## 2. Builder Quest Fit

The Base Builder Quest asks builders to create something real that helps people trade or use Coinbase Tokenized Stocks on Base.

CIRCLA addresses that requirement by making tokenized-stock ownership accessible through an existing social behavior: a savings and investment circle.

The product is directly aligned with Base's published builder opportunities:

- Social and crypto-native coordination around equities.
- Simpler access to tokenized stocks for eligible users in emerging markets.
- Agent-assisted portfolio execution.
- Composable use of B20 assets inside a Base smart contract.
- Shared and personalized portfolio construction.

## 3. Problem

Tokenized stocks are available on Base, but buying them still assumes that each user independently understands wallets, approvals, DEX routing, stock-token addresses, price data, and portfolio accounting.

Many communities already save and make financial decisions together, but existing savings-circle products do not provide transparent onchain ownership of programmable equity.

CIRCLA combines the social coordination of a savings circle with real B20 asset settlement on Base.

## 4. Target Users

The initial target user is an eligible non-US adult who:

- Participates in a trusted private group.
- Wants exposure to tokenized US equities.
- Prefers Telegram over a standalone financial application.
- Needs a simple, auditable group decision process.
- Is willing to connect a Base wallet and use USDC.

CIRCLA is not designed for anonymous public investment pools in the hackathon MVP.

## 5. Hackathon MVP

The MVP must demonstrate this complete flow:

```text
Telegram invite
-> wallet onboarding
-> USDC contribution
-> stock proposal
-> group vote
-> vault policy validation
-> Aerodrome B20 purchase
-> pro-rata portfolio claims
-> portfolio read
-> B20 or USDC withdrawal
-> BaseScan receipt
```

The MVP supports:

- Telegram as the only social interface.
- Base as the only network.
- USDC contributions.
- One active circle per demo environment.
- Three to five circle members.
- One active investment proposal at a time.
- Coinbase Tokenized Stocks from the official Base registry.
- Initial assets `NVDAc` and `AAPLc`, subject to route and availability checks.
- Aerodrome as the primary swap venue.
- Explicit Telegram approval before value-moving execution.
- Internal pro-rata ownership claims.
- Direct B20 withdrawal when the recipient is authorized.
- USDC liquidation fallback when direct B20 delivery is not authorized and a safe route exists.

## 6. Non-Goals for the Quest Submission

The following are deferred:

- WhatsApp integration.
- Cross-chain circles.
- Public permissionless investment pools.
- Lending against B20 shares.
- Complex rotating payout schedules.
- Multiple simultaneous strategies.
- Fully autonomous high-value execution without confirmation.
- Investment advice or stock recommendations.
- Production custody or regulatory claims.

## 7. User Experience

### 7.1 Onboarding

1. A member opens a private Telegram invite link.
2. CIRCLA explains that tokenized stocks are available only to eligible users outside the United States.
3. The member connects or registers a Base wallet.
4. CIRCLA displays the circle rules, contribution target, supported assets, and spending limits.
5. The member deposits USDC through a wallet approval flow.

### 7.2 Commands

The MVP supports typed commands and natural-language equivalents:

| Command | Purpose |
|---|---|
| `/start` | Start the bot and view eligibility notice |
| `/create` | Create a private investment circle |
| `/invite` | Generate a circle invite link |
| `/status` | Show contributions and proposal state |
| `/deposit 50` | Begin a USDC deposit |
| `/propose buy 100 NVDAc` | Create a stock purchase proposal |
| `/vote yes` | Vote on the active proposal |
| `/portfolio` | Show holdings, value, and ownership |
| `/withdraw` | Request B20 or USDC withdrawal |
| `/help` | Show supported commands |

### 7.3 Proposal Example

```text
Member: Buy $100 of NVDAc

CIRCLA:
Proposal #4
Asset: NVDAc
Input: 100 USDC
Venue: Aerodrome
Minimum output: 0.XXX NVDAc
Required votes: 2 of 3
Expires: 30 minutes

[Approve] [Reject]
```

After quorum and final confirmation:

```text
CIRCLA:
Proposal #4 executed.
Bought: 0.XXX NVDAc
Vault value: $100.00
Transaction: https://basescan.org/tx/...
```

## 8. Functional Requirements

### FR-1 Circle Creation

The system MUST allow a creator to configure:

- Circle name.
- Maximum member count.
- Contribution target.
- Voting quorum.
- Supported token assets.
- Per-trade limit.
- Proposal expiry.

The system MUST keep circles private by default.

### FR-2 Membership

The system MUST associate a Telegram identity with a verified Base wallet address.

The system MUST prevent an address from being added twice to the same circle.

The system MUST allow the circle creator to stop new members joining.

### FR-3 USDC Contributions

The vault MUST accept Base USDC contributions.

Each contribution MUST emit an event containing the circle, member, amount, and resulting claim units.

The backend MUST wait for a confirmed transaction before marking a contribution complete.

### FR-4 Investment Proposals

A proposal MUST contain:

- Circle ID.
- Proposer.
- B20 asset address.
- USDC input amount.
- Minimum B20 output.
- Approved router address.
- Expiration timestamp.
- Unique nonce.

The vault MUST reject proposals for unsupported assets, unsupported routers, expired proposals, duplicate nonces, and amounts above the configured limit.

### FR-5 Voting

Only current circle members MAY vote.

Each member MAY vote once per proposal.

The MVP uses one-member-one-vote quorum.

Execution MUST require the configured quorum and a final confirmation from the circle operator or approved executor.

### FR-6 B20 Execution

The vault MUST execute only an approved proposal.

The swap MUST enforce a minimum output amount.

The vault MUST approve only the configured router or allowance target for the exact input amount.

The system MUST record the input asset, output asset, amounts, venue, and transaction hash.

### FR-7 Portfolio Accounting

Member claims MUST be represented by internal pool units rather than raw stock-token balances.

For a contribution into an existing pool:

```text
newUnits = contributionValue * totalUnits / poolValueBeforeContribution
```

For the first contribution, the system MUST use a defined initial unit price.

The accounting system MUST include USDC and every held B20 asset in pool value.

### FR-8 B20 Valuation

For value calculations, the system MUST use the raw B20 balance multiplied by the tokenized-stock Chainlink price feed.

```text
tokenValue = rawBalanceOf(vault) * tokenPrice
```

The system MAY use `scaledBalanceOf` to display the multiplier-adjusted underlying share quantity.

The system MUST NOT multiply `scaledBalanceOf` by a Chainlink feed that already includes the B20 multiplier.

The system MUST normalize B20 decimals, USDC decimals, and Chainlink feed decimals before arithmetic.

### FR-9 B20 Withdrawal

The vault MUST retrieve the B20 token's configured receiver policy using `policyId(TRANSFER_RECEIVER_POLICY)`.

The vault MUST query the Base Policy Registry with that policy ID and the requested recipient.

If the recipient is authorized, the vault MAY transfer the calculated raw B20 amount.

If the recipient is not authorized, the vault MAY liquidate the claim into USDC only when a valid route, safe oracle state, and minimum output are available.

If neither path is safe, the vault MUST preserve the claim and return a clear reason.

### FR-10 Oracle Safety

The system MUST display the feed timestamp and price status.

The system MUST distinguish between an off-hours frozen price and an unsafe or paused price.

The system MUST NOT force a sale or liquidation against a corporate-action-paused or otherwise unsafe feed.

Deposits, chat, and voting MAY continue while settlement is paused.

### FR-11 Receipts

Every value-moving action MUST have:

- Transaction hash.
- BaseScan URL.
- Confirmed or failed status.
- Decoded action type.
- Circle and member context.

The bot MUST never report an action as complete before transaction confirmation.

## 9. Smart Contract Requirements

The initial contract set SHOULD contain:

- `CirclaVault.sol` for custody, pool units, proposals, execution, and withdrawals.
- `CirclaAssetRegistry.sol` or an equivalent registry for approved B20 tokens, feeds, and routers.
- Optional deployment helpers and mocks for local testing only.

The contract SHOULD expose:

```solidity
function depositUSDC(uint256 circleId, uint256 amount) external;
function createProposal(uint256 circleId, address asset, uint256 amountIn, uint256 minAmountOut, uint256 deadline) external returns (uint256);
function vote(uint256 proposalId, bool support) external;
function executeProposal(uint256 proposalId, bytes calldata swapData) external;
function portfolioValue(uint256 circleId) external view returns (uint256);
function memberClaim(uint256 circleId, address member) external view returns (uint256);
function withdraw(uint256 circleId, uint256 claimUnits, address recipient) external;
```

The exact ABI may change during implementation, but all value-moving methods MUST preserve the stated invariants.

## 10. Offchain Services

### Telegram Runtime

The Aegis repository is the reference for:

- Telegram message handling.
- Inline approval buttons.
- Persistent conversational state.
- Structured tool calls.
- Transaction status messages.

The CIRCLA runtime MUST replace Solana and Zerion-specific execution with Base and B20 adapters.

### Intent Parser

The parser MUST produce typed intents and reject ambiguity.

It MUST never infer an asset from an unverified ticker alone.

The asset address MUST resolve from the official CIRCLA asset registry.

### Indexing and Receipts

The backend SHOULD listen for vault events and confirmed Base receipts.

Database state MUST be treated as a cache of onchain truth, not as the source of financial balances.

## 11. Security Requirements

- The agent MUST have no arbitrary-call capability.
- The vault MUST use checks-effects-interactions ordering.
- External token and router calls MUST verify success.
- Execution MUST be protected against replay with a proposal nonce and expiry.
- The vault MUST enforce token and router allowlists onchain.
- Spending caps MUST be enforced onchain.
- Emergency pause MUST stop settlement without silently changing member claims.
- Administrative changes MUST be restricted and auditable.
- User-controlled arrays MUST not create unbounded execution loops.
- Oracle failures MUST fail closed for value-moving operations.

This is a hackathon prototype and is not audited or suitable for production user funds.

## 12. Quest Demo Acceptance Criteria

The submission is ready only when all of the following are true:

- A new user can join from a Telegram invite.
- At least two wallets can contribute Base USDC.
- A group can create and vote on a tokenized-stock proposal.
- The valid proposal executes a real B20 purchase on Base.
- The portfolio reads live B20 holdings and Chainlink data.
- Member claims are calculated from live contract state.
- An invalid asset, router, amount, or vote is rejected.
- A withdrawal or liquidation produces a real transaction.
- Every value-moving transaction links to BaseScan.
- The flow can be repeated from a clean circle.
- The video and live URL show the real product, not a simulated success screen.

## 13. Legal and Eligibility Notice

Coinbase Tokenized Stocks are issued under applicable issuer terms and are available only to eligible users in permitted non-US jurisdictions.

CIRCLA MUST display this restriction during onboarding and MUST NOT represent itself as a broker, custodian, financial adviser, or issuer.

The Quest demo MUST use only eligible participants and must clearly label the deployment environment and asset availability.

## 14. Official References

- Quest announcement: https://x.com/buildonbase/status/2095105184120664122
- Quest submission form: https://docs.google.com/forms/d/e/1FAIpQLSfru57ZLO9AQ-hgWX_G5ZAzmAKkzFLZCyqe5wTyBSwACFX5tg/viewform
- Base tokenized stocks: https://www.base.org/stocks
- Base tokenized stock launch: https://blog.base.org/tokenized-stocks
- Base builder request: https://blog.base.org/request-for-builders-tokenized-stocks
- B20 technical documentation: https://docs.base.org/specifications/b20/tokenized-stocks-on-base
- Aerodrome: https://aerodrome.finance/
