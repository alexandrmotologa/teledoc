export interface Point {
  x: number;
  y: number;
}

export type Quad = [Point, Point, Point, Point]; // [TL, TR, BR, BL]

/**
 * Calculates Euclidean distance between two points.
 */
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Orders 4 points consistently as [Top-Left, Top-Right, Bottom-Right, Bottom-Left].
 */
export function orderCorners(points: Point[]): Quad {
  if (points.length !== 4) {
    throw new Error('Exactly 4 points are required to define document corners');
  }

  // Sort by sum of (x + y): Top-Left has smallest sum, Bottom-Right has largest
  const sumSorted = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const tl = sumSorted[0];
  const br = sumSorted[3];

  // Sort remaining two by difference (y - x): Top-Right has smallest (or x - y largest), Bottom-Left has largest
  const diffSorted = [sumSorted[1], sumSorted[2]].sort((a, b) => a.y - a.x - (b.y - b.x));
  const tr = diffSorted[0];
  const bl = diffSorted[1];

  return [tl, tr, br, bl];
}

/**
 * Computes destination width and height based on quadrilateral edges.
 */
export function computeTargetDimensions(corners: Quad): { width: number; height: number } {
  const [tl, tr, br, bl] = corners;

  const topWidth = distance(tl, tr);
  const bottomWidth = distance(bl, br);
  const avgWidth = Math.max(topWidth, bottomWidth);

  const leftHeight = distance(tl, bl);
  const rightHeight = distance(tr, br);
  const avgHeight = Math.max(leftHeight, rightHeight);

  // Round to integer dimensions, minimum 300px
  const width = Math.max(300, Math.round(avgWidth));
  const height = Math.max(300, Math.round(avgHeight));

  return { width, height };
}

/**
 * Solves 8-equation linear system A * h = b using Gaussian elimination with partial pivoting.
 * Returns the 3x3 homography matrix where h[8] = 1.
 */
export function solveHomography(src: Quad, dst: Quad): number[] {
  // Construct 8x8 matrix A and 8-element vector B
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    B.push(dx);

    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    B.push(dy);
  }

  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap rows
    if (maxRow !== i) {
      const tempRow = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tempRow;

      const tempB = B[i];
      B[i] = B[maxRow];
      B[maxRow] = tempB;
    }

    // Check for singular matrix
    if (Math.abs(A[i][i]) < 1e-12) {
      throw new Error('Degenerate quadrilateral: unable to compute homography');
    }

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  // Back-substitution
  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = B[i];
    for (let j = i + 1; j < n; j++) {
      sum -= A[i][j] * h[j];
    }
    h[i] = sum / A[i][i];
  }

  // 3x3 matrix entries: [h0, h1, h2, h3, h4, h5, h6, h7, 1]
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * Inverts a 3x3 matrix.
 */
export function invert3x3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, k] = m;

  const A = e * k - f * h;
  const B = -(d * k - f * g);
  const C = d * h - e * g;
  const D = -(b * k - c * h);
  const E = a * k - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const K = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) {
    throw new Error('Matrix is singular and cannot be inverted');
  }

  const invDet = 1 / det;
  return [
    A * invDet, D * invDet, G * invDet,
    B * invDet, E * invDet, H * invDet,
    C * invDet, F * invDet, K * invDet
  ];
}

/**
 * Warps source canvas to an upright rectangular canvas using homography and bilinear interpolation.
 */
export function warpPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: Quad,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const ordered = orderCorners(corners);
  const dims = (targetWidth && targetHeight) 
    ? { width: targetWidth, height: targetHeight } 
    : computeTargetDimensions(ordered);

  const dstQuad: Quad = [
    { x: 0, y: 0 },
    { x: dims.width, y: 0 },
    { x: dims.width, y: dims.height },
    { x: 0, y: dims.height },
  ];

  // We want to map each destination coordinate (u, v) back to source (x, y)
  // Therefore, we solve homography from dst -> src directly!
  const H_inv = solveHomography(dstQuad, ordered);

  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Could not obtain source 2D canvas context');
  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;
  const srcData = srcCtx.getImageData(0, 0, srcWidth, srcHeight).data;

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = dims.width;
  dstCanvas.height = dims.height;
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) throw new Error('Could not obtain destination 2D canvas context');

  const dstImageData = dstCtx.createImageData(dims.width, dims.height);
  const dstData = dstImageData.data;

  const h0 = H_inv[0], h1 = H_inv[1], h2 = H_inv[2];
  const h3 = H_inv[3], h4 = H_inv[4], h5 = H_inv[5];
  const h6 = H_inv[6], h7 = H_inv[7], h8 = H_inv[8];

  let dstIdx = 0;
  for (let v = 0; v < dims.height; v++) {
    for (let u = 0; u < dims.width; u++) {
      // Projected homogeneous coordinates
      const w = h6 * u + h7 * v + h8;
      const invW = 1 / w;
      const sx = (h0 * u + h1 * v + h2) * invW;
      const sy = (h3 * u + h4 * v + h5) * invW;

      // Check bounds
      if (sx >= 0 && sx < srcWidth - 1 && sy >= 0 && sy < srcHeight - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const dx = sx - x0;
        const dy = sy - y0;
        const w00 = (1 - dx) * (1 - dy);
        const w01 = dx * (1 - dy);
        const w10 = (1 - dx) * dy;
        const w11 = dx * dy;

        const idx00 = (y0 * srcWidth + x0) * 4;
        const idx01 = (y0 * srcWidth + x1) * 4;
        const idx10 = (y1 * srcWidth + x0) * 4;
        const idx11 = (y1 * srcWidth + x1) * 4;

        dstData[dstIdx]     = Math.round(w00 * srcData[idx00]     + w01 * srcData[idx01]     + w10 * srcData[idx10]     + w11 * srcData[idx11]);
        dstData[dstIdx + 1] = Math.round(w00 * srcData[idx00 + 1] + w01 * srcData[idx01 + 1] + w10 * srcData[idx10 + 1] + w11 * srcData[idx11 + 1]);
        dstData[dstIdx + 2] = Math.round(w00 * srcData[idx00 + 2] + w01 * srcData[idx01 + 2] + w10 * srcData[idx10 + 2] + w11 * srcData[idx11 + 2]);
        dstData[dstIdx + 3] = 255;
      } else {
        // Border fallback
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }

      dstIdx += 4;
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);
  return dstCanvas;
}
