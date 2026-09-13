import { Bot, InlineKeyboard } from 'grammy';
import { tempStore } from '../storage/tempStore.js';
import { config } from '../config.js';

export function registerPhotoReceiver(bot: Bot): void {
  bot.on('message:photo', async (ctx) => {
    try {
      const photos = ctx.message.photo;
      if (!photos || photos.length === 0) return;

      // Select highest resolution photo
      const highestRes = photos[photos.length - 1];

      await ctx.reply('Receiving document photo...');

      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;

      // Download file stream
      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`Failed to download photo from Telegram API: ${res.statusText}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const saved = await tempStore.saveFile(buffer, 'jpg');

      // Construct Mini App launch URL with parameters
      const miniAppUrl = `${config.appUrl}?photoId=${saved.id}&chatId=${ctx.chat.id}`;

      const keyboard = new InlineKeyboard()
        .webApp('Straighten, Filter & OCR', miniAppUrl);

      await ctx.reply(
        `Document photo saved!\n\n` +
        `Tap below to straighten perspective, remove shadows, and extract text:`,
        { reply_markup: keyboard }
      );
    } catch (err) {
      console.error('Error handling received photo:', err);
      await ctx.reply('Sorry, an error occurred while receiving your document photo. Please try again.');
    }
  });
}
