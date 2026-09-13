import React from 'react';
import { FileText, Crop, Send, Download, Loader2 } from 'lucide-react';

interface ScanActionBarProps {
  onAdjustCorners: () => void;
  onRunOcr: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  isTelegram: boolean;
  pageCount: number;
}

export const ScanActionBar: React.FC<ScanActionBarProps> = ({
  onAdjustCorners,
  onRunOcr,
  onExportPdf,
  isExporting,
  isTelegram,
  pageCount,
}) => {
  return (
    <div className="flex items-center gap-2.5 p-2 glass-panel border border-white/10 shadow-2xl rounded-2xl">
      {/* Re-crop / Adjust Corners */}
      <button
        onClick={onAdjustCorners}
        className="btn-secondary py-2.5 px-3 flex items-center gap-1.5 text-xs font-medium"
        title="Re-adjust document crop corners"
      >
        <Crop className="w-4 h-4 text-sky-400" />
        <span className="hidden sm:inline">Corners</span>
      </button>

      {/* Extract Text (OCR) */}
      <button
        onClick={onRunOcr}
        className="btn-secondary py-2.5 px-3.5 flex items-center gap-1.5 text-xs font-medium"
        title="Run OCR to extract text"
      >
        <FileText className="w-4 h-4 text-amber-400" />
        <span>OCR</span>
      </button>

      {/* Primary Action: Send PDF or Download */}
      <button
        onClick={onExportPdf}
        disabled={isExporting}
        className="btn-primary flex-1 py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compiling PDF...</span>
          </>
        ) : isTelegram ? (
          <>
            <Send className="w-4 h-4" />
            <span>Send PDF to Chat ({pageCount})</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Save PDF ({pageCount} {pageCount === 1 ? 'Page' : 'Pages'})</span>
          </>
        )}
      </button>
    </div>
  );
};
