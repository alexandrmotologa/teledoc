import React, { useState, useEffect, useRef } from 'react';
import { Quad, warpPerspective } from './utils/perspective';
import { FilterType, applyFilter } from './utils/filters';
import { createSampleDocumentImage } from './utils/sampleDoc';
import { CornerAdjusterView } from './components/CornerAdjusterView';
import { FilterBar } from './components/FilterBar';
import { PageCarousel, ScannedPage } from './components/PageCarousel';
import { ScanActionBar } from './components/ScanActionBar';
import { OcrResultModal } from './components/OcrResultModal';
import { useTelegram } from './hooks/useTelegram';
import { useOcr } from './hooks/useOcr';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { isTelegram, user, triggerHaptic } = useTelegram();
  const ocr = useOcr();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('magic-bw');
  const [appMode, setAppMode] = useState<'adjust' | 'preview'>('preview');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with sample demo document or query photo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photoId');

    if (photoId) {
      // Fetch photo from backend
      fetch(`/api/download/${photoId}`)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              loadInitialPhoto(e.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          loadInitialPhoto(createSampleDocumentImage());
        });
    } else {
      // Default to bundled demo document for zero-config testing
      loadInitialPhoto(createSampleDocumentImage());
    }
  }, []);

  const loadInitialPhoto = (imageSrc: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = img.naturalWidth;
      rawCanvas.height = img.naturalHeight;
      const ctx = rawCanvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      // Default crop: inset 8%
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const defaultCorners: Quad = [
        { x: Math.round(w * 0.08), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.92) },
        { x: Math.round(w * 0.08), y: Math.round(h * 0.92) },
      ];

      const warped = warpPerspective(rawCanvas, defaultCorners);
      const filtered = applyFilter(warped, 'magic-bw');

      const initialPage: ScannedPage = {
        id: `page_${Date.now()}_1`,
        rawImageSrc: imageSrc,
        warpedCanvas: warped,
        filteredDataUrl: filtered.toDataURL('image/jpeg', 0.92),
        rotation: 0,
      };

      setPages([initialPage]);
      setActivePageIndex(0);
      setAppMode('preview');
    };
    img.src = imageSrc;
  };

  const handleCornerConfirm = (corners: Quad) => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    const img = new Image();
    img.onload = () => {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = img.naturalWidth;
      rawCanvas.height = img.naturalHeight;
      const ctx = rawCanvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      const warped = warpPerspective(rawCanvas, corners);
      const filtered = applyFilter(warped, activeFilter);

      setPages((prev) => {
        const updated = [...prev];
        updated[activePageIndex] = {
          ...currentPage,
          warpedCanvas: warped,
          filteredDataUrl: filtered.toDataURL('image/jpeg', 0.92),
        };
        return updated;
      });

      triggerHaptic('medium');
      setAppMode('preview');
    };
    img.src = currentPage.rawImageSrc;
  };

  const handleFilterSelect = (filter: FilterType) => {
    setActiveFilter(filter);
    const currentPage = pages[activePageIndex];
    if (!currentPage || !currentPage.warpedCanvas) return;

    const filtered = applyFilter(currentPage.warpedCanvas, filter);
    setPages((prev) => {
      const updated = [...prev];
      updated[activePageIndex] = {
        ...currentPage,
        filteredDataUrl: filtered.toDataURL('image/jpeg', 0.92),
      };
      return updated;
    });

    triggerHaptic('light');
  };

  const handleRotatePage = (index: number) => {
    const page = pages[index];
    if (!page || !page.warpedCanvas) return;

    const newRotation = (page.rotation + 90) % 360;

    // Rotate the warped canvas 90 degrees clockwise
    const srcCanvas = page.warpedCanvas;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = srcCanvas.height;
    rotCanvas.height = srcCanvas.width;
    const ctx = rotCanvas.getContext('2d');
    if (ctx) {
      ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);
    }

    const filtered = applyFilter(rotCanvas, activeFilter);

    setPages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...page,
        rotation: newRotation,
        warpedCanvas: rotCanvas,
        filteredDataUrl: filtered.toDataURL('image/jpeg', 0.92),
      };
      return updated;
    });

    triggerHaptic('light');
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setActivePageIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
    triggerHaptic('warning');
  };

  const handleAddPage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const rawCanvas = document.createElement('canvas');
        rawCanvas.width = img.naturalWidth;
        rawCanvas.height = img.naturalHeight;
        const ctx = rawCanvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const defaultCorners: Quad = [
          { x: Math.round(w * 0.1), y: Math.round(h * 0.1) },
          { x: Math.round(w * 0.9), y: Math.round(h * 0.1) },
          { x: Math.round(w * 0.9), y: Math.round(h * 0.9) },
          { x: Math.round(w * 0.1), y: Math.round(h * 0.9) },
        ];

        const warped = warpPerspective(rawCanvas, defaultCorners);
        const filtered = applyFilter(warped, activeFilter);

        const newPage: ScannedPage = {
          id: `page_${Date.now()}_${pages.length + 1}`,
          rawImageSrc: dataUrl,
          warpedCanvas: warped,
          filteredDataUrl: filtered.toDataURL('image/jpeg', 0.92),
          rotation: 0,
        };

        setPages((prev) => [...prev, newPage]);
        setActivePageIndex(pages.length);
        setAppMode('adjust');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunOcr = () => {
    const currentPage = pages[activePageIndex];
    if (!currentPage || !currentPage.filteredDataUrl) return;

    setIsOcrModalOpen(true);
    triggerHaptic('light');
    ocr.runOcr(currentPage.filteredDataUrl).catch(() => {
      triggerHaptic('error');
    });
  };

  const handleExportPdf = async () => {
    if (pages.length === 0) return;

    setIsExporting(true);
    setExportNotice(null);
    triggerHaptic('medium');

    try {
      const params = new URLSearchParams(window.location.search);
      const chatIdParam = params.get('chatId');
      const chatId = chatIdParam ? Number(chatIdParam) : user?.id;

      const pagePayload = pages.map((p) => p.filteredDataUrl);

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: pagePayload,
          title: `TeleDoc_Scan_${new Date().toISOString().slice(0, 10)}`,
          chatId: chatId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF document on server');
      }

      const data = await response.json();

      if (data.sentToTelegram) {
        triggerHaptic('success');
        setExportNotice({
          type: 'success',
          message: 'Scanned PDF was sent directly to your Telegram chat!',
        });
      } else if (data.downloadUrl) {
        // Direct browser download
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `TeleDoc_Scan_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        triggerHaptic('success');
        setExportNotice({
          type: 'success',
          message: 'PDF successfully generated and downloaded!',
        });
      }
    } catch (err) {
      triggerHaptic('error');
      setExportNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error generating PDF document',
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  const currentPage = pages[activePageIndex];

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto px-3 py-3 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <header className="flex items-center justify-between py-2 px-3 mb-2 glass-panel border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-white shadow-md">
            TD
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">TeleDoc Scanner</h1>
            <p className="text-[11px] text-slate-400">
              {isTelegram ? `@${user.username || 'Telegram User'}` : 'Private Local Scanner'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadInitialPhoto(createSampleDocumentImage())}
            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
            title="Load demo sample receipt"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Sample</span>
          </button>
          <button
            onClick={handleAddPage}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            title="Take photo or upload image"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        </div>
      </header>

      {/* Notice Banner */}
      {exportNotice && (
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-2 text-xs font-medium border ${
            exportNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          {exportNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{exportNotice.message}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {appMode === 'adjust' && currentPage ? (
          <CornerAdjusterView
            imageSrc={currentPage.rawImageSrc}
            onConfirm={handleCornerConfirm}
            onCancel={() => setAppMode('preview')}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Scanned Document Preview Canvas */}
            <div className="flex-1 relative min-h-[380px] bg-slate-950/90 rounded-2xl border border-white/10 flex items-center justify-center p-3 overflow-hidden shadow-inner">
              {currentPage?.filteredDataUrl ? (
                <img
                  src={currentPage.filteredDataUrl}
                  alt="Scanned Preview"
                  className="max-h-full max-w-full object-contain rounded shadow-2xl transition-transform duration-200"
                  style={{
                    filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.7))',
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Upload className="w-10 h-10 stroke-1" />
                  <p className="text-xs">No document loaded</p>
                </div>
              )}
            </div>

            {/* Filter Selection Bar */}
            <div className="my-2">
              <FilterBar activeFilter={activeFilter} onSelectFilter={handleFilterSelect} />
            </div>

            {/* Multi-Page Carousel */}
            {pages.length > 0 && (
              <div className="mb-2">
                <PageCarousel
                  pages={pages}
                  activePageIndex={activePageIndex}
                  onSelectPage={(idx) => {
                    setActivePageIndex(idx);
                    triggerHaptic('light');
                  }}
                  onRotatePage={handleRotatePage}
                  onDeletePage={handleDeletePage}
                  onAddPage={handleAddPage}
                />
              </div>
            )}

            {/* Bottom Floating Action Bar */}
            <div className="mt-auto pt-1">
              <ScanActionBar
                onAdjustCorners={() => setAppMode('adjust')}
                onRunOcr={handleRunOcr}
                onExportPdf={handleExportPdf}
                isExporting={isExporting}
                isTelegram={isTelegram}
                pageCount={pages.length}
              />
            </div>
          </div>
        )}
      </main>

      {/* OCR Text Extractor Modal */}
      <OcrResultModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        isProcessing={ocr.isProcessing}
        progress={ocr.progress}
        status={ocr.status}
        text={ocr.text}
        wordCount={ocr.wordCount}
      />
    </div>
  );
};
