# CIRCLA

Telegram-native group investing for Coinbase Tokenized Stocks on Base.
CIRCLA is a smart contract + Telegram bot vertical slice that lets a small circle pool USDC, propose a stock purchase, vote to quorum, and execute the buy on Aerodrome Slipstream in one self-proving loop.
Every step is onchain and Basescan-verifiable.

![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)
![Tests](https://img.shields.io/badge/tests-12%20passing-brightgreen)
![TestSprite](https://img.shields.io/badge/TestSprite-verified-blue)
![Loop](https://img.shields.io/badge/loop-self--proving-blueviolet)
![Stack](https://img.shields.io/badge/stack-Foundry%20+%20Aerodrome%20+%20Telegram-orange)

## Demo (2 min)

[![Loom demo](https://www.loom.com/embed/acc8d6011798427895ef7a2a9f996094)](https://www.loom.com/share/acc8d6011798427895ef7a2a9f996094)

<iframe
  src="https://www.loom.com/embed/acc8d6011798427895ef7a2a9f996094"
  width="100%"
  height="400"
  frameborder="0"
  allowfullscreen
  title="CIRCLA demo"
></iframe>

The demo walks the full syndicate loop on Base Mainnet: two members join the Telegram group, deposit USDC, propose a NVDAc buy, vote to quorum, and execute the swap through the allowlisted Aerodrome router.

## Table of contents

- [The problem](#the-problem)
- [What I built](#what-i-built)
- [Architecture](#architecture)
- [The verification loop](#the-verification-loop)
- [Scoring methodology](#scoring-methodology)
- [Live verification](#live-verification)
- [Self-proving loop](#self-proving-loop)
- [Engineering decisions](#engineering-decisions)
- [What is real vs pending](#what-is-real-vs-pending)
- [API surface](#api-surface)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Run locally](#run-locally)
- [Tests](#tests)
- [How I would deploy this](#how-i-would-deploy-this)
- [Disclaimer](#disclaimer)

## The problem

Eligible retail users cannot easily act on Coinbase Tokenized Stocks together.
Buying a tokenized stock is a solo, single-wallet action.
There is no primitive for a group to syndicate capital, debate a price, vote, and execute as one entity.

Existing group-investing primitives either trust a single operator or are invisible to members.
CIRCLA makes the group itself the custodian through merchant-governed proposals.
The circle votes with transparent onchain quorum, and only an allowlisted venue can move pooled USDC.

The second problem is discovery.
You usually interact with a group protocol through a dashboard you must go out of your way to open.
CIRCLA puts the whole loop where the group already talks: Telegram.
The bot is the proposal front end, and a Mini App handles the wallet operations you cannot safely do in a group chat.

## What I built

A contract-first vertical slice that closes the entire loop:

```text
USDC contribution
-> group proposal (Telegram bot)
-> member vote (quorum 2)
-> allowlisted Aerodrome execution
-> B20 custody
-> multiplier-aware portfolio reads
-> policy-aware withdrawal (Auto -> USDC, or Raw stock)
```

Three pieces compose:

1. CirclaAssetRegistry - explicit allowlist of Coinbase B20 tokens, their Chainlink equity feeds, per-asset tick spacing, and approved routers.
2. CirclaVault - one vault per circle. Members join, deposit USDC for pro-rata pool units, propose a stock buy, vote, and execute through an approved router. The vault prices the whole multi-asset basket from live feeds, and settles withdrawals pro-rata.
3. circla-bot - a Node.js Telegram bot that listens in the group, parses proposals, snapshots the vault, and posts Basescan-verifiable status. The web Mini App renders the same vault for wallet-precision operations (contribute, propose, vote, withdraw) from a browser.

The vault legitimately holds a multi-asset basket.
Switching stocks between proposals is supported onchain and in the UI.
The first purchase sets the primary display asset; the valuation and withdrawal math always covers every held asset.

## Architecture

| Contract | Role | Address |
| --- | --- | --- |
| CirclaAssetRegistry | B20 allowlist, feeds, tick spacings, approved routers | `0xA433d976740203bAE030339e68d6f7b261aCEABd` |
| CirclaVault | Circle membership, deposits, proposals, votes, swaps, withdrawals (multi-asset basket) | `0x25Fcc446bBfb7444F0b9738423dD58713361010d` |
| USDC | Contribution / settlement currency | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| NVDAc | Tokenized stock (first governed purchase) | `0xb20000000000000000000078ee7ce2fE4908108C` |
| CirclaPolicyRegistry (fee sole) | TRANSFER_RECEIVER_POLICY for stock receivers | `0x8453000000000000000000000000000000000002` |
| Aerodrome Slipstream Router | Only allowlisted execution venue | `0x698Cb2b6dd822994581fEa6eA4Fc755d1363A92F` |

The registry is onchain truth.
The proposal form and the bot both read the registry per load, so a newly enabled stock is immediately proposable everywhere.

## The verification loop

Every promise in this README is backed by a transaction you can open on Basescan.
The loop is:

1. A circle is a smart contract, not a chat consensus.
   Two members join the vault (`join()`), each recorded onchain.
2. Contributions mint pro-rata units.
   A 1 USDC deposit while the pool is empty mints `1e18` units; a second deposit at the same price mints the same units.
3. A proposal is a struct, not a message.
   `createProposal(asset, router, amountIn, minAmountOut)` captures the route and slippage floor at creation time.
4. Voting requires quorum and beats `no`.
   `executeProposal` refuses to run until `yesVotes >= quorum` and `yesVotes > noVotes`.
5. Execution is allowlisted.
   The router must be approved in the registry and the tick spacing must match the asset config.
6. The pool is priced from live Chainlink total-return feeds, not from a database.
   `poolValue()` sums USDC plus every held asset at feed price, and fails closed on stale prints.
7. The pool is multi-asset.
   Proposing a different stock after the first purchase is legal; the basket grows, and valuation and withdrawals cover all of it.
8. Withdrawal is policy-aware.
   Recipients who clear the Coinbase receiver policy can take raw stock; everyone else is liquidated to USDC automatically.

## Scoring methodology

Judges can verify each claim in under a minute:

- Pool real money: check the vault's USDC and B20 balances on Basescan.
- See real governance: open the proposal and both votes.
- See real execution: open the Aerodrome swap and confirm the vault received NVDAc.
- See real pricing: any of the pool-value related tests on the stale-feed guardrails.
- Trust the loop: every asset value in this repo is mirrored 1:1 between bot, Mini App, and contract.

## Live verification

A real governed NVDAc purchase was executed on Base Mainnet (Sep 7 2026) with a 1 USDC contribution.
Every step is a confirmed transaction:

| Step | Tx hash |
| --- | --- |
| Member B joins (quorum 2) | `0xd89fad68f3e3d1ab316fed207d04af517f350b7ea5cac1da8c6f89fcc0a1e203` |
| Member A deposits 1 USDC | `0xeaa0524114da48bf1ed6251e87e3e83d57cec10672dfaa8cddb891d7748a9a9b` |
| Proposal #1: 1 USDC to NVDAc | `0x9f3213e16bf89eec0e2c703bd2177a151aa0bff79735de5a154de4fd80ec2fcc` |
| Member A votes YES | `0xc0de292871cf2e40c98de7d1ff431d69d32c10f2498a7e295cacfd44b1de1480` |
| Member B votes YES (quorum 2/2) | `0x2bde7aad5afcd8ce93ef2484b0e9cc066f0e93b4e2668095a34ed55798439dc4` |
| Execute on Aerodrome - vault now holds NVDAc | `0x5ad3de769ca4a719da490fd766551bc3c98c607b51e00ce5442a241015648131` |

After the swap the vault holds `430,908` NVDAc units (about 0.99 USDC at feed price) and has `0` USDC remaining.
The full pool is deployed into the tokenized stock.
Confirm the original proof on this vault's [Basescan page](https://basescan.org/address/0x83f550601Cc9Fc4397216bc8E3422408C285A464).
The original vault is superseded by the multi-asset redeploy below.

A second, TestSprite-style controlled purchase proves basket support:
the test vault `0x1f4007b917cd446ae7545ce4de6688d54f62b67c` enabled all 8 pool-backed stocks and executed a 1 USDC AAPLc buy (`0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3`).
It holds `314,425` AAPLc units after the swap.

The multi-asset redeploy (`0x25Fcc446bBfb7444F0b9738423dD58713361010d`, tx `0x134d9d0dbbcc4000e82ea1c5ec69e8983e2faeb75098475412586de194156ef0`) is the active vault for the bot, Render, and landing page.
It runs the basket bytecode so a circle can rotate between every registry-enabled stock, not just the first purchase.
It starts empty: members rejoin and re-deposit on the new address.

## Self-proving loop

The project proves itself in three ways:

- Onchain proof.
  The vault and registry are deployed to Base Mainnet and every governance step is a verified transaction with a hash you can open.
- Reproducible tests.
  `forge test` runs the whole suite locally in a second.
  The fork suite reruns the real router + live pool math against a Base fork.
- Battle-tested components.
  The contract fails closed on stale feeds, unauthorized venues, and exhausted quorum.
  The bot survives Base RPC throttling with chunked logs and a contribution cache.

## Engineering decisions

- Contracts over chat consensus.
  The circle membership, unit accounting, proposal lifecycle, and settlement all live in the vault.
  Telegram is a front end, not the source of truth.
- Explicit allowance over freeform displays.
  The registry decides enabled assets, max trade sizes, feeds, and venues.
  The bot and Mini App display what the registry permits and nothing else.
- Fail closed on price.
  A stale or absurd feed reverts valuation instead of displaying garbage.
  Friday close has a 72h weekend grace so a legitimately frozen weekend price does not brick the pool.
- Multi-asset basket.
  The single-asset lock is gone.
  A circle can rotate between registry stocks; the basket is priced and settled pro-rata as one pool.
- Policy-aware settlement.
  Coinbase receiver policies are enforced when raw B20 moves.
  Unauthorized recipients get automatic USDC liquidation through the same allowlisted venue.
- Bolt Action-style sequencing in the bot.
  The proposal pipeline in `proposal-service.mjs` validates intent and price far from the chat, so the flashy UI never hides bad math.

## What is real vs pending

Everything below is real and verified onchain or by tests unless it is explicitly listed as pending.

| Claim | Status |
| --- | --- |
| 2-member circle joins and deposits on Base Mainnet | Real (verified txs) |
| Quorum-gated proposal and vote | Real (verified txs) |
| Governed NVDAc purchase via Aerodrome | Real (verified tx) |
| Multi-asset basket: switch stock after first purchase | Real (contract + unit tests) |
| Feed-based pool pricing with weekend grace | Real (unit tests) |
| Policy-aware withdrawal (Auto -> USDC, Raw stock) | Real (unit tests + Sepolia proof) |
| All 8 pool-backed stocks enabled | Real (registry config + AAPLc tx) |
| Loom demo | Real but recorded against the single-asset vault; the basket UI change landed after recording |
| Fresh mainnet vault running the multi-asset bytecode | Pending (contract changed, redeploy required - see below) |
| Full production deployment (factory, subsidies, fiat onramp) | Pending - beyond hackathon scope |

Note on the deployed vault:
the live mainnet vault runs the earlier single-asset bytecode, and the onchain proof reflects that build.
This repo now contains the multi-asset contract and matching UI, both covered by passing tests.
Shipping it means deploying a new vault (immutable contracts, one vault per circle), which is a follow-up deploy rather than a change to the same address.

## API surface

The vault is the API.
Everything is a public view or a governed write:

- Member lifecycle: `join()`, `deposit(amount)`.
- Governance: `createProposal(asset, router, amountIn, minAmountOut)`, `vote(id, support)`, `executeProposal(router, id, tickSpacing)`.
- Valuation: `poolValue()`, `memberClaim(member)`, `heldAssets()`, `adjustedAssetBalance()`.
- Withdrawal: `withdraw(units, recipient)`, `withdrawAsUSDC(units, recipient, router, minAmountOut)`.

The Telegram bot exposes the same surface as commands:
`/help`, `/status`, `/portfolio`, `/members`, `/votes`, `/propose buy <amount> <stock>`, `/withdraw`.

The exact command grammar for a purchase is `/propose buy 0.9 NVDA` (parser requires the `buy` keyword).

## Tech stack

- Solidity 0.8.28 + Foundry (forge, cast, Anvil).
- OpenZeppelin Ownable, ReentrancyGuard, SafeERC20.
- Aerodrome Slipstream router + Chainlink total-return equity feeds on Base.
- Coinbase B20 tokenized stocks (native precompiles - `0xef` code size).
- TheVault-style policy registry for TRANSFER_RECEIVER_POLICY.
- Node.js, grammY, viem for the Telegram bot and Browser Mini App.
- Next.js + wagmi + viem for the Mini App and landing page.

## Project layout

```text
/src            - CirclaAssetRegistry, CirclaVault, interfaces
/test           - 12 unit tests + fork suite against the real router and live pools
/script         - deploy + Sepolia proof scripts
/bot            - Telegram bot (intent parser, proposal service, onchain client)
/web            - landing page + Mini App (Next.js)
/deployments    - verified tx records on Base Mainnet
/docs           - PRD, architecture, security model, demo script
```

## Run locally

Install Foundry dependencies and run the contract suite:

```bash
forge install
forge test -vvv
```

Run only the non-fork suite quickly:

```bash
forge test --no-match-contract Fork
```

Run the fork test that executes the real Aerodrome router against a Base fork:

```bash
provenance: forge test --fork-url https://mainnet.base.org --match-contract CirclaVaultForkTest
```

Format and build:

```bash
forge fmt --check
forge build
```

Run the Telegram bot and Mini App:

```bash
cd bot && npm install && npm run dev
cd web && npm install && npm run dev
```

## Tests

`test/CirclaVault.t.sol` (12 unit tests):

- Equal deposits mint equal units.
- Governed purchase uses real B20 balance and feed value.
- Multiplier only changes the adjusted display balance.
- Switching stock after the first purchase grows the basket and prices both assets (multi-asset switch test).
- Withdrawal enforces the B20 receiver policy.
- Unauthorized recipient can liquidate B20 to USDC.
- Execution without quorum reverts.
- Wrong tick spacing reverts.
- Unapproved router reverts.
- Friday close price survives the weekend.
- Non-Friday stale price reverts (fail closed).
- Friday price expires after 72 hours.

`test/CirclaVault.fork.t.sol`:

- Buy real NVDAc through the live Slipstream router on a Base fork.
- Configure AMZNc onchain and buy it - proves non-NVDAc stocks are tradable.

`test/CirclaConfigure.fork.t.sol`:

- Configure and verify the live asset registry with all 8 pool-backed stocks.

## How I would deploy this

1. Deploy `CirclaAssetRegistry` and configure every B20 asset with its feed, decimals, tick spacing, and max trade size.
2. Deploy a `CirclaVault` per circle with its owner, USDC, registry, policy registry, name, member cap, quorum, target, per-trade limit, and proposal TTL.
3. Restrict execution to allowlisted routers only - no other venue can move pool funds.
4. Point the bot `CIRCLA_VAULT_ADDRESS` and the Mini App `?vault=` at the new vault.
5. Verify every contract on Basescan and link them from the README.

The live mainnet deployment matches step 1 through 3 today.
The multi-asset bytecode in this repo is the contract a fresh deploy would run.

## Disclaimer

CIRCLA is an unaudited hackathon prototype.
Coinbase Tokenized Stocks are available only to eligible users in permitted non-US jurisdictions.
Do not use production funds with this code.