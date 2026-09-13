import { FastifyInstance } from 'fastify';
import { tempStore } from '../storage/tempStore.js';

export async function scanApiRoutes(fastify: FastifyInstance): Promise<void> {
  // Multipart upload endpoint for raw photos
  fastify.post('/api/upload', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file was uploaded' });
      }

      const buffer = await data.toBuffer();
      const ext = data.filename.split('.').pop() || 'jpg';
      const saved = await tempStore.saveFile(buffer, ext);

      return reply.send({
        id: saved.id,
        downloadUrl: `/api/download/${saved.id}`,
        filename: data.filename,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to process file upload' });
    }
  });
}
