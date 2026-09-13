import { describe, it, expect } from 'vitest';
import { compilePdfFromImages } from './compiler.js';
import { PDFDocument } from 'pdf-lib';

describe('PDF Compiler Engine', () => {
  // 2x2 solid PNG image in base64
  const samplePngBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('compiles a single page PDF from image data URI', async () => {
    const pdfBytes = await compilePdfFromImages([samplePngBase64], {
      title: 'Test Scan Single',
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    // Verify PDF header magic bytes "%PDF-"
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('utf-8');
    expect(header).toBe('%PDF-');

    // Parse back with pdf-lib to assert page count and title
    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe('Test Scan Single');
  });

  it('compiles a multi-page document with 3 pages in order', async () => {
    const pages = [samplePngBase64, samplePngBase64, samplePngBase64];
    const pdfBytes = await compilePdfFromImages(pages, {
      title: 'Multi-Page Scan',
    });

    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBe(3);

    // Verify ISO A4 dimensions (595.28 x 841.89)
    const firstPage = doc.getPage(0);
    expect(Math.round(firstPage.getWidth())).toBe(595);
    expect(Math.round(firstPage.getHeight())).toBe(842);
  });

  it('compiles a document with exact-fit page dimensions', async () => {
    const pdfBytes = await compilePdfFromImages([samplePngBase64], {
      pageSize: 'fit',
    });

    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    // 2x2 sample image dimensions
    expect(page.getWidth()).toBe(2);
    expect(page.getHeight()).toBe(2);
  });

  it('compiles a document with US Letter page dimensions', async () => {
    const pdfBytes = await compilePdfFromImages([samplePngBase64], {
      pageSize: 'letter',
    });

    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPage(0);
    expect(Math.round(page.getWidth())).toBe(612);
    expect(Math.round(page.getHeight())).toBe(792);
  });

  it('throws an error when an empty array of pages is supplied', async () => {
    await expect(compilePdfFromImages([])).rejects.toThrow(
      'At least one page image is required'
    );
  });
});
