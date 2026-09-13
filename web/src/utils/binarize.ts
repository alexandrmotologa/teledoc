/**
 * Bradley-Roth Adaptive Thresholding algorithm.
 * Uses a 2D integral image to compute local means in O(1) time per pixel,
 * eradicating uneven lighting, camera flash glare, and ambient shadow.
 */
export function bradleyRothThreshold(
  imageData: ImageData,
  windowRatio: number = 0.125, // S = width / 8 by default
  thresholdPercentage: number = 15 // T = 15%
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 1. Compute grayscale luminance and 2D Integral Image
  // Using Float64Array to prevent integer overflow for high-res images
  const integral = new Float64Array(width * height);
  const grayscale = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const yOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (yOffset + x) * 4;
      // Standard luminance formula: 0.299R + 0.587G + 0.114B
      const lum = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      grayscale[yOffset + x] = lum;

      rowSum += lum;
      if (y === 0) {
        integral[yOffset + x] = rowSum;
      } else {
        integral[yOffset + x] = integral[(y - 1) * width + x] + rowSum;
      }
    }
  }

  // 2. Adaptive thresholding with local neighborhood
  const s = Math.max(8, Math.round(width * windowRatio));
  const r = Math.floor(s / 2);
  const factor = (100 - thresholdPercentage) / 100;

  const outData = new Uint8ClampedArray(data);
  const output = typeof ImageData !== 'undefined'
    ? new ImageData(outData, width, height)
    : ({ width, height, data: outData } as ImageData);


  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - r);
    const y2 = Math.min(height - 1, y + r);
    const yOffset = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - r);
      const x2 = Math.min(width - 1, x + r);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      // Integral image rectangle sum:
      // sum = I(x2, y2) - I(x1 - 1, y2) - I(x2, y1 - 1) + I(x1 - 1, y1 - 1)
      let sum = integral[y2 * width + x2];
      if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
      if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
      if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

      const pixelVal = grayscale[yOffset + x];
      const outIdx = (yOffset + x) * 4;

      // If pixel is darker than T% of the local mean -> black (0), else white (255)
      if (pixelVal * count <= sum * factor) {
        outData[outIdx] = 0;
        outData[outIdx + 1] = 0;
        outData[outIdx + 2] = 0;
      } else {
        outData[outIdx] = 255;
        outData[outIdx + 1] = 255;
        outData[outIdx + 2] = 255;
      }
      outData[outIdx + 3] = 255;
    }
  }

  return output;
}
