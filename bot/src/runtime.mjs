import { Telegraf, Markup } from 'telegraf';
import { getAddress, formatUnits } from 'viem';
import { createBaseClient, readVaultSnapshot } from './base-client.mjs';
import { buildProposalPreview } from './proposal-service.mjs';
import { parseIntent } from './intent-parser.mjs';
import { formatSwapReceipt } from './receipts.mjs';

// Lightweight notification engine — deterministic only, no conversational AI.
// Chat handles social dynamics + TMA handoff; execution lives in /syndicate/[id].

function tmaUrl(appUrl, path = '/syndicate/demo') {
  if (!appUrl) return '';
  return `${appUrl.replace(/\/$/, '')}${path}`;
}

function openSyndicateKeyboard(appUrl) {
  const url = tmaUrl(appUrl);
  if (!url) return undefined;
  return Markup.inlineKeyboard([[Markup.button.webApp('Open Syndicate', url)]]);
}

export function createCirclaBot({ token, vaultAddress, appUrl = process.env.CIRCLA_APP_URL ?? '' } = {}) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const bot = new Telegraf(token);
  const client = createBaseClient();

  bot.start(async (ctx) => {
    await ctx.reply(
      [
        'Welcome to CIRCLA.',
        '',
        'Pool USDC with a trusted Telegram group, vote on a Coinbase Tokenized Stock purchase, and track the vault on Base.',
        '',
        'Tokenized stocks are available only to eligible users in permitted non-US jurisdictions.',
        'Use /start_syndicate, /status, /portfolio, or /help.',
      ].join('\n'),
      openSyndicateKeyboard(appUrl) ?? undefined,
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '/start_syndicate — drop the Mini App button\n/status — live vault snapshot\n/portfolio — holdings + adjusted balance\n/propose buy <USDC> <NVDAc|AAPLc> — preview + TMA link\n/vote <yes|no> — record intent, sign in Mini App\n/deposit <USDC> — open Mini App deposit',
    );
  });

  bot.command('start_syndicate', async (ctx) => {
    const url = tmaUrl(appUrl, `/syndicate/${ctx.chat.id}`);
    const kb = url ? Markup.inlineKeyboard([[Markup.button.webApp('Open Syndicate', url)]]) : undefined;
    await ctx.reply(
      ['Syndicate ready.', '', 'Tap below to open the Mini App — join, contribute, vote, withdraw. Bot posts every receipt here.', '', 'Eligible non-US users only.'].join('\n'),
      kb ?? undefined,
    );
  });

  bot.command('propose', async (ctx) => {
    await handleProposal(ctx, ctx.message.text, appUrl);
  });

  bot.command('status', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress, false);
  });

  bot.command('portfolio', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress, true);
  });

  bot.command('deposit', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'deposit') return ctx.reply('Usage: /deposit <USDC amount>');
    const url = tmaUrl(appUrl);
    await ctx.reply(
      `Deposit ${intent.amountUsdc} USDC in the Mini App — Smart Wallet passkey, no seed phrase.${url ? `\n${url}` : ''}`,
      openSyndicateKeyboard(appUrl) ?? undefined,
    );
  });

  bot.command('vote', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'vote') return ctx.reply('Usage: /vote <yes|no>');
    await ctx.reply(
      `Vote recorded as ${intent.support ? 'YES' : 'NO'} in chat. Sign it in the Mini App to submit on Base.`,
      openSyndicateKeyboard(appUrl) ?? undefined,
    );
  });

  // Deterministic helper for backend broadcasters: post a formatted Aerodrome receipt.
  bot.command('receipt', async (ctx) => {
    const parts = ctx.message.text.split(' ').slice(1);
    const [assetSymbol = 'NVDAc', amountOut = '?', valueUsdc = '?', txHash = ''] = parts;
    const explorerBase = (process.env.BASE_RPC_URL ?? '').includes('sepolia')
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';
    await ctx.reply(formatSwapReceipt({ assetSymbol, amountOut, valueUsdc, txHash, explorerBase }));
  });

  bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    if (/^buy\s+/i.test(ctx.message.text)) return handleProposal(ctx, ctx.message.text, appUrl);
    await ctx.reply('Try: Buy 100 USDC of NVDAc, /start_syndicate, /status, or /portfolio.');
  });

  return bot;
}

async function handleProposal(ctx, message, appUrl) {
  try {
    const proposal = buildProposalPreview(message);
    const url = tmaUrl(appUrl);
    await ctx.reply(
      [
        'CIRCLA proposal preview',
        '',
        `Asset: ${proposal.asset.name} (${proposal.asset.symbol})`,
        `Token: ${proposal.asset.token}`,
        `Input: ${proposal.amountUsdc} USDC`,
        'Venue: allowlisted Aerodrome router',
        'Status: awaiting group votes',
        '',
        `Vote in chat, execute in the Mini App.${url ? `\n${url}` : ''}`,
      ].join('\n'),
      openSyndicateKeyboard(appUrl) ?? undefined,
    );
  } catch (error) {
    await ctx.reply(`Proposal rejected: ${error.message}`);
  }
}

async function replySnapshot(ctx, client, vaultAddress, includeAsset) {
  try {
    const snapshot = await readVaultSnapshot(client, vaultAddress);
    const lines = [
      snapshot.name,
      `Members: ${snapshot.members.length}`,
      `Pool value: ${formatUnits(snapshot.poolValue, 6)} USDC`,
      `Total units: ${formatUnits(snapshot.totalUnits, 18)}`,
    ];
    if (includeAsset && snapshot.asset !== '0x0000000000000000000000000000000000000000') {
      lines.push(`Portfolio asset: ${getAddress(snapshot.asset)}`);
      lines.push(`Adjusted balance: ${formatUnits(snapshot.adjustedBalance, 8)}`);
    }
    await ctx.reply(lines.join('\n'));
  } catch (error) {
    await ctx.reply(`Vault read unavailable: ${error.shortMessage ?? error.message}`);
  }
}
