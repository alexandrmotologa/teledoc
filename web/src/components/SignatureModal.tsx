import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inkColor, setInkColor] = useState<string>('#1e40af'); // Navy Blue by default
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = Math.min(window.innerWidth - 48, 500);
    const height = 240;
    canvas.width = width;
    canvas.height = height;

    // Clear with transparent background
    ctx.clearRect(0, 0, width, height);
    setStrokeHistory([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-10), state]);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    saveState();
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([]);
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...strokeHistory];
    const previous = newHistory.pop();
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setStrokeHistory(newHistory);
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trim bounding box around the signature for tight placement
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h).data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = imgData[(y * w + x) * 4 + 3];
        if (alpha > 20) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      onClose();
      return;
    }

    // Add 10px margin
    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad);
    maxY = Math.min(h, maxY + pad);

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropW;
    trimmedCanvas.height = cropH;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (trimmedCtx) {
      trimmedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      onSaveSignature(trimmedCanvas.toDataURL('image/png'));
    }

    onClose();
  };

  const inkColors = [
    { name: 'Navy Blue', color: '#1e40af' },
    { name: 'Black', color: '#0f172a' },
    { name: 'Dark Red', color: '#b91c1c' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg flex flex-col glass-panel border border-white/15 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-sky-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Draw Digital Signature</h2>
              <p className="text-xs text-slate-400">Sign with finger or stylus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="p-4 bg-slate-950 flex flex-col items-center">
          <div className="w-full relative border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-white/95 shadow-inner">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full touch-none cursor-crosshair"
              style={{ height: '220px' }}
            />
            {/* Guide signing baseline */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-slate-300 pointer-events-none flex justify-between">
              <span className="text-[10px] text-slate-400 select-none">Sign on this line</span>
              <span className="text-[10px] text-slate-400 select-none">X</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full mt-3 flex items-center justify-between gap-2">
            {/* Ink color picker */}
            <div className="flex items-center gap-2">
              {inkColors.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setInkColor(c.color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    inkColor === c.color ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Line thickness */}
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
              <button
                onClick={() => setLineWidth(2)}
                className={`text-xs px-2 py-0.5 rounded ${lineWidth === 2 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Fine
              </button>
              <button
                onClick={() => setLineWidth(3)}
                className={`text-xs px-2 py-0.5 rounded ${lineWidth === 3 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Medium
              </button>
              <button
                onClick={() => setLineWidth(5)}
                className={`text-xs px-2 py-0.5 rounded ${lineWidth === 5 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                Bold
              </button>
            </div>

            {/* Clear and Undo */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                disabled={strokeHistory.length === 0}
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-30"
                title="Undo last stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="btn-secondary text-xs py-1 px-2.5 text-red-400 hover:text-red-300"
                title="Clear canvas"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-white/10 bg-slate-950/40">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-3.5">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
