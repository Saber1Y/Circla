# CIRCLA Telegram Layer

This package currently contains the typed intent boundary for the Telegram integration.

The parser deliberately resolves symbols to intent data only.

The proposal service resolves only official Coinbase Tokenized Stock addresses on Base.

It does not build calldata, sign a transaction, or execute a trade.

Those operations belong to the asset registry, policy service, wallet adapter, and Base contract.

Run the parser tests:

```bash
npm test
```

Run the Telegram bot with live Base vault reads:

```bash
TELEGRAM_BOT_TOKEN=... CIRCLA_VAULT_ADDRESS=0x... npm start
```

The bot does not hold a private key.

Deposits, votes, and trades are handed off to a wallet-confirmed application flow.
