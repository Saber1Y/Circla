import {parseIntent} from './intent-parser.mjs';
import {resolveStock} from './base-assets.mjs';

export function buildProposalPreview(message, {maxTradeAmountUsdc = 100} = {}) {
  const intent = typeof message === 'string' ? parseIntent(message) : message;
  if (intent.type !== 'create_proposal' || intent.action !== 'buy') {
    throw new Error('message is not a buy proposal');
  }

  const amount = Number(intent.amountUsdc);
  if (!Number.isFinite(amount) || amount <= 0 || amount > maxTradeAmountUsdc) {
    throw new Error(`proposal amount must be between 0 and ${maxTradeAmountUsdc} USDC`);
  }

  const stock = resolveStock(intent.assetSymbol);
  return {
    action: 'buy',
    amountUsdc: intent.amountUsdc,
    amountUsdcNumber: amount,
    asset: stock,
    chainId: 8453,
    status: 'awaiting_votes',
  };
}
