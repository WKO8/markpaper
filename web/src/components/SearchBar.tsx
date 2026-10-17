import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { SearchState } from '../types';

interface SearchBarProps {
  searchState: SearchState;
  onUpdateQuery: (query: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchState,
  onUpdateQuery,
  onNextMatch,
  onPrevMatch,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchState.isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [searchState.isOpen]);

  if (!searchState.isOpen) return null;

  return (
    <div className="no-print fixed top-14 right-6 z-50 bg-white dark:bg-dark-sheet border border-paper-border dark:border-dark-border rounded-lg shadow-2xl p-1.5 flex items-center gap-1.5 text-xs animate-in slide-in-from-top-2">
      <div className="flex items-center gap-1 pl-1.5 text-gray-400">
        <Search size={14} />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Find in document..."
        value={searchState.query}
        onChange={(e) => onUpdateQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) onPrevMatch();
            else onNextMatch();
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
        className="w-48 bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none px-1 py-1 text-xs"
      />

      <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 px-1 whitespace-nowrap">
        {searchState.query ? (
          searchState.matchesCount > 0 ? (
            `${searchState.currentMatchIndex + 1} of ${searchState.matchesCount}`
          ) : (
            '0 of 0'
          )
        ) : (
          ''
        )}
      </span>

      <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-0.5" />

      <button
        onClick={onPrevMatch}
        disabled={searchState.matchesCount <= 1}
        title="Previous Match (Shift+Enter)"
        className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-black/5 dark:hover:bg-white/5"
      >
        <ChevronUp size={14} />
      </button>

      <button
        onClick={onNextMatch}
        disabled={searchState.matchesCount <= 1}
        title="Next Match (Enter)"
        className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 rounded hover:bg-black/5 dark:hover:bg-white/5"
      >
        <ChevronDown size={14} />
      </button>

      <button
        onClick={onClose}
        title="Close Search (Esc)"
        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-black/5 dark:hover:bg-white/5 ml-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};
