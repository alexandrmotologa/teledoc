import { RotateCw, Trash2, Plus } from 'lucide-react';

export interface ScannedPage {
  id: string;
  rawImageSrc: string;
  warpedCanvas: HTMLCanvasElement | null;
  filteredDataUrl: string;
  rotation: number; // 0, 90, 180, 270
}

interface PageCarouselProps {
  pages: ScannedPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onAddPage: () => void;
  orientation?: 'horizontal' | 'vertical';
}

export const PageCarousel: React.FC<PageCarouselProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onAddPage,
  orientation = 'horizontal',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pages ({pages.length})
          </span>
          <button
            onClick={onAddPage}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            title="Add page from camera or gallery"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {pages.map((page, index) => {
            const isActive = index === activePageIndex;
            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(index)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600/20 border-sky-400/80 shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/15'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-white/10 relative">
                  <img
                    src={page.filteredDataUrl || page.rawImageSrc}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                  <div className="absolute top-0.5 left-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                    {index + 1}
                  </div>
                </div>

                {/* Page Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    Page {index + 1}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {page.rotation}° rotation
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(index);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(index);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal Mobile Carousel
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
      {pages.map((page, index) => {
        const isActive = index === activePageIndex;
        return (
          <div
            key={page.id}
            className={`relative flex-shrink-0 w-16 h-22 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 group ${
              isActive
                ? 'border-sky-400 shadow-lg shadow-sky-500/20 scale-105'
                : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
            }`}
            onClick={() => onSelectPage(index)}
          >
            {/* Page Thumbnail */}
            <img
              src={page.filteredDataUrl || page.rawImageSrc}
              alt={`Page ${index + 1}`}
              className="w-full h-full object-cover"
              style={{ transform: `rotate(${page.rotation}deg)` }}
            />

            {/* Page Number Badge */}
            <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {index + 1}
            </div>

            {/* Quick action buttons overlay */}
            <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRotatePage(index);
                }}
                className="bg-slate-900/90 hover:bg-blue-600 text-white p-1 rounded-md backdrop-blur-sm"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-2.5 h-2.5" />
              </button>
              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(index);
                  }}
                  className="bg-slate-900/90 hover:bg-red-600 text-white p-1 rounded-md backdrop-blur-sm"
                  title="Remove page"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Page Card */}
      <button
        onClick={onAddPage}
        className="flex-shrink-0 w-16 h-22 rounded-xl border border-dashed border-white/20 hover:border-sky-400 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-all active:scale-95"
        title="Add new document page"
      >
        <Plus className="w-4 h-4 text-sky-400" />
        <span className="text-[9px] font-medium">Add</span>
      </button>
    </div>
  );
};
