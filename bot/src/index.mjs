import { createServer } from 'node:http';
import { createCirclaBot } from './runtime.mjs';

const bot = createCirclaBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  vaultAddress: process.env.CIRCLA_VAULT_ADDRESS,
  tmaUrl: process.env.CIRCLA_TMA_URL,
});

const port = Number(process.env.PORT || 8080);
const webhookUrl = process.env.CIRCLA_WEBHOOK_URL;
const webhookSecret = process.env.CIRCLA_WEBHOOK_SECRET;
let server;

if (webhookUrl) {
  await bot.restoreWatchers();
  const path = `/webhook/${webhookSecret}`;
  const handler = await bot.createWebhook({
    domain: webhookUrl,
    path,
    secret_token: webhookSecret,
  });
  server = createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }
    handler(req, res);
  });
  server.listen(port);
  // The path embeds the webhook secret, so only the public base URL is logged.
  console.log(`CIRCLA Telegram bot is running (webhook) on :${port} -> ${webhookUrl}`);
} else {
  await bot.launch();
  console.log('CIRCLA Telegram bot is running (long polling)');
}

// Webhook mode never calls bot.launch(), so Telegraf's bot.stop() would throw
// "Bot is not running!"; close our own HTTP server instead. The vault watchers
// run on intervals that keep the process alive, so exit explicitly.
function shutdown(signal) {
  console.log(`CIRCLA Telegram bot stopping (${signal})`);
  if (server) {
    server.close(() => process.exit(0));
    // Idle keep-alive connections can hold close() open; do not wait for them.
    setTimeout(() => process.exit(0), 5000).unref();
  } else {
    bot.stop(signal);
    process.exit(0);
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));