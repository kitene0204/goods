import React from 'react';
import { Search, X, Filter, LayoutGrid, List, ArrowUpDown } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
  divisions: string[];
  totalMatches: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortOrder: 'default' | 'name' | 'checked';
  onCycleSort?: () => void;
  onSortOrderChange?: (order: 'default' | 'name' | 'checked') => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedDivision,
  onDivisionChange,
  divisions,
  totalMatches,
  viewMode,
  onViewModeChange,
  sortOrder,
  onCycleSort,
  onSortOrderChange,
}) => {
  const handleSortToggle = () => {
    if (onCycleSort) {
      onCycleSort();
    } else if (onSortOrderChange) {
      const nextOrder = sortOrder === 'default' ? 'name' : sortOrder === 'name' ? 'checked' : 'default';
      onSortOrderChange(nextOrder);
    }
  };
  return (
    <div className="space-y-3 mb-4">
      {/* Top Search Input & Action Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="participant-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="이름 또는 초성 검색 (예: ㄱㅊㅅ, 김동현, 010...)"
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none text-base sm:text-lg text-slate-900 placeholder:text-slate-400 font-medium transition-all"
          />
          {searchTerm && (
            <button
              id="search-clear-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Order Toggle */}
        <button
          id="search-sort-btn"
          onClick={handleSortToggle}
          className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-sm font-semibold"
          title="정렬 방식 전환"
        >
          <ArrowUpDown className="w-5 h-5 text-slate-600" />
          <span className="hidden md:inline text-xs text-slate-600 font-bold">
            {sortOrder === 'default' ? '기본순' : sortOrder === 'name' ? '이름순' : '미수령순'}
          </span>
        </button>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
          <button
            id="view-mode-grid-btn"
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-lime-400 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="대형 카드 그리드 모드"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            id="view-mode-list-btn"
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-slate-900 text-lime-400 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="상세 리스트 모드"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Division Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> 부수:
        </span>
        <button
          id="division-chip-all"
          onClick={() => onDivisionChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
            selectedDivision === 'all'
              ? 'bg-slate-900 text-lime-400 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          전체 부수
        </button>
        {divisions.map((div) => (
          <button
            key={div}
            id={`division-chip-${div}`}
            onClick={() => onDivisionChange(div)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedDivision === div
                ? 'bg-slate-900 text-lime-400 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {div}
          </button>
        ))}
        {searchTerm && (
          <span className="text-xs text-slate-500 ml-auto shrink-0 font-medium bg-slate-200/80 px-2.5 py-1 rounded-full">
            검색결과: <strong className="text-slate-900">{totalMatches}명</strong>
          </span>
        )}
      </div>
    </div>
  );
};
