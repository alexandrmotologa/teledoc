import React, { useState } from 'react';
import { Copy, Check, Download, X, FileText, Loader2 } from 'lucide-react';

interface OcrResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  progress: number;
  status: string;
  text: string;
  wordCount: number;
  onReRunOcr?: (lang: string) => void;
}

export const OcrResultModal: React.FC<OcrResultModalProps> = ({
  isOpen,
  onClose,
  isProcessing,
  progress,
  status,
  text,
  wordCount,
  onReRunOcr,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('eng');


  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Scanned_Text_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col glass-panel border border-white/15 bg-slate-900/95 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Recognized Document Text</h2>
              <p className="text-xs text-slate-400">
                {isProcessing ? status : `${wordCount} words extracted`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={selectedLang}
              disabled={isProcessing}
              onChange={(e) => {
                const newLang = e.target.value;
                setSelectedLang(newLang);
                if (onReRunOcr) onReRunOcr(newLang);
              }}
              className="bg-slate-800 text-xs text-slate-200 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-sky-400"
            >
              <option value="eng">English (eng)</option>
              <option value="ron">Română (ron)</option>
              <option value="fra">Français (fra)</option>
              <option value="deu">Deutsch (deu)</option>
              <option value="spa">Español (spa)</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-200">{status}</p>
                <div className="w-48 h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(5, progress)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : text ? (
            <div className="bg-slate-950/80 rounded-xl p-4 border border-white/5 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-sky-500 selection:text-white">
              {text}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              No readable text could be recognized on this page. Try adjusting lighting or choosing the Magic B&W filter.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isProcessing && text && (
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-white/10 bg-slate-950/40">
            <button
              onClick={handleDownloadTxt}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Save .txt</span>
            </button>
            <button
              onClick={handleCopy}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
