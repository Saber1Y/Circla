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

if (webhookUrl) {
  await bot.restoreWatchers();
  const path = `/webhook/${webhookSecret}`;
  const handler = await bot.createWebhook({
    domain: webhookUrl,
    path,
    secret_token: webhookSecret,
  });
  const server = createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }
    handler(req, res);
  });
  server.listen(port);
  console.log(`CIRCLA Telegram bot is running (webhook) on :${port} -> ${webhookUrl}${path}`);
} else {
  await bot.launch();
  console.log('CIRCLA Telegram bot is running (long polling)');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));