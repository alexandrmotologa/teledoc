import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quad, warpPerspective } from './utils/perspective';
import { FilterType, applyFilter, applyFineTuning } from './utils/filters';
import { createSampleDocumentImage } from './utils/sampleDoc';
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
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

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
          loadInitialPhoto(createSampleDocumentImage());
        });
    } else {
      loadInitialPhoto(createSampleDocumentImage());
    }
  }, []);

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

  const renderProcessedCanvas = useCallback((
    warped: HTMLCanvasElement,
    filter: FilterType,
    tune: TuningValues
  ): HTMLCanvasElement => {
    const filtered = applyFilter(warped, filter, tune.threshold);
    return applyFineTuning(filtered, tune.brightness, tune.contrast);
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

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const defaultCorners: Quad = [
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
        { x: Math.round(w * 0.1), y: Math.round(h * 0.1) },
        { x: Math.round(w * 0.9), y: Math.round(h * 0.1) },
        { x: Math.round(w * 0.9), y: Math.round(h * 0.9) },
        { x: Math.round(w * 0.1), y: Math.round(h * 0.9) },
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
      const dataUrl = event.target?.result as string;
      if (dataUrl) handleAddNewPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add signature overlay
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
    triggerHaptic('success');
  };

  // Add watermark overlay
  const handleAddWatermark = (dataUrl: string) => {
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    const newOverlay: DocumentOverlay = {
      id: `stamp_${Date.now()}`,
      type: 'watermark',
      dataUrl,
      x: 50,
      y: 50,
      scale: 1.15,
    };

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: [...(prev[currentPage.id] || []), newOverlay],
    }));
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

  // Drag overlay across document preview
  const handleOverlayPointerDown = (overlayId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingOverlayId(overlayId);
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!draggingOverlayId || !previewContainerRef.current) return;
    const currentPage = pages[activePageIndex];
    if (!currentPage) return;

    const rect = previewContainerRef.current.getBoundingClientRect();
    const relX = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const relY = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    setOverlaysByPage((prev) => ({
      ...prev,
      [currentPage.id]: (prev[currentPage.id] || []).map((o) =>
        o.id === draggingOverlayId ? { ...o, x: relX, y: relY } : o
      ),
    }));
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    if (draggingOverlayId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      setDraggingOverlayId(null);
    }
  };

  // Run OCR
  const handleRunOcr = (lang: string = 'eng') => {
    const currentPage = pages[activePageIndex];
    if (!currentPage || !currentPage.filteredDataUrl) return;

    setOcrLanguage(lang);
    setIsOcrModalOpen(true);
    triggerHaptic('light');
    ocr.runOcr(currentPage.filteredDataUrl, lang).catch(() => {
      triggerHaptic('error');
    });
  };

  // Burn overlays onto canvas for final PDF compilation
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
        if (!ctx) {
          resolve(page.filteredDataUrl);
          return;
        }

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

      // Burn any signatures or stamps into each page image
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
          message: 'Scanned document sent directly to your Telegram chat!',
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
      setTimeout(() => setExportNotice(null), 5000);
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
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto px-3 py-3 select-none">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            onClick={() => setIsCameraModalOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            title="Open camera scanner"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
        </div>
      </header>

      {/* Draft Recovery Alert */}
      {recoveredDraft && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-2 bg-blue-500/15 border border-sky-400/30 text-sky-200 text-xs">
          <span>Resume previous session ({recoveredDraft.pages.length} {recoveredDraft.pages.length === 1 ? 'page' : 'pages'})?</span>
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
            {/* Scanned Document Preview Canvas with Interactive Overlays */}
            <div
              ref={previewContainerRef}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerUp}
              className="flex-1 relative min-h-[380px] bg-slate-950/90 rounded-2xl border border-white/10 flex items-center justify-center p-3 overflow-hidden shadow-inner"
            >
              {currentPage?.filteredDataUrl ? (
                <div className="relative inline-block max-h-full max-w-full">
                  <img
                    src={currentPage.filteredDataUrl}
                    alt="Scanned Preview"
                    className="max-h-[60vh] max-w-full object-contain rounded shadow-2xl pointer-events-none"
                    style={{ filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.7))' }}
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
                  <Upload className="w-10 h-10 stroke-1" />
                  <p className="text-xs">No document loaded</p>
                </div>
              )}
            </div>

            {/* Manual Fine-Tuning Drawer */}
            <TuningSliderBar
              isOpen={isTuningOpen}
              onClose={() => setIsTuningOpen(false)}
              values={tuning}
              onChange={handleTuningChange}
              onReset={() => handleTuningChange({ threshold: 15, brightness: 0, contrast: 0 })}
            />

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
                  onAddPage={() => setIsCameraModalOpen(true)}
                />
              </div>
            )}

            {/* Bottom Floating Action Bar */}
            <div className="mt-auto pt-1">
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
          </div>
        )}
      </main>

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
