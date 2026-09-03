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

Deploy a test-only Sepolia stack with a clearly labeled B20-compatible mock asset:

```bash
forge script script/DeploySepoliaTestStack.s.sol:DeploySepoliaTestStack \
  --rpc-url base_sepolia --broadcast
```

Set `DEPLOYER_PRIVATE_KEY` in the shell before running the command.

This stack tests contract flow on Base Sepolia but does not represent a Coinbase Tokenized Stock.

The final Quest demo MUST use the official Coinbase Tokenized Stock contracts on Base Mainnet.

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
