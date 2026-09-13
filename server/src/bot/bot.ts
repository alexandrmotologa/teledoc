import { Bot, InputFile } from 'grammy';
import { config } from '../config.js';
import { registerCommands } from './commands.js';
import { registerPhotoReceiver } from './photoReceiver.js';

export class TelegramBotManager {
  private bot: Bot | null = null;
  private isRunning = false;

  constructor() {
    if (config.telegramBotToken && config.telegramBotToken.trim() !== '') {
      try {
        this.bot = new Bot(config.telegramBotToken);
        this.setupHandlers();
      } catch (err) {
        console.warn('Failed to initialize grammY bot with provided token:', err);
      }
    } else {
      console.log('No TELEGRAM_BOT_TOKEN provided. TeleDoc is running in standalone / demo mode.');
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    registerCommands(this.bot);
    registerPhotoReceiver(this.bot);

    this.bot.catch((err) => {
      console.error('Telegram bot error encountered:', err);
    });
  }

  async start(): Promise<void> {
    if (!this.bot || this.isRunning) return;

    try {
      console.log('Starting Telegram bot in Long Polling mode...');
      this.isRunning = true;
      // Start polling asynchronously without blocking Fastify startup
      this.bot.start({
        onStart: (info) => {
          console.log(`Telegram Bot @${info.username} successfully connected and listening for messages.`);
        },
      });
    } catch (err) {
      console.warn('Could not connect to Telegram Bot API (likely invalid token or network offline):', err);
      this.isRunning = false;
    }
  }

  async stop(): Promise<void> {
    if (this.bot && this.isRunning) {
      await this.bot.stop();
      this.isRunning = false;
    }
  }

  async sendDocumentToChat(
    chatId: number | string,
    pdfBuffer: Uint8Array | Buffer,
    filename: string = 'Scanned_Document.pdf',
    caption: string = 'Here is your processed document from TeleDoc Scanner.'
  ): Promise<boolean> {
    if (!this.bot) {
      console.log(`Telegram bot not active. Cannot send PDF to chat ${chatId}`);
      return false;
    }

    try {
      const file = new InputFile(pdfBuffer, filename);
      await this.bot.api.sendDocument(chatId, file, {
        caption,
      });
      return true;
    } catch (err) {
      console.error(`Failed to send document to chat ${chatId}:`, err);
      return false;
    }
  }
}

export const botManager = new TelegramBotManager();
