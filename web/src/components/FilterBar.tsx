import React from 'react';
import { FilterType, FILTER_PRESETS } from '../utils/filters';
import { Sparkles, Palette, CircleDot, Image as ImageIcon } from 'lucide-react';

interface FilterBarProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onSelectFilter }) => {
  const getIcon = (id: FilterType) => {
    switch (id) {
      case 'magic-bw':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'enhanced-color':
        return <Palette className="w-4 h-4 text-emerald-400" />;
      case 'grayscale':
        return <CircleDot className="w-4 h-4 text-sky-400" />;
      case 'original':
        return <ImageIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
      {FILTER_PRESETS.map((preset) => {
        const isSelected = activeFilter === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectFilter(preset.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              isSelected
                ? 'bg-blue-600/30 text-white border-sky-400/80 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {getIcon(preset.id)}
            <span>{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
};
