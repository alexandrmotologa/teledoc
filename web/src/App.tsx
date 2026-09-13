import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quad, warpPerspective } from './utils/perspective';
import { FilterType, applyFilter, applyFineTuning } from './utils/filters';
import { createSampleDocument } from './utils/sampleDoc';
import { saveDraftSession, loadDraftSession, clearDraftSession, DraftSession } from './utils/draftStorage';
import { CornerAdjusterView } from './components/CornerAdjusterView';
import { FilterBar } from './components/FilterBar';
import { PageCarousel, ScannedPage } from './components/PageCarousel';
import { ScanActionBar } from './components/ScanActionBar';
import { OcrResultModal } from './components/OcrResultModal';
import { SignatureModal } from './components/SignatureModal';
import { WatermarkModal } from './components/WatermarkModal';
import { TuningSliderBar, TuningValues } from './components/TuningSliderBar';
import { ExportSettingsModal, ExportSettings } from './components/ExportSettingsModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { useTelegram } from './hooks/useTelegram';
import { useOcr } from './hooks/useOcr';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  PenTool,
  Stamp,
  FileText,
  Crop,
  Download,
  Send,
  Loader2,
} from 'lucide-react';

export interface DocumentOverlay {
  id: string;
  type: 'signature' | 'watermark';
  dataUrl: string;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  scale: number;
}

export const App: React.FC = () => {
  const { isTelegram, user, triggerHaptic } = useTelegram();
  const ocr = useOcr();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('magic-bw');
  const [appMode, setAppMode] = useState<'adjust' | 'preview'>('preview');

  // Tuning values
  const [tuning, setTuning] = useState<TuningValues>({ threshold: 15, brightness: 0, contrast: 0 });
  const [isTuningOpen, setIsTuningOpen] = useState<boolean>(false);

  // Overlays (signatures, stamps) keyed by page ID
  const [overlaysByPage, setOverlaysByPage] = useState<Record<string, DocumentOverlay[]>>({});
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');

  // Status & notices
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recoveredDraft, setRecoveredDraft] = useState<DraftSession | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const renderProcessedCanvas = useCallback((
    warped: HTMLCanvasElement,
    filter: FilterType,
    tune: TuningValues
  ): HTMLCanvasElement => {
    const filtered = applyFilter(warped, filter, tune.threshold);
    return applyFineTuning(filtered, tune.brightness, tune.contrast);
  }, []);

  const loadInitialPhoto = useCallback((imageSrc: string, customCorners?: Quad) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = img.naturalWidth;
      rawCanvas.height = img.naturalHeight;
      const ctx = rawCanvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const defaultCorners: Quad = customCorners || [
        { x: Math.round(w * 0.08), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.92) },
        { x: Math.round(w * 0.08), y: Math.round(h * 0.92) },
      ];

      const warped = warpPerspective(rawCanvas, defaultCorners);
      const processed = renderProcessedCanvas(warped, 'magic-bw', tuning);

      const initialPage: ScannedPage = {
        id: `page_${Date.now()}_1`,
        rawImageSrc: imageSrc,
        warpedCanvas: warped,
        filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
        rotation: 0,
      };

      setPages([initialPage]);
      setActivePageIndex(0);
      setAppMode('preview');
    };
    img.src = imageSrc;
  }, [renderProcessedCanvas, tuning]);

  // Initial load: check draft session, URL photoId, or sample doc
  useEffect(() => {
    const existingDraft = loadDraftSession();
    if (existingDraft && existingDraft.pages.length > 0) {
      setRecoveredDraft(existingDraft);
    }

    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photoId');

    if (photoId) {
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
          const sample = createSampleDocument();
          loadInitialPhoto(sample.dataUrl, sample.defaultCorners as Quad);
        });
    } else {
      const sample = createSampleDocument();
      loadInitialPhoto(sample.dataUrl, sample.defaultCorners as Quad);
    }
  }, [loadInitialPhoto]);

  // Autosave draft on pages update
  useEffect(() => {
    if (pages.length > 0) {
      const draftPages = pages.map((p) => ({
        id: p.id,
        rawImageSrc: p.rawImageSrc,
        rotation: p.rotation,
      }));
      saveDraftSession(draftPages);
    }
  }, [pages]);

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
      const processed = renderProcessedCanvas(warped, activeFilter, tuning);

      setPages((prev) => {
        const updated = [...prev];
        updated[activePageIndex] = {
          ...currentPage,
          warpedCanvas: warped,
          filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
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

    const processed = renderProcessedCanvas(currentPage.warpedCanvas, filter, tuning);
    setPages((prev) => {
      const updated = [...prev];
      updated[activePageIndex] = {
        ...currentPage,
        filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
      };
      return updated;
    });

    triggerHaptic('light');
  };

  const handleTuningChange = (newTuning: TuningValues) => {
    setTuning(newTuning);
    const currentPage = pages[activePageIndex];
    if (!currentPage || !currentPage.warpedCanvas) return;

    const processed = renderProcessedCanvas(currentPage.warpedCanvas, activeFilter, newTuning);
    setPages((prev) => {
      const updated = [...prev];
      updated[activePageIndex] = {
        ...currentPage,
        filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
      };
      return updated;
    });
  };

  const handleRotatePage = (index: number) => {
    const page = pages[index];
    if (!page || !page.warpedCanvas) return;

    const newRotation = (page.rotation + 90) % 360;

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

    const processed = renderProcessedCanvas(rotCanvas, activeFilter, tuning);

    setPages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...page,
        rotation: newRotation,
        warpedCanvas: rotCanvas,
        filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
      };
      return updated;
    });

    triggerHaptic('light');
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const pageId = pages[index].id;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setOverlaysByPage((prev) => {
      const copy = { ...prev };
      delete copy[pageId];
      return copy;
    });
    setActivePageIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
    triggerHaptic('warning');
  };

  const handleAddNewPhoto = (dataUrl: string) => {
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
        { x: Math.round(w * 0.08), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.08) },
        { x: Math.round(w * 0.92), y: Math.round(h * 0.92) },
        { x: Math.round(w * 0.08), y: Math.round(h * 0.92) },
      ];

      const warped = warpPerspective(rawCanvas, defaultCorners);
      const processed = renderProcessedCanvas(warped, activeFilter, tuning);

      const newPage: ScannedPage = {
        id: `page_${Date.now()}_${pages.length + 1}`,
        rawImageSrc: dataUrl,
        warpedCanvas: warped,
        filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
        rotation: 0,
      };

      setPages((prev) => [...prev, newPage]);
      setActivePageIndex(pages.length);
      setAppMode('adjust');
      triggerHaptic('medium');
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleAddNewPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Overlay management
  const handleAddSignature = (dataUrl: string) => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    const newOverlay: DocumentOverlay = {
      id: `sig_${Date.now()}`,
      type: 'signature',
      dataUrl,
      x: 50,
      y: 75,
      scale: 1,
    };

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: [...(prev[currentPage.id] || []), newOverlay],
    }));

    setIsSignatureModalOpen(false);
    triggerHaptic('success');
  };

  const handleAddWatermark = (dataUrl: string) => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    const newOverlay: DocumentOverlay = {
      id: `wm_${Date.now()}`,
      type: 'watermark',
      dataUrl,
      x: 50,
      y: 40,
      scale: 1,
    };

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: [...(prev[currentPage.id] || []), newOverlay],
    }));

    setIsWatermarkModalOpen(false);
    triggerHaptic('success');
  };

  const handleRemoveOverlay = (overlayId: string) => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: (prev[currentPage.id] || []).filter((o) => o.id !== overlayId),
    }));
    triggerHaptic('light');
  };

  const handleOverlayPointerDown = (overlayId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggingOverlayId(overlayId);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!draggingOverlayId || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: (prev[currentPage.id] || []).map((o) =>
        o.id === draggingOverlayId ? { ...o, x: xPct, y: yPct } : o
      ),
    }));
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (draggingOverlayId) {
      setDraggingOverlayId(null);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // OCR
  const handleRunOcr = async (lang: string = 'eng') => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    setOcrLanguage(lang);
    setIsOcrModalOpen(true);
    triggerHaptic('medium');

    try {
      await ocr.runOcr(currentPage.filteredDataUrl, lang);
      triggerHaptic('success');
    } catch {
      triggerHaptic('error');
    }
  };

  // Burn overlays to data URL for PDF compilation
  const burnOverlaysToDataUrl = async (page: ScannedPage, quality: number = 0.85): Promise<string> => {
    const overlays = overlaysByPage[page.id] || [];
    if (overlays.length === 0) {
      return page.filteredDataUrl;
    }

    return new Promise((resolve) => {
      const baseImg = new Image();
      baseImg.onload = () => {
        const burnCanvas = document.createElement('canvas');
        burnCanvas.width = baseImg.naturalWidth;
        burnCanvas.height = baseImg.naturalHeight;
        const ctx = burnCanvas.getContext('2d');
        if (!ctx) return resolve(page.filteredDataUrl);

        ctx.drawImage(baseImg, 0, 0);

        let loadedCount = 0;
        overlays.forEach((overlay) => {
          const overlayImg = new Image();
          overlayImg.onload = () => {
            const centerX = (overlay.x / 100) * burnCanvas.width;
            const centerY = (overlay.y / 100) * burnCanvas.height;
            const drawW = overlayImg.naturalWidth * overlay.scale;
            const drawH = overlayImg.naturalHeight * overlay.scale;

            ctx.drawImage(overlayImg, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);

            loadedCount++;
            if (loadedCount === overlays.length) {
              resolve(burnCanvas.toDataURL('image/jpeg', quality));
            }
          };
          overlayImg.src = overlay.dataUrl;
        });
      };
      baseImg.src = page.filteredDataUrl;
    });
  };

  // Execute PDF Export with settings
  const handleConfirmExport = async (settings: ExportSettings) => {
    setIsExportModalOpen(false);
    setIsExporting(true);
    setExportNotice(null);
    triggerHaptic('medium');

    try {
      const params = new URLSearchParams(window.location.search);
      const chatIdParam = params.get('chatId');
      const chatId = chatIdParam ? Number(chatIdParam) : user?.id;

      const burnedPages = await Promise.all(
        pages.map((p) => burnOverlaysToDataUrl(p, settings.quality))
      );

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: burnedPages,
          title: settings.title,
          pageSize: settings.pageSize,
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
          message: 'Document compiled & sent directly to your Telegram chat!',
        });
      } else if (data.downloadUrl) {
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `${settings.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        triggerHaptic('success');
        setExportNotice({
          type: 'success',
          message: 'PDF document generated and downloaded successfully!',
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
      setTimeout(() => setExportNotice(null), 6000);
    }
  };

  const handleResumeDraft = () => {
    if (!recoveredDraft) return;
    setRecoveredDraft(null);

    const loadedPages: ScannedPage[] = [];
    recoveredDraft.pages.forEach((dp) => {
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
          { x: Math.round(w * 0.08), y: Math.round(h * 0.08) },
          { x: Math.round(w * 0.92), y: Math.round(h * 0.08) },
          { x: Math.round(w * 0.92), y: Math.round(h * 0.92) },
          { x: Math.round(w * 0.08), y: Math.round(h * 0.92) },
        ];

        const warped = warpPerspective(rawCanvas, defaultCorners);
        const processed = renderProcessedCanvas(warped, activeFilter, tuning);

        loadedPages.push({
          id: dp.id,
          rawImageSrc: dp.rawImageSrc,
          warpedCanvas: warped,
          filteredDataUrl: processed.toDataURL('image/jpeg', 0.92),
          rotation: dp.rotation,
        });

        if (loadedPages.length === recoveredDraft.pages.length) {
          setPages(loadedPages);
          setActivePageIndex(0);
          triggerHaptic('success');
        }
      };
      img.src = dp.rawImageSrc;
    });
  };

  const handleDismissDraft = () => {
    setRecoveredDraft(null);
    clearDraftSession();
  };

  const currentPage = pages[activePageIndex];
  const currentOverlays = currentPage ? (overlaysByPage[currentPage.id] || []) : [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100 select-none">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Application Header */}
      <header className="h-14 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl px-4 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center font-black text-white shadow-md shadow-sky-500/20">
            TD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">TeleDoc Scanner</h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-none">
              {isTelegram ? `@${user.username || 'Telegram User'}` : 'Private Local Engine • 100% Client-Side'}
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const sample = createSampleDocument();
              loadInitialPhoto(sample.dataUrl, sample.defaultCorners as Quad);
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Load demo sample receipt"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline sm:inline">Sample</span>
          </button>

          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Open camera scanner"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Camera</span>
          </button>
        </div>
      </header>

      {/* Notice Banner */}
      {exportNotice && (
        <div
          className={`mx-4 mt-2 flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium border animate-fadeIn flex-shrink-0 z-20 ${
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

      {/* Draft Recovery Alert */}
      {recoveredDraft && (
        <div className="mx-4 mt-2 flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-500/15 border border-sky-400/30 text-sky-200 text-xs flex-shrink-0 z-20 animate-fadeIn">
          <span>Resume unfinished session ({recoveredDraft.pages.length} {recoveredDraft.pages.length === 1 ? 'page' : 'pages'})?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResumeDraft}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px]"
            >
              Resume
            </button>
            <button
              onClick={handleDismissDraft}
              className="text-slate-400 hover:text-white text-[11px] px-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Stage */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        {appMode === 'adjust' && currentPage ? (
          <div className="w-full h-full p-2 sm:p-4 max-w-5xl mx-auto flex flex-col">
            <CornerAdjusterView
              imageSrc={currentPage.rawImageSrc}
              onConfirm={handleCornerConfirm}
              onCancel={() => setAppMode('preview')}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
            {/* Desktop Left Rail: Page Thumbnails Filmstrip */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-slate-900/50 p-3.5 gap-4 overflow-y-auto flex-shrink-0">
              <PageCarousel
                pages={pages}
                activePageIndex={activePageIndex}
                onSelectPage={(idx) => {
                  setActivePageIndex(idx);
                  triggerHaptic('light');
                }}
                onRotatePage={handleRotatePage}
                onDeletePage={handleDeletePage}
                onAddPage={() => setIsCameraModalOpen(true)}
                orientation="vertical"
              />

              {/* Document Metadata Card */}
              <div className="mt-auto bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-slate-200 font-mono">WASM / Canvas</span>
                </div>
                <div className="flex justify-between">
                  <span>Color Mode:</span>
                  <span className="text-sky-400 font-medium capitalize">{activeFilter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="text-slate-200 font-mono">300 DPI Archival</span>
                </div>
              </div>
            </aside>

            {/* Center Stage: Document Viewport */}
            <section className="flex-1 flex flex-col min-h-0 relative overflow-hidden document-stage">
              {/* Document Canvas Container */}
              <div
                ref={previewContainerRef}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
                className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
              >
                {currentPage?.filteredDataUrl ? (
                  <div className="relative inline-block max-h-full max-w-full">
                    <img
                      src={currentPage.filteredDataUrl}
                      alt="Scanned Document Preview"
                      className="max-h-[50vh] md:max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none transition-all duration-150"
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
                      }}
                    />

                    {/* Overlaid Signatures and Stamps */}
                    {currentOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        onPointerDown={(e) => handleOverlayPointerDown(overlay.id, e)}
                        style={{
                          position: 'absolute',
                          left: `${overlay.x}%`,
                          top: `${overlay.y}%`,
                          transform: 'translate(-50%, -50%)',
                          touchAction: 'none',
                          cursor: 'grab',
                          zIndex: 30,
                        }}
                        className="group p-1 border border-dashed border-sky-400/80 rounded hover:border-sky-400 bg-white/5 backdrop-blur-[1px]"
                      >
                        <img
                          src={overlay.dataUrl}
                          alt="Document overlay"
                          className="pointer-events-none"
                          style={{ width: `${140 * overlay.scale}px` }}
                        />
                        {/* Delete Overlay Badge */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOverlay(overlay.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow"
                          title="Remove stamp / signature"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Upload className="w-12 h-12 stroke-1" />
                    <p className="text-xs">No document loaded</p>
                  </div>
                )}
              </div>

              {/* Mobile View: Page Carousel & Dock */}
              <div className="md:hidden flex flex-col gap-2 p-2.5 bg-slate-900/80 border-t border-white/10 backdrop-blur-xl z-20">
                {/* Horizontal Page Filmstrip */}
                {pages.length > 0 && (
                  <PageCarousel
                    pages={pages}
                    activePageIndex={activePageIndex}
                    onSelectPage={(idx) => {
                      setActivePageIndex(idx);
                      triggerHaptic('light');
                    }}
                    onRotatePage={handleRotatePage}
                    onDeletePage={handleDeletePage}
                    onAddPage={() => setIsCameraModalOpen(true)}
                    orientation="horizontal"
                  />
                )}

                {/* Filter Selector Strip */}
                <FilterBar activeFilter={activeFilter} onSelectFilter={handleFilterSelect} layout="row" />

                {/* Bottom Action Dock */}
                <ScanActionBar
                  onAdjustCorners={() => setAppMode('adjust')}
                  onRunOcr={() => handleRunOcr(ocrLanguage)}
                  onOpenSignature={() => setIsSignatureModalOpen(true)}
                  onOpenWatermark={() => setIsWatermarkModalOpen(true)}
                  onToggleTuning={() => setIsTuningOpen((prev) => !prev)}
                  onExportPdf={() => setIsExportModalOpen(true)}
                  isExporting={isExporting}
                  isTelegram={isTelegram}
                  pageCount={pages.length}
                />
              </div>
            </section>

            {/* Desktop Right Inspector Studio */}
            <aside className="hidden md:flex flex-col w-80 border-l border-white/10 bg-slate-900/50 p-4 gap-4 overflow-y-auto flex-shrink-0 z-20">
              {/* Filter Presets Box */}
              <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Enhancement Presets</span>
                </div>
                <FilterBar activeFilter={activeFilter} onSelectFilter={handleFilterSelect} layout="grid" />
              </div>

              {/* Inline Fine-Tuning Module */}
              <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                <TuningSliderBar
                  isOpen={true}
                  isInline={true}
                  onClose={() => {}}
                  values={tuning}
                  onChange={handleTuningChange}
                  onReset={() => handleTuningChange({ threshold: 15, brightness: 0, contrast: 0 })}
                />
              </div>

              {/* Tools & Security Box */}
              <div className="flex flex-col gap-2.5 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                <span className="text-xs font-semibold text-white">Document Tools</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAppMode('adjust')}
                    className="btn-secondary py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
                    title="Re-adjust document crop corners"
                  >
                    <Crop className="w-4 h-4 text-emerald-400" />
                    <span>Adjust Crop</span>
                  </button>

                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="btn-secondary py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
                    title="Sign document"
                  >
                    <PenTool className="w-4 h-4 text-blue-400" />
                    <span>Add Signature</span>
                  </button>

                  <button
                    onClick={() => setIsWatermarkModalOpen(true)}
                    className="btn-secondary py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
                    title="Add stamp or watermark"
                  >
                    <Stamp className="w-4 h-4 text-rose-400" />
                    <span>Add Stamp</span>
                  </button>

                  <button
                    onClick={() => handleRunOcr(ocrLanguage)}
                    className="btn-secondary py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
                    title="Run OCR to extract text"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>OCR Text</span>
                  </button>
                </div>
              </div>

              {/* Primary Compilation & Export Button */}
              <div className="mt-auto pt-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting || pages.length === 0}
                  className="btn-primary w-full py-3.5 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Compiling PDF...</span>
                    </>
                  ) : isTelegram ? (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send PDF to Telegram ({pages.length})</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Save PDF ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'})</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Floating Tuning Sheet for Mobile */}
      <TuningSliderBar
        isOpen={isTuningOpen}
        onClose={() => setIsTuningOpen(false)}
        values={tuning}
        onChange={handleTuningChange}
        onReset={() => handleTuningChange({ threshold: 15, brightness: 0, contrast: 0 })}
        isInline={false}
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleAddSignature}
      />

      {/* Watermark Modal */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        onApplyWatermark={handleAddWatermark}
      />

      {/* Export Settings Modal */}
      <ExportSettingsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={handleConfirmExport}
        isExporting={isExporting}
        isTelegram={isTelegram}
        pageCount={pages.length}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCaptureImage={handleAddNewPhoto}
        onFallbackUpload={() => fileInputRef.current?.click()}
      />

      {/* OCR Text Extractor Modal with Language Dropdown */}
      <OcrResultModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        isProcessing={ocr.isProcessing}
        progress={ocr.progress}
        status={ocr.status}
        text={ocr.text}
        wordCount={ocr.wordCount}
        onReRunOcr={(lang) => handleRunOcr(lang)}
      />
    </div>
  );
};
