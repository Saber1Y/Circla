import {Telegraf} from 'telegraf';
import {getAddress, formatUnits} from 'viem';
import {createBaseClient, readVaultSnapshot} from './base-client.mjs';
import {buildProposalPreview} from './proposal-service.mjs';
import {parseIntent} from './intent-parser.mjs';

export function createCirclaBot({token, vaultAddress, appUrl = process.env.CIRCLA_APP_URL ?? ''} = {}) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const bot = new Telegraf(token);
  const client = createBaseClient();

  bot.start(async (ctx) => {
    await ctx.reply([
      'Welcome to CIRCLA.',
      '',
      'Pool USDC with a trusted Telegram group, vote on a Coinbase Tokenized Stock purchase, and track the vault on Base.',
      '',
      'Tokenized stocks are available only to eligible users in permitted non-US jurisdictions.',
      'Use /propose, /status, /portfolio, or /help.',
    ].join('\n'));
  });

  bot.help(async (ctx) => {
    await ctx.reply('/propose buy <USDC amount> <NVDAc|AAPLc>\n/status\n/portfolio\n/deposit <USDC amount>\n/vote <yes|no>');
  });

  bot.command('propose', async (ctx) => {
    await handleProposal(ctx, ctx.message.text);
  });

  bot.command('status', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress);
  });

  bot.command('portfolio', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress, true);
  });

  bot.command('deposit', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'deposit') return ctx.reply('Usage: /deposit <USDC amount>');
    const handoff = appUrl ? `\nOpen the wallet flow: ${appUrl}/deposit?chat=${ctx.chat.id}&amount=${intent.amountUsdc}` : '';
    await ctx.reply(`Deposit request prepared for ${intent.amountUsdc} USDC.${handoff}`);
  });

  bot.command('vote', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'vote') return ctx.reply('Usage: /vote <yes|no>');
    await ctx.reply(`Vote recorded as ${intent.support ? 'YES' : 'NO'} in the chat flow. Wallet signing is required before submitting it on Base.`);
  });

  bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    if (/^buy\s+/i.test(ctx.message.text)) return handleProposal(ctx, ctx.message.text);
    await ctx.reply('Try: Buy 100 USDC of NVDAc, /status, or /portfolio.');
  });

  return bot;
}

async function handleProposal(ctx, message) {
  try {
    const proposal = buildProposalPreview(message);
    await ctx.reply([
      'CIRCLA proposal preview',
      '',
      `Asset: ${proposal.asset.name} (${proposal.asset.symbol})`,
      `Token: ${proposal.asset.token}`,
      `Input: ${proposal.amountUsdc} USDC`,
      'Venue: allowlisted Aerodrome router',
      'Status: awaiting group votes',
      '',
      'No funds move from a preview. Members must vote and a wallet must confirm execution.',
    ].join('\n'));
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
      lines.push(`Adjusted balance: ${formatUnits(snapshot.adjustedBalance, 6)}`);
    }
    await ctx.reply(lines.join('\n'));
  } catch (error) {
    await ctx.reply(`Vault read unavailable: ${error.shortMessage ?? error.message}`);
  }
}
