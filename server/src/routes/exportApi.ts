import { FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { compilePdfFromImages } from '../pdf/compiler.js';
import { tempStore } from '../storage/tempStore.js';
import { botManager } from '../bot/bot.js';

interface ExportPdfBody {
  pages: string[];
  title?: string;
  chatId?: number | string;
  pageSize?: 'a4' | 'letter' | 'fit';
}

export async function exportApiRoutes(fastify: FastifyInstance): Promise<void> {
  // Compiles multi-page PDF document
  fastify.post<{ Body: ExportPdfBody }>('/api/export-pdf', async (request, reply) => {
    const { pages, title, chatId, pageSize } = request.body || {};

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return reply.status(400).send({ error: 'At least one page image is required' });
    }

    try {
      const pdfBytes = await compilePdfFromImages(pages, {
        title: title || 'TeleDoc Scanned Document',
        pageSize: pageSize || 'a4',
      });

      const filename = `${(title || 'Scanned_Document').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const saved = await tempStore.saveFile(pdfBytes, 'pdf');

      let sentToTelegram = false;
      if (chatId) {
        sentToTelegram = await botManager.sendDocumentToChat(chatId, pdfBytes, filename);
      }

      return reply.send({
        success: true,
        downloadUrl: `/api/download/${saved.id}`,
        filename,
        sentToTelegram,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Failed to compile PDF document',
      });
    }
  });

  // Downloads files from temporary storage
  fastify.get<{ Params: { fileId: string } }>('/api/download/:fileId', async (request, reply) => {
    const { fileId } = request.params;
    const filePath = await tempStore.getFilePath(fileId);

    if (!filePath) {
      return reply.status(404).send({ error: 'Requested file not found or has expired' });
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    const safeFilename = path.basename(filePath);
    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', `inline; filename="${safeFilename}"`);

    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  });
}
