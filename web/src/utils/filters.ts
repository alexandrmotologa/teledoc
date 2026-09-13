import { bradleyRothThreshold } from './binarize';

export type FilterType = 'original' | 'magic-bw' | 'enhanced-color' | 'grayscale';

export interface FilterPreset {
  id: FilterType;
  name: string;
  description: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'magic-bw', name: 'Magic B&W', description: 'Crisp scanner threshold with shadow removal' },
  { id: 'enhanced-color', name: 'Color Doc', description: 'Boosted contrast preserving signatures and stamps' },
  { id: 'grayscale', name: 'Grayscale', description: 'Even monochrome tone without harsh cutoff' },
  { id: 'original', name: 'Original', description: 'Natural camera colors without modification' },
];

/**
 * Applies color enhancement for documents: stretches contrast, boosts ink saturation,
 * and normalizes the paper background toward clean white.
 */
export function enhanceDocumentColor(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src);
  const output = typeof ImageData !== 'undefined'
    ? new ImageData(dst, width, height)
    : ({ width, height, data: dst } as ImageData);

  // Compute luminance min and max for contrast stretching
  let minLum = 255;
  let maxLum = 0;
  const sampleStep = 4; // Sample every 4th pixel for speed

  for (let i = 0; i < src.length; i += 4 * sampleStep) {
    const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Clip extreme 5% outliers
  minLum = Math.max(20, minLum + 10);
  maxLum = Math.min(245, maxLum - 10);
  const range = Math.max(1, maxLum - minLum);

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    // Contrast stretching per channel
    const normR = Math.min(255, Math.max(0, ((r - minLum) / range) * 255));
    const normG = Math.min(255, Math.max(0, ((g - minLum) / range) * 255));
    const normB = Math.min(255, Math.max(0, ((b - minLum) / range) * 255));

    // Boost saturation slightly (1.2x) to make stamps pop
    const avg = (normR + normG + normB) / 3;
    const satBoost = 1.25;

    dst[i] = Math.min(255, Math.max(0, avg + (normR - avg) * satBoost));
    dst[i + 1] = Math.min(255, Math.max(0, avg + (normG - avg) * satBoost));
    dst[i + 2] = Math.min(255, Math.max(0, avg + (normB - avg) * satBoost));
    dst[i + 3] = 255;
  }

  return output;
}

/**
 * Converts image to smooth grayscale with gamma and contrast curve.
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src);
  const output = typeof ImageData !== 'undefined'
    ? new ImageData(dst, width, height)
    : ({ width, height, data: dst } as ImageData);


  for (let i = 0; i < src.length; i += 4) {
    const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    // Gentle S-curve contrast boost
    const norm = lum / 255;
    const curved = Math.round((norm < 0.5 ? 2 * norm * norm : 1 - Math.pow(-2 * norm + 2, 2) / 2) * 255);

    dst[i] = curved;
    dst[i + 1] = curved;
    dst[i + 2] = curved;
    dst[i + 3] = 255;
  }

  return output;
}

/**
 * Processes an input canvas with the selected filter preset.
 */
export function applyFilter(
  sourceCanvas: HTMLCanvasElement,
  filterType: FilterType
): HTMLCanvasElement {
  if (filterType === 'original') {
    return sourceCanvas;
  }

  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);

  let processedData: ImageData;
  switch (filterType) {
    case 'magic-bw':
      processedData = bradleyRothThreshold(imgData);
      break;
    case 'enhanced-color':
      processedData = enhanceDocumentColor(imgData);
      break;
    case 'grayscale':
      processedData = toGrayscale(imgData);
      break;
    default:
      processedData = imgData;
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (outCtx) {
    outCtx.putImageData(processedData, 0, 0);
  }
  return outCanvas;
}
