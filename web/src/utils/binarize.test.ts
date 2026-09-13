import { describe, it, expect } from 'vitest';
import { bradleyRothThreshold } from './binarize';

describe('Bradley-Roth Adaptive Thresholding', () => {
  it('turns dark text on shadowed background into pure black and white', () => {
    const width = 16;
    const height = 16;
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Fill with a gradient background (shadow across the page)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Background gradient from 120 to 220
        const bgVal = Math.round(120 + (x / width) * 100);
        buffer[idx] = bgVal;
        buffer[idx + 1] = bgVal;
        buffer[idx + 2] = bgVal;
        buffer[idx + 3] = 255;
      }
    }

    // Place a dark character in the center (pixel at 8, 8)
    const charIdx = (8 * width + 8) * 4;
    buffer[charIdx] = 20;
    buffer[charIdx + 1] = 20;
    buffer[charIdx + 2] = 20;
    buffer[charIdx + 3] = 255;

    // Use ImageData constructor or mock object
    const inputImageData = {
      width,
      height,
      data: buffer,
    } as ImageData;

    // Run thresholding
    const result = bradleyRothThreshold(inputImageData, 0.25, 15);

    // The dark character pixel must be pure black (0)
    expect(result.data[charIdx]).toBe(0);
    expect(result.data[charIdx + 1]).toBe(0);
    expect(result.data[charIdx + 2]).toBe(0);

    // Surrounding background pixel (e.g. at 2, 2) must be pure white (255)
    const bgPixelIdx = (2 * width + 2) * 4;
    expect(result.data[bgPixelIdx]).toBe(255);
    expect(result.data[bgPixelIdx + 1]).toBe(255);
    expect(result.data[bgPixelIdx + 2]).toBe(255);
  });
});
