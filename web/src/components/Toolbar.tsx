import React, { useState } from 'react';
import {
  Sidebar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Printer,
  Sun,
  Moon,
  BookOpen,
  FileText,
  Type,
  FolderOpen,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { ThemeMode, ViewMode, FontFamily, ViewerSettings } from '../types';

interface ToolbarProps {
  fileName: string;
  filePath: string;
  settings: ViewerSettings;
  onUpdateSettings: (updates: Partial<ViewerSettings>) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleSearch: () => void;
  onOpenFile: () => void;
  onReload: () => void;
  onPrint: () => void;
  isWatching: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  fileName,
  filePath,
  settings,
  onUpdateSettings,
  currentPage,
  totalPages,
  onPageChange,
  onToggleSearch,
  onOpenFile,
  onReload,
  onPrint,
  isWatching,
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const zoomPercent = Math.round(settings.zoom * 100);

  const handleZoomIn = () => {
    onUpdateSettings({ zoom: Math.min(2.0, +(settings.zoom + 0.1).toFixed(2)) });
  };

  const handleZoomOut = () => {
    onUpdateSettings({ zoom: Math.max(0.5, +(settings.zoom - 0.1).toFixed(2)) });
  };

  const handleZoomReset = () => {
    onUpdateSettings({ zoom: 1.0 });
  };

  const handleFitWidth = () => {
    // Fits standard page width (820px) to window width with padding
    const containerWidth = window.innerWidth - (settings.showSidebar ? 300 : 0) - 80;
    const targetZoom = Math.min(1.75, Math.max(0.6, +(containerWidth / 820).toFixed(2)));
    onUpdateSettings({ zoom: targetZoom });
  };

  return (
    <header className="no-print h-12 bg-white/95 dark:bg-dark-sheet/95 backdrop-blur border-b border-paper-border dark:border-dark-border px-3 flex items-center justify-between text-xs select-none sticky top-0 z-40 transition-colors shadow-pdf-bar">
      {/* Left: Sidebar Toggle & Document Title */}
      <div className="flex items-center gap-2 min-w-0 max-w-[28%]">
        <button
          onClick={() => onUpdateSettings({ showSidebar: !settings.showSidebar })}
          title="Toggle Outline / Sidebar (Ctrl+\)"
          className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
            settings.showSidebar ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          <Sidebar size={16} />
        </button>

        <button
          onClick={onOpenFile}
          title="Open Markdown File (Ctrl+O)"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline font-medium">Open</span>
        </button>

        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="truncate" title={filePath || 'No file selected'}>
          <div className="font-semibold text-gray-800 dark:text-gray-100 truncate text-[13px] leading-tight">
            {fileName || 'Untitled Document'}
          </div>
        </div>
      </div>

      {/* Center: Pagination & Zoom Controls */}
      <div className="flex items-center gap-1.5">
        {/* Pagination in Paged Mode */}
        {settings.viewMode === 'paged' && totalPages > 0 && (
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-md px-1.5 py-0.5 mr-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded"
              title="Previous Page (PageUp)"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-gray-700 dark:text-gray-200 font-mono text-[11px] px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded"
              title="Next Page (PageDown)"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-md p-0.5 mr-1">
          <button
            onClick={() => onUpdateSettings({ viewMode: 'paged' })}
            title="Paged Sheets Mode (PDF Page View)"
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition-all ${
              settings.viewMode === 'paged'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span className="hidden md:inline">Pages</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ viewMode: 'continuous' })}
            title="Continuous Document Mode"
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition-all ${
              settings.viewMode === 'continuous'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span className="hidden md:inline">Flow</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 rounded-md p-0.5">
          <button
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl+-)"
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded"
          >
            <ZoomOut size={14} />
          </button>

          <button
            onClick={handleZoomReset}
            title="Reset Zoom to 100% (Ctrl+0)"
            className="w-12 text-center font-mono text-[11px] text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded py-0.5"
          >
            {zoomPercent}%
          </button>

          <button
            onClick={handleZoomIn}
            title="Zoom In (Ctrl++)"
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded"
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={handleFitWidth}
            title="Fit Width"
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded ml-0.5"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Right: Search, Typography, Theme, Print, Reload */}
      <div className="flex items-center gap-1.5">
        {/* Search in document */}
        <button
          onClick={onToggleSearch}
          title="Search in Document (Ctrl+F)"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <Search size={15} />
        </button>

        {/* Typography Selector Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTypeMenu(!showTypeMenu);
              setShowThemeMenu(false);
            }}
            title="Typography & Text Settings"
            className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
              showTypeMenu ? 'bg-black/10 dark:bg-white/15 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Type size={15} />
          </button>

          {showTypeMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-dark-sheet rounded-lg shadow-xl border border-paper-border dark:border-dark-border p-3 z-50 animate-in fade-in">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Typeface
              </div>
              <div className="flex flex-col gap-1 mb-3">
                {[
                  { id: 'sans', label: 'Clean Sans' },
                  { id: 'serif', label: 'Editorial Serif' },
                  { id: 'mono', label: 'Monospace' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onUpdateSettings({ fontFamily: font.id as FontFamily });
                      setShowTypeMenu(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs ${
                      settings.fontFamily === font.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{font.label}</span>
                    {settings.fontFamily === font.id && <Check size={13} />}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Font Size: {settings.fontSize}px
              </div>
              <input
                type="range"
                min="13"
                max="22"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Theme Picker Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowTypeMenu(false);
            }}
            title="Reading Theme"
            className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
              showThemeMenu ? 'bg-black/10 dark:bg-white/15 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {settings.theme === 'dark' || settings.theme === 'slate' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-dark-sheet rounded-lg shadow-xl border border-paper-border dark:border-dark-border p-2 z-50 animate-in fade-in">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 px-2">
                Document Palette
              </div>
              {[
                { id: 'paper', label: 'Paper White', icon: Sun },
                { id: 'sepia', label: 'Warm Sepia', icon: BookOpen },
                { id: 'slate', label: 'Slate Gray', icon: Moon },
                { id: 'dark', label: 'Obsidian Dark', icon: Moon },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onUpdateSettings({ theme: theme.id as ThemeMode });
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs ${
                    settings.theme === theme.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <theme.icon size={13} />
                    <span>{theme.label}</span>
                  </div>
                  {settings.theme === theme.id && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live-reload indicator & manual reload */}
        <button
          onClick={onReload}
          title={isWatching ? 'Auto-reload is active on file changes. Click to reload now.' : 'Reload file from disk'}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
        >
          <RefreshCw size={15} />
          {isWatching && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
          )}
        </button>

        {/* Print / Export to PDF */}
        <button
          onClick={onPrint}
          title="Print or Export to PDF (Ctrl+P)"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <Printer size={15} />
        </button>
      </div>
    </header>
  );
};
