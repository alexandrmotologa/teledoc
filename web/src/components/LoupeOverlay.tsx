import React, { useEffect, useRef } from 'react';
import { Point } from '../utils/perspective';

interface LoupeOverlayProps {
  activePoint: Point | null;
  imageCanvas: HTMLCanvasElement | null;
  containerRect: DOMRect | null;
  imageDisplayScale: { scaleX: number; scaleY: number; offsetX: number; offsetY: number };
}

export const LoupeOverlay: React.FC<LoupeOverlayProps> = ({
  activePoint,
  imageCanvas,
  containerRect,
  imageDisplayScale,
}) => {
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!activePoint || !imageCanvas || !loupeCanvasRef.current || !containerRect) return;

    const loupe = loupeCanvasRef.current;
    const ctx = loupe.getContext('2d');
    if (!ctx) return;

    const size = 110;
    loupe.width = size;
    loupe.height = size;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save for circular clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Source coordinates in actual image pixels
    const sx = activePoint.x;
    const sy = activePoint.y;
    const zoom = 2.4;
    const sampleRadius = (size / 2) / zoom;

    // Draw magnified region
    ctx.drawImage(
      imageCanvas,
      sx - sampleRadius,
      sy - sampleRadius,
      sampleRadius * 2,
      sampleRadius * 2,
      0,
      0,
      size,
      size
    );

    // Crosshairs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Center targeting circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Border ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [activePoint, imageCanvas, containerRect, imageDisplayScale]);

  if (!activePoint || !containerRect) return null;

  // Compute loupe screen position (offset slightly above finger)
  const screenX = activePoint.x * imageDisplayScale.scaleX + imageDisplayScale.offsetX;
  const screenY = activePoint.y * imageDisplayScale.scaleY + imageDisplayScale.offsetY;

  // Place 70px above point; if too close to top, place below
  const loupeY = screenY < 90 ? screenY + 70 : screenY - 70;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${loupeY}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 50,
        filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6))',
      }}
    >
      <canvas ref={loupeCanvasRef} style={{ borderRadius: '50%' }} />
    </div>
  );
};
