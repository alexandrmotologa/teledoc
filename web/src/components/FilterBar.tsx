import React from 'react';
import { FilterType, FILTER_PRESETS } from '../utils/filters';
import { Sparkles, Palette, CircleDot, Image as ImageIcon, Check } from 'lucide-react';

interface FilterBarProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  layout?: 'grid' | 'row';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onSelectFilter,
  layout = 'row',
}) => {
  const getIcon = (id: FilterType) => {
    switch (id) {
      case 'magic-bw':
        return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />;
      case 'enhanced-color':
        return <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />;
      case 'grayscale':
        return <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />;
      case 'original':
        return <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />;
    }
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {FILTER_PRESETS.map((preset) => {
          const isSelected = activeFilter === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectFilter(preset.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border text-left ${
                isSelected
                  ? 'bg-blue-600/25 text-white border-sky-400 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-900/40 text-slate-300 border-white/10 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getIcon(preset.id)}
                <span className="truncate">{preset.name}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Row segmented pill layout
  return (
    <div className="flex items-center gap-1.5 p-1 glass-panel border border-white/10 rounded-2xl overflow-x-auto no-scrollbar bg-slate-900/60">
      {FILTER_PRESETS.map((preset) => {
        const isSelected = activeFilter === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectFilter(preset.id)}
            className={`flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                : 'bg-transparent text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            {getIcon(preset.id)}
            <span className="truncate">{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
};
