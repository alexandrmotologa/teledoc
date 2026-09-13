import { PDFDocument } from 'pdf-lib';

export interface CompilePdfOptions {
  title?: string;
  author?: string;
}

/**
 * Compiles an array of image buffers or base64 data URIs into a multi-page A4 PDF.
 */
export async function compilePdfFromImages(
  images: (Buffer | string)[],
  options: CompilePdfOptions = {}
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('At least one page image is required to compile a PDF document');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(options.title || 'TeleDoc Scanned Document');
  pdfDoc.setAuthor(options.author || 'TeleDoc Scanner');
  pdfDoc.setProducer('TeleDoc Document Engine');
  pdfDoc.setCreationDate(new Date());

  // ISO A4 page dimensions in points (72 points = 1 inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MARGIN = 20;

  for (const item of images) {
    let imageBuffer: Buffer;

    if (typeof item === 'string') {
      // Check if data URI
      const match = item.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (match) {
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        // Plain base64 string
        imageBuffer = Buffer.from(item, 'base64');
      }
    } else {
      imageBuffer = item;
    }

    // Attempt embedding as JPEG first, fallback to PNG
    let embeddedImage;
    try {
      embeddedImage = await pdfDoc.embedJpg(imageBuffer);
    } catch {
      try {
        embeddedImage = await pdfDoc.embedPng(imageBuffer);
      } catch {
        throw new Error('Unsupported image format: image must be valid JPEG or PNG buffer');
      }
    }

    // Add page and scale image proportionally within A4 boundaries
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const maxAvailableWidth = A4_WIDTH - MARGIN * 2;
    const maxAvailableHeight = A4_HEIGHT - MARGIN * 2;

    const imgDims = embeddedImage.scale(1);
    const scaleFactor = Math.min(
      maxAvailableWidth / imgDims.width,
      maxAvailableHeight / imgDims.height
    );

    const scaledWidth = imgDims.width * scaleFactor;
    const scaledHeight = imgDims.height * scaleFactor;

    // Center image on the page
    const xPos = (A4_WIDTH - scaledWidth) / 2;
    const yPos = (A4_HEIGHT - scaledHeight) / 2;

    page.drawImage(embeddedImage, {
      x: xPos,
      y: yPos,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return await pdfDoc.save();
}
