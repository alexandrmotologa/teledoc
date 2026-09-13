import path from 'node:path';

export interface AppConfig {
  port: number;
  host: string;
  telegramBotToken: string;
  appUrl: string;
  demoMode: boolean;
  storageDir: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  appUrl: process.env.APP_URL || `http://localhost:${Number(process.env.PORT) || 8080}`,
  demoMode: process.env.DEMO_MODE !== 'false',
  storageDir: process.env.STORAGE_DIR || path.resolve(process.cwd(), 'storage'),
};
