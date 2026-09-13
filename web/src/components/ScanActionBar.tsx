import React from 'react';
import { FileText, Crop, Send, Download, Loader2, PenTool, Stamp, Sliders } from 'lucide-react';

interface ScanActionBarProps {
  onAdjustCorners: () => void;
  onRunOcr: () => void;
  onOpenSignature: () => void;
  onOpenWatermark: () => void;
  onToggleTuning: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  isTelegram: boolean;
  pageCount: number;
}

export const ScanActionBar: React.FC<ScanActionBarProps> = ({
  onAdjustCorners,
  onRunOcr,
  onOpenSignature,
  onOpenWatermark,
  onToggleTuning,
  onExportPdf,
  isExporting,
  isTelegram,
  pageCount,
}) => {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Secondary Tool Dock */}
      <div className="grid grid-cols-5 gap-1.5 p-1 glass-panel border border-white/10 rounded-2xl bg-slate-900/80 backdrop-blur-xl">
        <button
          id="btn-crop"
          onClick={onAdjustCorners}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Re-adjust document crop corners"
        >
          <Crop className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Crop</span>
        </button>

        <button
          id="btn-tuning"
          onClick={onToggleTuning}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Adjust threshold, contrast, and brightness"
        >
          <Sliders className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Tuning</span>
        </button>

        <button
          id="btn-sign"
          onClick={onOpenSignature}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Sign document"
        >
          <PenTool className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Sign</span>
        </button>

        <button
          id="btn-stamp"
          onClick={onOpenWatermark}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Add stamp or watermark"
        >
          <Stamp className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Stamp</span>
        </button>

        <button
          id="btn-ocr"
          onClick={onRunOcr}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          title="Run OCR to extract text"
        >
          <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">OCR</span>
        </button>
      </div>

      {/* Primary Action Button */}
      <button
        id="btn-export-pdf"
        onClick={onExportPdf}
        disabled={isExporting || pageCount === 0}
        className="btn-primary w-full py-3 px-5 text-sm sm:text-base font-bold flex items-center justify-center gap-2 rounded-2xl shadow-xl shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export document as PDF"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span>Compiling PDF Document...</span>
          </>
        ) : isTelegram ? (
          <>
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Send PDF to Telegram ({pageCount})</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Save PDF ({pageCount} {pageCount === 1 ? 'Page' : 'Pages'})</span>
          </>
        )}
      </button>
    </div>
  );
};
