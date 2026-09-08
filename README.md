# CIRCLA

CIRCLA is a Telegram-native group investing protocol for eligible users who want to collectively buy Coinbase Tokenized Stocks on Base.

The current implementation is the contract-first MVP vertical slice:

```text
USDC contribution
-> group proposal
-> member vote
-> allowlisted router execution
-> B20 custody
-> multiplier-aware portfolio reads
-> policy-aware withdrawal
```

## Status

Implemented:

- Base Foundry project.
- B20, Chainlink, Policy Registry, and Aerodrome-shaped interfaces.
- Asset and router allowlist.
- One-circle vault deployment model.
- USDC contributions and pro-rata pool units.
- Quorum-based purchase proposals.
- Minimum-output-protected swaps.
- Raw B20 valuation using tokenized-stock price feeds.
- Adjusted B20 balance display through `scaledBalanceOf`.
- B20 receiver policy checks.
- Deployment script and local contract tests.

Next:

- Base integration tests against live tokenized stock addresses.
- Telegram runtime adapter.
- Quote service and exact Aerodrome route construction.
- USDC liquidation fallback for unauthorized B20 withdrawals.
- Web receipt dashboard.

## Development

Install dependencies and run the contract suite:

```bash
forge test -vvv
```

Format and validate:

```bash
forge fmt --check
forge build
```

Deploy with environment variables:

```bash
cp .env.example .env
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url base --broadcast --verify
```

The Aerodrome router address MUST be set from current official venue documentation before deployment.

The mainnet deployment is live at block `50985040`:

- `CirclaAssetRegistry` - `0xA433d976740203bAE030339e68d6f7b261aCEABd`
- `CirclaVault` - `0x83f550601Cc9Fc4397216bc8E3422408C285A464`

See `deployments/mainnet-b20-precompile.json` for verified onchain records.

### Live mainnet proof (Sep 7 2026)

A real governed NVDAc purchase was executed on Base Mainnet with a 1 USDC
contribution. Every step is a confirmed transaction:

| Step | Tx hash |
| --- | --- |
| Member B joins (quorum 2) | `0xd89fad68f3e3d1ab316fed207d04af517f350b7ea5cac1da8c6f89fcc0a1e203` |
| Member A deposits 1 USDC | `0xeaa0524114da48bf1ed6251e87e3e83d57cec10672dfaa8cddb891d7748a9a9b` |
| Proposal #1: 1 USDC → NVDAc | `0x9f3213e16bf89eec0e2c703bd2177a151aa0bff79735de5a154de4fd80ec2fcc` |
| Member A votes YES | `0xc0de292871cf2e40c98de7d1ff431d69d32c10f2498a7e295cacfd44b1de1480` |
| Member B votes YES (quorum 2/2) | `0x2bde7aad5afcd8ce93ef2484b0e9cc066f0e93b4e2668095a34ed55798439dc4` |
| Execute on Aerodrome — vault now holds NVDAc | `0x5ad3de769ca4a719da490fd766551bc3c98c607b51e00ce5442a241015648131` |

After the swap the vault holds `430,908` NVDAc (8-decimal units, ≈ 0.99 USDC)
and has `0` USDC remaining — the full pool was deployed into the Coinbase
Tokenized Stock. Confirm on
[Basescan](https://basescan.org/address/0x83f550601Cc9Fc4397216bc8E3422408C285A464).

Note: `poolValue()` intentionally returns `UnsafePrice()` while a Chainlink
feed is stale (markets closed) — it fails closed rather than quoting a stale
price. It recovers automatically once the feed updates.

A test-only Sepolia stack with a clearly labeled B20-compatible mock asset remains available as a fallback:

```bash
forge script script/DeploySepoliaTestStack.s.sol:DeploySepoliaTestStack \
  --rpc-url base_sepolia --broadcast
```

Set `DEPLOYER_PRIVATE_KEY` in the shell before running the command.

This stack tests contract flow on Base Sepolia but does not represent a Coinbase Tokenized Stock.

The Quest demo uses the official Coinbase Tokenized Stock contracts on Base Mainnet.

## Architecture

See:

- `PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/SECURITY_MODEL.md`
- `docs/DEMO_SCRIPT.md`
- `docs/QUEST_SUBMISSION.md`

## Inspiration

The design draws on the following local reference checkouts in `/Users/mac/codes/circla-inspiration`:

- Spenda for fail-closed agent spending controls.
- ChainCircle for savings-circle state and governance.
- Aegis for Telegram approvals and transaction status.
- KasPay for invite and receipt UX patterns.

These projects target different chains and are references, not copied deployments.

## Disclaimer

CIRCLA is an unaudited hackathon prototype.

Coinbase Tokenized Stocks are available only to eligible users in permitted non-US jurisdictions.

Do not use production funds with this code.
