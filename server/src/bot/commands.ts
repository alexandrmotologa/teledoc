import { Bot, InlineKeyboard } from 'grammy';
import { config } from '../config.js';

export function registerCommands(bot: Bot): void {
  bot.command('start', async (ctx) => {
    const miniAppUrl = config.appUrl;
    const keyboard = new InlineKeyboard()
      .webApp('Open Document Scanner', miniAppUrl)
      .row()
      .url('View on GitHub', 'https://github.com/alexandrmotologa/teledoc');

    await ctx.reply(
      `Welcome to TeleDoc Scanner!\n\n` +
      `Turn angled camera photos into clean, printer-ready PDF documents directly on Telegram.\n\n` +
      `How to use:\n` +
      `1. Send any photo of a receipt, letter, or document to this chat.\n` +
      `2. Or tap the button below to open the scanner now.`,
      { reply_markup: keyboard }
    );
  });

  bot.command('scan', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('Open Scanner', config.appUrl);
    await ctx.reply('Tap below to start scanning documents:', {
      reply_markup: keyboard,
    });
  });

  bot.command('demo', async (ctx) => {
    const demoUrl = `${config.appUrl}?demo=true`;
    const keyboard = new InlineKeyboard().webApp('Load Demo Receipt', demoUrl);
    await ctx.reply('Explore TeleDoc features with a pre-loaded angled sample document:', {
      reply_markup: keyboard,
    });
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `Tips for clean scans:\n\n` +
      `- Place paper on a contrasting surface (e.g. white paper on a dark desk).\n` +
      `- Ensure even room lighting to minimize harsh reflections.\n` +
      `- Hold your phone parallel to the paper for best resolution.\n` +
      `- Use the Magic B&W filter in the app to remove shadows.`
    );
  });
}
