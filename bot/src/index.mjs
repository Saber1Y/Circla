import {createCirclaBot} from './runtime.mjs';

const bot = createCirclaBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  vaultAddress: process.env.CIRCLA_VAULT_ADDRESS,
  tmaUrl: process.env.CIRCLA_TMA_URL,
});

await bot.launch();
console.log('CIRCLA Telegram bot is running');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));