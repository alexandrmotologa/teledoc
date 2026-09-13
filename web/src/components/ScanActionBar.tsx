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
    <div className="flex flex-col gap-2">
      {/* Secondary Tools Strip */}
      <div className="flex items-center justify-between gap-1.5 px-1">
        <button
          onClick={onOpenSignature}
          className="btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs font-medium"
          title="Sign document"
        >
          <PenTool className="w-3.5 h-3.5 text-blue-400" />
          <span>Sign</span>
        </button>

        <button
          onClick={onOpenWatermark}
          className="btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs font-medium"
          title="Add stamp or watermark"
        >
          <Stamp className="w-3.5 h-3.5 text-red-400" />
          <span>Stamp</span>
        </button>

        <button
          onClick={onToggleTuning}
          className="btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs font-medium"
          title="Adjust threshold, contrast, and brightness"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Tuning</span>
        </button>

        <button
          onClick={onRunOcr}
          className="btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs font-medium"
          title="Run OCR to extract text"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>OCR</span>
        </button>

        <button
          onClick={onAdjustCorners}
          className="btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs font-medium"
          title="Re-adjust document crop corners"
        >
          <Crop className="w-3.5 h-3.5 text-emerald-400" />
          <span>Crop</span>
        </button>
      </div>

      {/* Main Export Action Bar */}
      <div className="flex items-center gap-2 p-1.5 glass-panel border border-white/10 shadow-2xl rounded-2xl">


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
    </div>
  );
};

