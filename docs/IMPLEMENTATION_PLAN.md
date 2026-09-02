# CIRCLA Implementation Plan

## 1. Delivery Goal

Ship a repeatable Telegram-to-Base flow that executes a real Coinbase Tokenized Stock purchase and proves the result with onchain receipts.

The implementation should optimize for a complete vertical slice rather than broad feature coverage.

## 2. Milestones

### Milestone 1: Repository and Contract Foundation

- Create the Base contract project.
- Add OpenZeppelin dependencies already used by the source projects where appropriate.
- Add Base network configuration.
- Define USDC, B20, Chainlink, Policy Registry, and router interfaces.
- Add the official initial asset registry entries.
- Add deployment and verification scripts.

Exit criteria:

- Contracts compile.
- Local tests run.
- Asset and feed addresses are configuration-driven.
- No private key is committed.

### Milestone 2: Circle and Claim Accounting

- Port the relevant ChainCircle group state model.
- Implement circle creation and membership.
- Implement USDC deposits.
- Implement pool-unit minting.
- Implement member claim reads.
- Emit events for every accounting change.

Exit criteria:

- First depositor receives the defined initial unit price.
- Later depositors receive pro-rata units.
- Claims remain deterministic after portfolio value changes.
- Reentrancy and access-control tests pass.

### Milestone 3: Governance and Policy Gate

- Port the ChainCircle proposal and voting concepts.
- Port the Spenda allowlist and cap concepts.
- Add proposal nonce and expiry.
- Add asset and router allowlists.
- Add per-trade and circle-level limits.
- Add emergency pause.

Exit criteria:

- A proposal cannot execute before quorum.
- A proposal cannot execute twice.
- An altered router, asset, amount, or minimum output is rejected.
- A policy rejection moves zero funds.

### Milestone 4: Real B20 Purchase

- Verify the selected Coinbase B20 token address.
- Verify its Chainlink feed.
- Verify the Aerodrome route and liquidity.
- Obtain a firm quote.
- Approve only the required allowance target.
- Execute the swap with minimum output protection.
- Read the resulting raw and scaled balances.

Exit criteria:

- A real transaction settles on Base.
- The receipt contains the expected token movement.
- The vault balance matches the decoded event data.
- The result can be opened in BaseScan.

### Milestone 5: Withdrawals

- Read the B20 receiver policy ID.
- Query the Base Policy Registry.
- Implement authorized B20 transfer.
- Implement guarded USDC liquidation fallback.
- Preserve claims when neither path is safe.

Exit criteria:

- Authorized B20 withdrawal succeeds.
- Unauthorized withdrawal does not blindly transfer B20.
- Liquidation has minimum output protection.
- Stale or paused oracle states fail closed.

### Milestone 6: Telegram Integration

- Adapt Aegis Telegram handlers.
- Add CIRCLA command tools.
- Add proposal preview cards.
- Add inline vote buttons.
- Add final execution confirmation.
- Add transaction status polling.
- Add BaseScan links.

Exit criteria:

- A clean Telegram user can join a circle.
- Two users can contribute.
- The group can vote and execute a purchase.
- The bot reports confirmed results only.

### Milestone 7: Demo and Submission

- Deploy the live project.
- Run the clean demo path.
- Record a public Loom video.
- Publish the submission tweet.
- Capture the Builder Code.
- Submit the Quest form.

Exit criteria:

- The live URL works without developer intervention.
- The public video shows real transactions.
- The project description fits in one or two lines.
- All required Quest fields are ready.

## 3. Source Repository Reuse

| Source | Use | Boundary |
|---|---|---|
| Spenda | Policy concepts, caps, allowlists, receipts | Port to Base; do not reuse BOT Chain deployments |
| ChainCircle | Circle state, contribution model, governance | Port to Base USDC; remove Push Chain and mock yield |
| Aegis | Telegram runtime, approvals, agent tool patterns | Replace Zerion/Solana execution with Base/B20 |
| KasPay | Invite links, status pages, receipt UX | Reuse UX patterns only; no Kaspa settlement code |
| flow-guard | Future recurring contributions | Deferred until source repository is confirmed |
| BlindMarkets | Future batched intents | Deferred until source repository is confirmed |
| lend402 | Future B20 credit | Deferred from Quest MVP |
| Binx | Alternative NLP patterns | Deferred until source repository is confirmed |

## 4. Recommended Work Order

The contract and accounting path should be implemented before the natural-language layer.

The Aerodrome route should be proven before the Telegram experience is polished.

Withdrawal fallback should be implemented after direct B20 custody is proven.

The demo should use explicit commands first, then add natural-language aliases.

## 5. Test Plan

- Unit test pool-unit arithmetic.
- Unit test proposal quorum and replay protection.
- Unit test asset and router allowlists.
- Unit test cap enforcement.
- Unit test B20 policy lookup.
- Unit test stale and paused feed rejection.
- Fuzz test deposits and withdrawals for conservation of value within rounding bounds.
- Integration test a real Base B20 balance read.
- Integration test a real quote and transaction simulation.
- End-to-end test the Telegram proposal and approval flow.
- Repeat the complete demo from a clean circle.

## 6. Delivery Risks

### Risk: Asset Route Unavailable

Mitigation: verify Aerodrome liquidity before committing to the selected asset and keep a second official asset configured.

### Risk: B20 Policy Blocks Demo Wallet

Mitigation: use eligible demo participants and test the receiver policy before recording.

### Risk: Telegram Wallet Friction

Mitigation: support a clear wallet-link flow and keep the demo group preconfigured without faking transactions.

### Risk: Oracle State Blocks Settlement

Mitigation: display oracle status and schedule the demo during a valid feed state.

### Risk: Scope Expansion

Mitigation: do not begin WhatsApp, lending, cross-chain, or autonomous recurring execution before the MVP acceptance criteria pass.
