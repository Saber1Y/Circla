// Deterministic receipt formatters — no AI, no guessing.
// All numbers are passed in pre-formatted; bot only renders + links Basescan.

export function formatSwapReceipt({ assetSymbol = "NVDAc", amountOut = "0", valueUsdc = "0", txHash = "", explorerBase = "https://basescan.org" } = {}) {
  const lines = [`Swap executed! ${amountOut} ${assetSymbol} @ $${valueUsdc}`];
  if (txHash) lines.push(`${explorerBase}/tx/${txHash}`);
  lines.push("scaledBalanceOf · Chainlink total-return");
  return lines.join("\n");
}

export function formatContribution({ member = "you", amountUsdc = "0", txHash = "", explorerBase = "https://basescan.org" } = {}) {
  const lines = [`/contribute ${amountUsdc} USDC ✓ — ${member}`];
  if (txHash) lines.push(`${explorerBase}/tx/${txHash}`);
  return lines.join("\n");
}

export function formatVoteUpdate({ proposalId = 1, yes = 0, quorum = 2, status = "awaiting votes" } = {}) {
  return `Proposal #${proposalId}: ${yes}/${quorum} yes — ${status}`;
}

export function formatStockList(stocks) {
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return "No Coinbase Tokenized Stocks are enabled in the vault registry yet.";
  }
  return [
    "Tradable Coinbase Tokenized Stocks (enabled in the vault registry):",
    "",
    ...stocks.map((s) => `• ${s.symbol} — ${s.name}`),
    "",
    "Propose a purchase: /propose buy <USDC> <SYMBOL>",
  ].join("\n");
}
