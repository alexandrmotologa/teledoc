import React, { useState } from 'react';
import { Stamp, Check, X } from 'lucide-react';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (dataUrl: string) => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onApplyWatermark,
}) => {
  const [text, setText] = useState<string>('COPIE CONFORMĂ CU ORIGINALUL');
  const [color, setColor] = useState<string>('#dc2626'); // Red
  const [opacity, setOpacity] = useState<number>(0.55);
  const [angle, setAngle] = useState<number>(-15);

  if (!isOpen) return null;

  const presets = [
    'COPIE CONFORMĂ CU ORIGINALUL',
    'CONFIDENȚIAL',
    'APPROVED',
    'PAID & VERIFIED',
    'DRAFT',
  ];

  const colors = [
    { name: 'Red', hex: '#dc2626' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Green', hex: '#16a34a' },
    { name: 'Dark Gray', hex: '#334155' },
  ];

  const generateStampDataUrl = () => {
    if (!text.trim()) return;

    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.globalAlpha = opacity;

    // Double-lined stamp border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    const rectW = 400;
    const rectH = 80;
    ctx.strokeRect(-rectW / 2, -rectH / 2, rectW, rectH);

    ctx.lineWidth = 1.5;
    ctx.strokeRect(-rectW / 2 + 5, -rectH / 2 + 5, rectW - 10, rectH - 10);

    // Stamp text
    ctx.fillStyle = color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 0, 0);

    ctx.restore();

    onApplyWatermark(canvas.toDataURL('image/png'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md flex flex-col glass-panel border border-white/15 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add Stamp or Watermark</h2>
              <p className="text-xs text-slate-400">Official document annotations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Quick Preset Chips */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Preset Stamps</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setText(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    text === preset
                      ? 'bg-blue-600/30 border-sky-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Stamp Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. CONFIDENȚIAL"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Color choices */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Stamp Color</label>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c.hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Opacity</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.85"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Angle slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Rotation Angle</span>
              <span>{angle}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              step="5"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value, 10))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-white/10 bg-slate-950/40">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-3.5">
            Cancel
          </button>
          <button
            onClick={generateStampDataUrl}
            disabled={!text.trim()}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Apply Stamp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
