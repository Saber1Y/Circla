import { Telegraf, Markup } from 'telegraf';
import { getAddress, formatUnits } from 'viem';
import { createBaseClient, readVaultSnapshot, readProposal } from './base-client.mjs';
import { buildProposalPreview } from './proposal-service.mjs';
import { parseIntent } from './intent-parser.mjs';
import { formatSwapReceipt, formatContribution } from './receipts.mjs';
import { createCircleStore } from './circle-store.mjs';
import { createWatcher, pollVaultEvents, readQuorum, formatEvent } from './onchain-watcher.mjs';
import { COINBASE_STOCKS } from './base-assets.mjs';

// Lightweight notification engine — deterministic only, no conversational AI.
// Chat handles social dynamics; execution happens on Base via member wallets
// (opened through the Telegram Mini App). The bot broadcasts REAL onchain
// events from the group's vault, never invented chat state.

export function createCirclaBot({ token, vaultAddress, tmaUrl, pollIntervalMs = 12000 } = {}) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const bot = new Telegraf(token);
  const client = createBaseClient();
  const store = createCircleStore({ vaultAddress });
  let watchers = new Map();

  const appUrl = tmaUrl ?? process.env.CIRCLA_TMA_URL ?? 'https://circla.example.com/app';
  const directAppLink = process.env.CIRCLA_TMA_DIRECT_LINK ?? 'https://t.me/circlabasebot/circlabasebot';
  const boundCircle = (ctx) => store.getCircle(ctx.chat?.id);
  // Private chats get a real web_app button (deep-linked, browser-URL based).
  // Groups can't use web_app buttons, so they get the t.me Direct Link which
  // opens the Mini App INSIDE Telegram. startapp only allows [A-Za-z0-9_-],
  // so the vault address is passed raw - the app reads it as start_param.
  const appButton = (ctx, label, circle, query = '') => {
    const webUrl = query ? `${appUrl}?${query}&vault=${circle.vault}` : `${appUrl}?vault=${circle.vault}`;
    if (ctx.chat?.type === 'private') return Markup.button.webApp(label, webUrl);
    return Markup.button.url(label, `${directAppLink}?startapp=${circle.vault}`);
  };

  // Every broadcasted event is attributed to the vault bound to that chat.
  const broadcast = (chatId, text, extra = {}) => {
    return bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true, ...extra });
  };

  bot.start(async (ctx) => {
    await ctx.reply(
      [
        'Welcome to CIRCLA.',
        '',
        'Pool USDC with a trusted Telegram group, vote on a Coinbase Tokenized Stock purchase, and track the vault on Base.',
        '',
        'Tokenized stocks are available only to eligible users in permitted non-US jurisdictions.',
        'Use /start_syndicate, /status, /portfolio, /propose, or /help.',
      ].join('\n'),
      Markup.inlineKeyboard([
        [appButton(ctx, 'Open CIRCLA app', boundCircle(ctx))],
      ]),
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '/start_syndicate — bind this group to its vault + open the app\n/status — live vault snapshot\n/portfolio — holdings + adjusted balance\n/votes [id] — vote count for a proposal\n/propose buy <USDC> <NVDAc|AAPLc> — proposal preview\n/contribute <USDC> — deposit via the Mini App\n/vote <yes|no> — record your vote in chat (sign onchain in the app)\n/withdraw — policy-aware exit',
    );
  });

  bot.command('start_syndicate', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId === undefined) return ctx.reply('Run this inside a group chat.');
    const circle = store.getCircle(chatId);
    const q = await readQuorum(client, circle.vault);
    const buttons = [
      appButton(ctx, 'Contribute USDC', circle),
      appButton(ctx, 'Vote', circle, 'view=vote'),
      appButton(ctx, 'Portfolio', circle, 'view=portfolio'),
    ];
    await ctx.reply(
      [
        `Syndicate ready: ${circle.isDefault ? 'bound to the default vault' : 'dedicated vault'}`,
        '',
        `Vault: ${circle.vault}`,
        `Group: ${q.name || 'CIRCLA pool'} · quorum ${q.quorum}`,
        '',
        'Members contribute and vote through the Mini App — every action is their own wallet transaction.',
        'The bot posts every onchain receipt here.',
        '',
        'Eligible non-US users only.',
      ].join('\n'),
      Markup.inlineKeyboard([buttons]),
    );
    startWatcher(chatId);
  });

  bot.command('propose', async (ctx) => {
    await handleProposal(ctx, ctx.message.text, boundCircle(ctx), appButton);
  });

  bot.command('status', async (ctx) => {
    await replySnapshot(ctx, client, boundCircle(ctx).vault, false, appButton);
  });

  bot.command('portfolio', async (ctx) => {
    await replySnapshot(ctx, client, boundCircle(ctx).vault, true, appButton);
  });

  bot.command('votes', async (ctx) => {
    const arg = ctx.message.text.split(/\s+/)[1];
    const circle = boundCircle(ctx);
    try {
      const id = arg ? BigInt(arg) : undefined;
      const p = await readProposal(client, circle.vault, id);
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
    if (intent.type !== 'deposit' && intent.type !== 'contribute') return ctx.reply('Usage: /deposit <USDC amount>');
    await ctx.reply(
      [
        `To contribute ${intent.amountUsdc} USDC:`,
        '',
        '1. Open the Mini App (button below)',
        '2. Sign in with FaceID / Passkey (Coinbase Smart Wallet)',
        '3. Confirm — USDC is routed from your wallet into the vault',
        '',
        'No seed phrases. Every deposit is your own onchain transaction.',
      ].join('\n'),
      Markup.inlineKeyboard([appButton(ctx, 'Deposit USDC', boundCircle(ctx), `deposit=${intent.amountUsdc}`)]),
    );
  });

  bot.command('vote', async (ctx) => {
    const intent = parseIntent(ctx.message.text);
    if (intent.type !== 'vote') return ctx.reply('Usage: /vote <yes|no>');
    const circle = boundCircle(ctx);
    const p = await readProposal(client, circle.vault);
    await ctx.reply(
      `Tap to cast your real vote on Proposal #${p.id} (${intent.support ? 'YES' : 'NO'}) — signed with your own wallet.`,
      Markup.inlineKeyboard([appButton(ctx, 'Open CIRCLA app', circle, `vote=${intent.support ? 'yes' : 'no'}&proposal=${p.id}`)]),
    );
  });

  bot.command('withdraw', async (ctx) => {
    await ctx.reply(
      ['Policy-aware exit:',
        '',
        'If your wallet clears Coinbase TRANSFER_RECEIVER_POLICY, you withdraw raw NVDAc.',
        'Otherwise the vault liquidates your share to USDC via Aerodrome automatically.',
      ].join('\n'),
      Markup.inlineKeyboard([appButton(ctx, 'Open CIRCLA app', boundCircle(ctx), 'view=withdraw')]),
    );
  });

  bot.command('receipt', async (ctx) => {
    const parts = ctx.message.text.split(' ').slice(1);
    const [assetSymbol = 'NVDAc', amountOut = '?', valueUsdc = '?', txHash = ''] = parts;
    const explorerBase = 'https://basescan.org';
    await ctx.reply(formatSwapReceipt({ assetSymbol, amountOut, valueUsdc, txHash, explorerBase }));
  });

  bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    if (/^buy\s+/i.test(ctx.message.text)) return handleProposal(ctx, ctx.message.text, boundCircle(ctx), appButton);
    await ctx.reply('Try: Buy 100 USDC of NVDAc, /contribute 50, /start_syndicate, /status, or /portfolio.');
  });

  // ---- Onchain watcher: broadcast real vault events into the group ----
  // Errors keep the loop alive (bad RPC), but never fabricate events.
  const startWatcher = async (chatId) => {
    if (watchers.has(String(chatId))) return; // idempotent per group
    const circle = store.getCircle(chatId);
    const watcher = createWatcher();
    let lastBlock = undefined;
    let running = false;
    const loop = async () => {
      if (running) return;
      running = true;
      try {
        const { events, lastBlock: next } = await pollVaultEvents({ client: watcher.client, vault: circle.vault, lastBlock });
        lastBlock = next;
        if (events.length === 0) return;
        const q = await readQuorum(client, circle.vault);
        for (const e of events) {
          let text;
          try {
            if (['ProposalCreated', 'VoteCast'].includes(e.eventName)) {
              const proposal = await readProposal(client, circle.vault, e.args.proposalId);
              text = formatEvent(e, { ...q, proposal });
            } else {
              text = formatEvent(e, q);
            }
          } catch {
            text = formatEvent(e, q);
          }
          await broadcast(chatId, text).catch(() => {});
        }
      } catch (error) {
        console.error('watcher error', error.message);
      } finally {
        running = false;
      }
    };
    await loop();
    watchers.set(String(chatId), setInterval(loop, pollIntervalMs));
  };

  bot.command('watch', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId === undefined) return ctx.reply('Run inside a group.');
    await startWatcher(chatId);
    await ctx.reply('Watching the vault — onchain events will appear here.');
  });

  // Restore every bound group's watcher on launch, then start with graceful stop.
  const rawLaunch = bot.launch.bind(bot);
  return Object.assign(bot, {
    startWatcher,
    async launch() {
      for (const circle of store.listCircles()) {
        await startWatcher(circle.chatId).catch(() => {});
      }
      return rawLaunch();
    },
  });
}

async function handleProposal(ctx, message, circle, appButton) {
  try {
    const proposal = buildProposalPreview(message);
    const query = `propose=${proposal.amountUsdc}&asset=${proposal.asset.symbol}`;
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
        'Sign the proposal onchain in the Mini App.',
      ].join('\n'),
      Markup.inlineKeyboard([appButton(ctx, 'Open CIRCLA app', circle, query)]),
    );
  } catch (error) {
    await ctx.reply(`Proposal rejected: ${error.message}`);
  }
}

async function replySnapshot(ctx, client, vaultAddress, includeAsset, appButton) {
  try {
    const snapshot = await readVaultSnapshot(client, vaultAddress);
    const lines = [
      snapshot.name,
      `Members: ${snapshot.members.length}`,
      snapshot.poolValue === null
        ? 'Pool value: awaiting price feed (market closed)'
        : `Pool value: ${formatUnits(snapshot.poolValue, 6)} USDC`,
      `Total units: ${formatUnits(snapshot.totalUnits, 18)}`,
    ];
    if (includeAsset && snapshot.asset !== '0x0000000000000000000000000000000000000000') {
      lines.push(`Portfolio asset: ${getAddress(snapshot.asset)}`);
      lines.push(`Adjusted balance: ${formatUnits(snapshot.adjustedBalance, 8)}`);
    }
    const circle = { vault: vaultAddress };
    await ctx.reply(lines.join('\n'), Markup.inlineKeyboard([appButton(ctx, 'Open CIRCLA app', circle)]));
  } catch (error) {
    await ctx.reply(`Vault read unavailable: ${error.shortMessage ?? error.message}`);
  }
}