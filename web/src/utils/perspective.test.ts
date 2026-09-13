import { describe, it, expect } from 'vitest';
import { orderCorners, solveHomography, distance, computeTargetDimensions, Quad } from './perspective';

describe('Perspective Transformation Mathematics', () => {
  it('correctly calculates Euclidean distance', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(distance(p1, p2)).toBe(5);
  });

  it('orders arbitrary corner permutations into [TL, TR, BR, BL]', () => {
    // Deliberately shuffled order: [BR, TL, BL, TR]
    const shuffled = [
      { x: 200, y: 300 }, // BR
      { x: 10, y: 15 },   // TL
      { x: 12, y: 310 },  // BL
      { x: 190, y: 20 },  // TR
    ];

    const ordered = orderCorners(shuffled);
    expect(ordered[0].x).toBe(10);  // TL
    expect(ordered[1].x).toBe(190); // TR
    expect(ordered[2].x).toBe(200); // BR
    expect(ordered[3].x).toBe(12);  // BL
  });

  it('computes realistic target dimensions', () => {
    const quad: Quad = [
      { x: 50, y: 50 },
      { x: 450, y: 70 },
      { x: 460, y: 620 },
      { x: 40, y: 600 },
    ];
    const dims = computeTargetDimensions(quad);
    expect(dims.width).toBeGreaterThanOrEqual(400);
    expect(dims.height).toBeGreaterThanOrEqual(540);
  });

  it('solves identity homography matrix when source matches destination', () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    const H = solveHomography(quad, quad);
    // Should be close to 3x3 identity matrix [1, 0, 0, 0, 1, 0, 0, 0, 1]
    expect(Math.abs(H[0] - 1)).toBeLessThan(1e-5);
    expect(Math.abs(H[1])).toBeLessThan(1e-5);
    expect(Math.abs(H[2])).toBeLessThan(1e-5);
    expect(Math.abs(H[3])).toBeLessThan(1e-5);
    expect(Math.abs(H[4] - 1)).toBeLessThan(1e-5);
    expect(Math.abs(H[5])).toBeLessThan(1e-5);
    expect(Math.abs(H[6])).toBeLessThan(1e-5);
    expect(Math.abs(H[7])).toBeLessThan(1e-5);
    expect(H[8]).toBe(1);
  });
});
