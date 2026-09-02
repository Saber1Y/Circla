# CIRCLA Telegram Layer

This package currently contains the typed intent boundary for the Telegram integration.

The parser deliberately resolves symbols to intent data only.

It does not resolve a token address, build calldata, sign a transaction, or execute a trade.

Those operations belong to the asset registry, policy service, wallet adapter, and Base contract.

Run the parser tests:

```bash
npm test
```
