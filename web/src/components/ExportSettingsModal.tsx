import React, { useState } from 'react';
import { FileDown, Send, X, FileCheck } from 'lucide-react';


export interface ExportSettings {
  title: string;
  pageSize: 'a4' | 'letter' | 'fit';
  quality: number; // 0.6, 0.8, 0.95
}

interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (settings: ExportSettings) => void;
  isExporting: boolean;
  isTelegram: boolean;
  pageCount: number;
}

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  isExporting,
  isTelegram,
  pageCount,
}) => {
  const [title, setTitle] = useState(`TeleDoc_Scan_${new Date().toISOString().slice(0, 10)}`);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [quality, setQuality] = useState<number>(0.85);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmExport({
      title: title.trim() || 'Scanned_Document',
      pageSize,
      quality,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md flex flex-col glass-panel border border-white/15 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-sky-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export PDF Options</h2>
              <p className="text-xs text-slate-400">{pageCount} {pageCount === 1 ? 'page' : 'pages'} ready to compile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* File title */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Document Name</label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-400 pr-12"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">.pdf</span>
            </div>
          </div>

          {/* Page Format Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Page Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPageSize('a4')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  pageSize === 'a4'
                    ? 'bg-blue-600/30 border-sky-400 text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">A4 Standard</span>
                <span className="text-[10px] text-slate-400">Official / Print</span>
              </button>

              <button
                type="button"
                onClick={() => setPageSize('fit')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  pageSize === 'fit'
                    ? 'bg-blue-600/30 border-sky-400 text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">Fit to Receipt</span>
                <span className="text-[10px] text-slate-400">Exact bounds</span>
              </button>

              <button
                type="button"
                onClick={() => setPageSize('letter')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  pageSize === 'letter'
                    ? 'bg-blue-600/30 border-sky-400 text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">US Letter</span>
                <span className="text-[10px] text-slate-400">8.5 × 11 in</span>
              </button>
            </div>
          </div>

          {/* Quality / Compression */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">File Compression</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuality(0.95)}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-0.5 transition-all ${
                  quality === 0.95
                    ? 'bg-blue-600/30 border-sky-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>Maximum</span>
                <span className="text-[10px] text-slate-400">Print resolution</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality(0.85)}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-0.5 transition-all ${
                  quality === 0.85
                    ? 'bg-blue-600/30 border-sky-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>Balanced</span>
                <span className="text-[10px] text-slate-400">Crisp & light</span>
              </button>

              <button
                type="button"
                onClick={() => setQuality(0.65)}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-0.5 transition-all ${
                  quality === 0.65
                    ? 'bg-blue-600/30 border-sky-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>Compact</span>
                <span className="text-[10px] text-slate-400">&lt; 1MB size</span>
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              {isTelegram ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Chat</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
