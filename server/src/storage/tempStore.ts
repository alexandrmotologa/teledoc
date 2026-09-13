import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config.js';

class TempStore {
  private dir: string;
  private maxAgeMs: number;

  constructor() {
    this.dir = path.resolve(process.cwd(), config.storageDir || './storage');
    this.maxAgeMs = 24 * 60 * 60 * 1000;
  }

  async init(): Promise<void> {
    if (!fs.existsSync(this.dir)) {
      await fs.promises.mkdir(this.dir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer | Uint8Array, ext: string): Promise<{ id: string }> {
    await this.init();
    const id = crypto.randomUUID();
    const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
    const filename = `${id}.${cleanExt}`;
    const filePath = path.join(this.dir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return { id };
  }

  async getFilePath(id: string): Promise<string | null> {
    await this.init();
    const files = await fs.promises.readdir(this.dir);
    const match = files.find((f) => f.startsWith(id));
    if (!match) return null;
    return path.join(this.dir, match);
  }

  async cleanExpiredFiles(): Promise<number> {
    await this.init();
    let cleaned = 0;
    const now = Date.now();
    try {
      const files = await fs.promises.readdir(this.dir);
      for (const file of files) {
        const filePath = path.join(this.dir, file);
        const stats = await fs.promises.stat(filePath);
        if (now - stats.mtimeMs > this.maxAgeMs) {
          await fs.promises.unlink(filePath);
          cleaned++;
        }
      }
    } catch {
      // Ignore errors during directory read
    }
    return cleaned;
  }
}

export const tempStore = new TempStore();
