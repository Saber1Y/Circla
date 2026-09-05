import { Telegraf } from 'telegraf';
import { getAddress, formatUnits } from 'viem';
import { createBaseClient, readVaultSnapshot, readProposal } from './base-client.mjs';
import { buildProposalPreview } from './proposal-service.mjs';
import { parseIntent } from './intent-parser.mjs';
import { formatSwapReceipt } from './receipts.mjs';

// Lightweight notification engine — deterministic only, no conversational AI.
// Chat handles social dynamics; execution happens on Base via member wallets.

export function createCirclaBot({ token, vaultAddress } = {}) {
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
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '/start_syndicate — syndicate info + vault address\n/status — live vault snapshot\n/portfolio — holdings + adjusted balance\n/votes [id] — vote count for a proposal (default: latest)\n/propose buy <USDC> <NVDAc|AAPLc> — proposal preview\n/vote <yes|no> — record your vote in chat\n/deposit <USDC> — how to contribute',
    );
  });

  bot.command('start_syndicate', async (ctx) => {
    await ctx.reply(
      ['Syndicate ready.', '', `Vault: ${vaultAddress || 'not configured'}`, 'Contribute USDC, propose a stock buy, vote in chat. Bot posts every receipt here.', '', 'Eligible non-US users only.'].join('\n'),
    );
  });

  bot.command('propose', async (ctx) => {
    await handleProposal(ctx, ctx.message.text);
  });

  bot.command('status', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress, false);
  });

  bot.command('portfolio', async (ctx) => {
    await replySnapshot(ctx, client, vaultAddress, true);
  });

  bot.command('votes', async (ctx) => {
    const arg = ctx.message.text.split(/\s+/)[1];
    try {
      const id = arg ? BigInt(arg) : undefined;
      const p = await readProposal(client, vaultAddress, id);
      const now = Math.floor(Date.now() / 1000);
      const secsLeft = Number(p.deadline) - now;
      const status = p.executed ? 'executed' : p.cancelled ? 'cancelled' : secsLeft <= 0 ? 'expired' : 'awaiting votes';
      const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
      const lines = [
        `Proposal #${p.id}`,
        `Buy ${formatUnits(p.amountIn, 6)} USDC → ${short(p.asset)}`,
        `Votes: ${p.yesVotes}/${p.quorum} yes · ${p.noVotes} no`,
        `Status: ${status}${status === 'awaiting votes' ? ` · expires in ${Math.max(0, Math.floor(secsLeft / 60))}m` : ''}`,
      ];
      if (p.voted.length > 0) lines.push(`Voted: ${p.voted.map(short).join(', ')}`);
      else lines.push('Voted: no one yet');
      await ctx.reply(lines.join('\n'));
    } catch (error) {
      await ctx.reply(`Votes unavailable: ${error.shortMessage ?? error.message}`);
    }
  });

  bot.command('deposit', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'deposit') return ctx.reply('Usage: /deposit <USDC amount>');
    await ctx.reply(
      [`To contribute ${intent.amountUsdc} USDC:`, '', `1. Join the vault (join)`, `2. Approve USDC to the vault`, `3. Deposit — units are minted pro-rata`, '', `Vault: ${vaultAddress || 'not configured'}`].join('\n'),
    );
  });

  bot.command('vote', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'vote') return ctx.reply('Usage: /vote <yes|no>');
    await ctx.reply(`Vote recorded as ${intent.support ? 'YES' : 'NO'} in chat.`);
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
    if (/^buy\s+/i.test(ctx.message.text)) return handleProposal(ctx, ctx.message.text);
    await ctx.reply('Try: Buy 100 USDC of NVDAc, /start_syndicate, /status, or /portfolio.');
  });

  return bot;
}

async function handleProposal(ctx, message) {
  try {
    const proposal = buildProposalPreview(message);
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
        'Vote in chat with /vote yes.',
      ].join('\n'),
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
