import { Point, Quad, orderCorners } from './perspective';

/**
 * Automatically estimates the 4 corners of a document in an image.
 * Downsamples the image for performance, searches for sharp contrast boundaries
 * between document paper and the surrounding surface, and falls back to an inset margin quad.
 */
export function autoDetectCorners(imageWidth: number, imageHeight: number, canvas?: HTMLCanvasElement): Quad {
  // Default inset quadrilateral (10% padding from image edges)
  const defaultQuad: Quad = [
    { x: Math.round(imageWidth * 0.10), y: Math.round(imageHeight * 0.10) },
    { x: Math.round(imageWidth * 0.90), y: Math.round(imageHeight * 0.10) },
    { x: Math.round(imageWidth * 0.90), y: Math.round(imageHeight * 0.90) },
    { x: Math.round(imageWidth * 0.10), y: Math.round(imageHeight * 0.90) },
  ];

  if (!canvas) {
    return defaultQuad;
  }

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return defaultQuad;

    // Work on downsampled canvas
    const sampleW = 160;
    const sampleH = Math.round((imageHeight / imageWidth) * sampleW);
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = sampleW;
    smallCanvas.height = sampleH;
    const smallCtx = smallCanvas.getContext('2d');
    if (!smallCtx) return defaultQuad;

    smallCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = smallCtx.getImageData(0, 0, sampleW, sampleH).data;

    // Luminance array
    const lums = new Uint8Array(sampleW * sampleH);
    for (let i = 0; i < lums.length; i++) {
      const idx = i * 4;
      lums[i] = Math.round(0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2]);
    }

    // Compute average luminance
    let totalLum = 0;
    for (let i = 0; i < lums.length; i++) totalLum += lums[i];
    const meanLum = totalLum / lums.length;

    // Find extreme edge points above threshold in 4 directions
    const scaleX = imageWidth / sampleW;
    const scaleY = imageHeight / sampleH;

    // Scan from top
    let topY = Math.round(sampleH * 0.1);
    topLoop: for (let y = 0; y < Math.round(sampleH * 0.45); y++) {
      let brightCount = 0;
      for (let x = Math.round(sampleW * 0.2); x < Math.round(sampleW * 0.8); x++) {
        if (lums[y * sampleW + x] > meanLum) brightCount++;
      }
      if (brightCount > sampleW * 0.35) {
        topY = y;
        break topLoop;
      }
    }

    // Scan from bottom
    let bottomY = Math.round(sampleH * 0.9);
    bottomLoop: for (let y = sampleH - 1; y > Math.round(sampleH * 0.55); y--) {
      let brightCount = 0;
      for (let x = Math.round(sampleW * 0.2); x < Math.round(sampleW * 0.8); x++) {
        if (lums[y * sampleW + x] > meanLum) brightCount++;
      }
      if (brightCount > sampleW * 0.35) {
        bottomY = y;
        break bottomLoop;
      }
    }

    // Scan from left
    let leftX = Math.round(sampleW * 0.1);
    leftLoop: for (let x = 0; x < Math.round(sampleW * 0.45); x++) {
      let brightCount = 0;
      for (let y = Math.round(sampleH * 0.2); y < Math.round(sampleH * 0.8); y++) {
        if (lums[y * sampleW + x] > meanLum) brightCount++;
      }
      if (brightCount > sampleH * 0.35) {
        leftX = x;
        break leftLoop;
      }
    }

    // Scan from right
    let rightX = Math.round(sampleW * 0.9);
    rightLoop: for (let x = sampleW - 1; x > Math.round(sampleW * 0.55); x--) {
      let brightCount = 0;
      for (let y = Math.round(sampleH * 0.2); y < Math.round(sampleH * 0.8); y++) {
        if (lums[y * sampleW + x] > meanLum) brightCount++;
      }
      if (brightCount > sampleH * 0.35) {
        rightX = x;
        break rightLoop;
      }
    }

    // Add slight margin safety
    const padX = Math.round((rightX - leftX) * 0.02);
    const padY = Math.round((bottomY - topY) * 0.02);

    const detectedCorners: Point[] = [
      { x: Math.max(0, Math.round((leftX - padX) * scaleX)), y: Math.max(0, Math.round((topY - padY) * scaleY)) },
      { x: Math.min(imageWidth, Math.round((rightX + padX) * scaleX)), y: Math.max(0, Math.round((topY - padY) * scaleY)) },
      { x: Math.min(imageWidth, Math.round((rightX + padX) * scaleX)), y: Math.min(imageHeight, Math.round((bottomY + padY) * scaleY)) },
      { x: Math.max(0, Math.round((leftX - padX) * scaleX)), y: Math.min(imageHeight, Math.round((bottomY + padY) * scaleY)) },
    ];

    return orderCorners(detectedCorners);
  } catch {
    return defaultQuad;
  }
}
