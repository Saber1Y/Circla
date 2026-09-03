// Deterministic receipt formatters — no AI, no guessing.
// All numbers are passed in pre-formatted; bot only renders + links Basescan.

export function formatSwapReceipt({ assetSymbol = "NVDAc", amountOut = "0", valueUsdc = "0", txHash = "", explorerBase = "https://sepolia.basescan.org" } = {}) {
  const lines = [`Swap executed! ${amountOut} ${assetSymbol} @ $${valueUsdc}`];
  if (txHash) lines.push(`${explorerBase}/tx/${txHash}`);
  lines.push("scaledBalanceOf · Chainlink total-return");
  return lines.join("\n");
}

export function formatContribution({ member = "you", amountUsdc = "0", txHash = "", explorerBase = "https://sepolia.basescan.org" } = {}) {
  const lines = [`/contribute ${amountUsdc} USDC ✓ — ${member}`];
  if (txHash) lines.push(`${explorerBase}/tx/${txHash}`);
  return lines.join("\n");
}

export function formatVoteUpdate({ proposalId = 1, yes = 0, quorum = 2, status = "awaiting votes" } = {}) {
  return `Proposal #${proposalId}: ${yes}/${quorum} yes — ${status}`;
}
