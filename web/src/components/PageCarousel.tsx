import React from 'react';
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
}

export const PageCarousel: React.FC<PageCarouselProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onAddPage,
}) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
      {pages.map((page, index) => {
        const isActive = index === activePageIndex;
        return (
          <div
            key={page.id}
            className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 group ${
              isActive
                ? 'border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105'
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
            <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {index + 1}
            </div>

            {/* Quick action buttons overlay */}
            <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRotatePage(index);
                }}
                className="bg-slate-900/80 hover:bg-blue-600 text-white p-1 rounded backdrop-blur-sm"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(index);
                  }}
                  className="bg-slate-900/80 hover:bg-red-600 text-white p-1 rounded backdrop-blur-sm"
                  title="Remove page"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Page Button */}
      <button
        onClick={onAddPage}
        className="flex-shrink-0 w-20 h-28 rounded-lg border-2 border-dashed border-white/20 hover:border-sky-400 hover:bg-sky-500/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-400 transition-all duration-200"
      >
        <Plus className="w-6 h-6" />
        <span className="text-[11px] font-medium">Add Page</span>
      </button>
    </div>
  );
};
