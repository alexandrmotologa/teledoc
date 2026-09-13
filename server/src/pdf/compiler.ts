import { PDFDocument } from 'pdf-lib';

export type PageSizeOption = 'a4' | 'letter' | 'fit';

export interface CompilePdfOptions {
  title?: string;
  author?: string;
  pageSize?: PageSizeOption;
}

/**
 * Compiles an array of image buffers or base64 data URIs into a multi-page PDF.
 * Supports standard A4, US Letter, and exact-fit receipt dimensions.
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

  const pageSize = options.pageSize || 'a4';

  // Standard dimensions in points
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const LETTER_WIDTH = 612;
  const LETTER_HEIGHT = 792;
  const MARGIN = 18;

  for (const item of images) {
    let imageBuffer: Buffer;

    if (typeof item === 'string') {
      const match = item.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (match) {
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(item, 'base64');
      }
    } else {
      imageBuffer = item;
    }

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

    const imgDims = embeddedImage.scale(1);

    if (pageSize === 'fit') {
      // Fit page exactly to the document image dimensions (ideal for receipts)
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgDims.width,
        height: imgDims.height,
      });
    } else {
      // Standard page target
      const pageWidth = pageSize === 'letter' ? LETTER_WIDTH : A4_WIDTH;
      const pageHeight = pageSize === 'letter' ? LETTER_HEIGHT : A4_HEIGHT;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const maxAvailableWidth = pageWidth - MARGIN * 2;
      const maxAvailableHeight = pageHeight - MARGIN * 2;

      const scaleFactor = Math.min(
        maxAvailableWidth / imgDims.width,
        maxAvailableHeight / imgDims.height
      );

      const scaledWidth = imgDims.width * scaleFactor;
      const scaledHeight = imgDims.height * scaleFactor;

      // Center image on the page
      const xPos = (pageWidth - scaledWidth) / 2;
      const yPos = (pageHeight - scaledHeight) / 2;

      page.drawImage(embeddedImage, {
        x: xPos,
        y: yPos,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  }

  return await pdfDoc.save();
}

