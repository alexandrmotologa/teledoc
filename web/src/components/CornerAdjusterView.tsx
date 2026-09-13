import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point, Quad } from '../utils/perspective';
import { autoDetectCorners } from '../utils/autoDetectCorners';
import { LoupeOverlay } from './LoupeOverlay';
import { Wand2, RotateCcw, Check, Sparkles } from 'lucide-react';

interface CornerAdjusterViewProps {
  imageSrc: string;
  initialCorners?: Quad;
  onConfirm: (corners: Quad) => void;
  onCancel?: () => void;
}

export const CornerAdjusterView: React.FC<CornerAdjusterViewProps> = ({
  imageSrc,
  initialCorners,
  onConfirm,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [corners, setCorners] = useState<Quad>([
    { x: 50, y: 50 },
    { x: 350, y: 50 },
    { x: 350, y: 450 },
    { x: 50, y: 450 },
  ]);
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [displayScale, setDisplayScale] = useState({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 });

  // Update display dimensions on window resize or image load
  const updateDisplayScale = useCallback(() => {
    if (!containerRef.current || !imageRef.current || imageSize.width === 0) return;

    const container = containerRef.current.getBoundingClientRect();
    const containerAspect = container.width / container.height;
    const imgAspect = imageSize.width / imageSize.height;

    let displayW: number;
    let displayH: number;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > containerAspect) {
      displayW = container.width;
      displayH = container.width / imgAspect;
      offsetY = (container.height - displayH) / 2;
    } else {
      displayH = container.height;
      displayW = container.height * imgAspect;
      offsetX = (container.width - displayW) / 2;
    }

    setDisplayScale({
      scaleX: displayW / imageSize.width,
      scaleY: displayH / imageSize.height,
      offsetX,
      offsetY,
    });
  }, [imageSize]);

  useEffect(() => {
    window.addEventListener('resize', updateDisplayScale);
    return () => window.removeEventListener('resize', updateDisplayScale);
  }, [updateDisplayScale]);

  // Load image onto off-screen canvas
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImageSize({ width: w, height: h });

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      hiddenCanvasRef.current = canvas;
    }

    if (initialCorners) {
      setCorners(initialCorners);
    } else {
      // Run automatic corner detection
      const autoQuad = autoDetectCorners(w, h, canvas);
      setCorners(autoQuad);
    }
  };

  useEffect(() => {
    updateDisplayScale();
  }, [imageSize, updateDisplayScale]);

  // Coordinates conversion: Container client position to Image pixel position
  const clientToImageCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left - displayScale.offsetX;
      const clickY = clientY - rect.top - displayScale.offsetY;

      const imgX = Math.round(clickX / displayScale.scaleX);
      const imgY = Math.round(clickY / displayScale.scaleY);

      return {
        x: Math.max(0, Math.min(imageSize.width, imgX)),
        y: Math.max(0, Math.min(imageSize.height, imgY)),
      };
    },
    [displayScale, imageSize]
  );

  // Drag handlers
  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDragIdx(idx);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeDragIdx === null) return;
    const newPoint = clientToImageCoords(e.clientX, e.clientY);
    setCorners((prev) => {
      const updated = [...prev] as Quad;
      updated[activeDragIdx] = newPoint;
      return updated;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragIdx !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture release is unsupported
      }
      setActiveDragIdx(null);
    }
  };

  const handleAutoDetect = () => {
    if (imageSize.width > 0 && hiddenCanvasRef.current) {
      const detected = autoDetectCorners(imageSize.width, imageSize.height, hiddenCanvasRef.current);
      setCorners(detected);
    }
  };

  const handleResetCorners = () => {
    if (imageSize.width > 0) {
      setCorners([
        { x: 0, y: 0 },
        { x: imageSize.width, y: 0 },
        { x: imageSize.width, y: imageSize.height },
        { x: 0, y: imageSize.height },
      ]);
    }
  };

  // Convert quad to SVG polygon string
  const svgPoints = corners
    .map((p) => {
      const sx = p.x * displayScale.scaleX + displayScale.offsetX;
      const sy = p.y * displayScale.scaleY + displayScale.offsetY;
      return `${sx},${sy}`;
    })
    .join(' ');

  const activePoint = activeDragIdx !== null ? corners[activeDragIdx] : null;

  return (
    <div className="flex flex-col h-full w-full select-none" style={{ position: 'relative' }}>
      {/* Top action toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 glass-panel mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-semibold text-white tracking-wide">Adjust Document Corners</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDetect}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Auto detect document boundaries"
          >
            <Wand2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Auto Frame</span>
          </button>
          <button
            onClick={handleResetCorners}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Expand to full photo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Full</span>
          </button>
        </div>
      </div>

      {/* Viewfinder Workspace */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-crosshair rounded-xl border border-white/5"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Document capture"
          onLoad={handleImageLoad}
          className="max-h-full max-w-full object-contain pointer-events-none"
        />

        {/* SVG Interactive Overlay */}
        {imageSize.width > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Shaded polygon over document */}
            <polygon
              points={svgPoints}
              fill="rgba(56, 189, 248, 0.18)"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />

            {/* Diagonal guide lines */}
            {corners.length === 4 && (
              <>
                <line
                  x1={corners[0].x * displayScale.scaleX + displayScale.offsetX}
                  y1={corners[0].y * displayScale.scaleY + displayScale.offsetY}
                  x2={corners[2].x * displayScale.scaleX + displayScale.offsetX}
                  y2={corners[2].y * displayScale.scaleY + displayScale.offsetY}
                  stroke="rgba(56, 189, 248, 0.2)"
                  strokeWidth="1"
                />
                <line
                  x1={corners[1].x * displayScale.scaleX + displayScale.offsetX}
                  y1={corners[1].y * displayScale.scaleY + displayScale.offsetY}
                  x2={corners[3].x * displayScale.scaleX + displayScale.offsetX}
                  y2={corners[3].y * displayScale.scaleY + displayScale.offsetY}
                  stroke="rgba(56, 189, 248, 0.2)"
                  strokeWidth="1"
                />
              </>
            )}
          </svg>
        )}

        {/* 4 Interactive Drag Pins */}
        {imageSize.width > 0 &&
          corners.map((corner, idx) => {
            const screenX = corner.x * displayScale.scaleX + displayScale.offsetX;
            const screenY = corner.y * displayScale.scaleY + displayScale.offsetY;
            const isDragging = activeDragIdx === idx;

            return (
              <div
                key={idx}
                onPointerDown={(e) => handlePointerDown(idx, e)}
                style={{
                  position: 'absolute',
                  left: `${screenX}px`,
                  top: `${screenY}px`,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none',
                  zIndex: 40,
                }}
                className={`w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing ${
                  isDragging ? 'scale-125' : ''
                } transition-transform duration-75`}
              >
                {/* Visual handle pin */}
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
                    isDragging ? 'bg-sky-400 shadow-sky-500/50' : 'bg-sky-500 shadow-black/60'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            );
          })}

        {/* Magnifying Loupe Overlay on Drag */}
        <LoupeOverlay
          activePoint={activePoint}
          imageCanvas={hiddenCanvasRef.current}
          containerRect={containerRef.current ? containerRef.current.getBoundingClientRect() : null}
          imageDisplayScale={displayScale}
        />
      </div>

      {/* Bottom confirmation button */}
      <div className="pt-3 pb-1 flex justify-center">
        <button
          onClick={() => onConfirm(corners)}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Straighten & Flatten Document</span>
        </button>
      </div>
    </div>
  );
};
