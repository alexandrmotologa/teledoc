import React from 'react';
import { Sliders, RotateCcw, X, Check } from 'lucide-react';

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
  isInline?: boolean;
}

export const TuningSliderBar: React.FC<TuningSliderBarProps> = ({
  isOpen,
  onClose,
  values,
  onChange,
  onReset,
  isInline = false,
}) => {
  if (!isOpen && !isInline) return null;

  const content = (
    <div className={`flex flex-col gap-3.5 ${isInline ? 'p-0' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">Exposure & Contrast Tuning</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-[11px] font-medium text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            title="Reset exposure settings"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          {!isInline && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10"
              title="Close tuning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {/* Shadow Remover Threshold Slider */}
        <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-300">Magic B&W Sensitivity</span>
            <span className="font-mono text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              {values.threshold}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={values.threshold}
            onChange={(e) => onChange({ ...values, threshold: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Faint Ink (5%)</span>
            <span>Default (15%)</span>
            <span>Heavy Dark (35%)</span>
          </div>
        </div>

        {/* Contrast Slider */}
        <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-300">Ink Contrast</span>
            <span className="font-mono text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              {values.contrast > 0 ? `+${values.contrast}` : values.contrast}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="2"
            value={values.contrast}
            onChange={(e) => onChange({ ...values, contrast: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Brightness Slider */}
        <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-300">Background Brightness</span>
            <span className="font-mono text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              {values.brightness > 0 ? `+${values.brightness}` : values.brightness}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="2"
            value={values.brightness}
            onChange={(e) => onChange({ ...values, brightness: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {!isInline && (
        <button
          onClick={onClose}
          className="btn-primary w-full py-2.5 mt-1 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done Adjusting</span>
        </button>
      )}
    </div>
  );

  if (isInline) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-md bg-slate-900 border border-white/15 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {content}
      </div>
    </div>
  );
};
