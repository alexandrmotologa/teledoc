import React from 'react';
import { Sliders, RotateCcw, X } from 'lucide-react';

export interface TuningValues {
  threshold: number;
  brightness: number;
  contrast: number;
}

interface TuningSliderBarProps {
  isOpen: boolean;
  onClose: () => void;
  values: TuningValues;
  onChange: (values: TuningValues) => void;
  onReset: () => void;
}

export const TuningSliderBar: React.FC<TuningSliderBarProps> = ({
  isOpen,
  onClose,
  values,
  onChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="glass-panel p-4 mb-2 rounded-2xl border border-white/15 shadow-2xl animate-fadeIn">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-white">Manual Tuning & Exposure</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Shadow Remover Threshold Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>B&W Sensitivity</span>
            <span className="font-mono text-sky-400">{values.threshold}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={values.threshold}
            onChange={(e) => onChange({ ...values, threshold: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
          />
        </div>

        {/* Contrast Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Ink Contrast</span>
            <span className="font-mono text-sky-400">{values.contrast > 0 ? `+${values.contrast}` : values.contrast}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="2"
            value={values.contrast}
            onChange={(e) => onChange({ ...values, contrast: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
          />
        </div>

        {/* Brightness Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Brightness</span>
            <span className="font-mono text-sky-400">{values.brightness > 0 ? `+${values.brightness}` : values.brightness}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="2"
            value={values.brightness}
            onChange={(e) => onChange({ ...values, brightness: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
