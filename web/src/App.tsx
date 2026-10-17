import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { DocumentViewer } from './components/DocumentViewer';
import {
  DocumentMetadata,
  ViewerSettings,
  SearchState,
} from './types';
import {
  createMarkdownRenderer,
  extractOutline,
  computeDocumentStats,
} from './lib/markdown';
import { DocumentService } from './services/documentService';

const SETTINGS_STORAGE_KEY = 'md_viewer_settings';

const DEFAULT_SETTINGS: ViewerSettings = {
  theme: 'paper',
  viewMode: 'paged',
  zoom: 1.0,
  fontFamily: 'sans',
  fontSize: 16,
  showSidebar: true,
  autoReload: true,
};

export const App: React.FC = () => {
  // Document state
  const [markdown, setMarkdown] = useState<string>('');
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(true);

  // Pagination and navigation state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState<ViewerSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall back to default
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    query: '',
    matchesCount: 0,
    currentMatchIndex: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save settings on update
  const handleUpdateSettings = useCallback((updates: Partial<ViewerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Sync theme class to document body / root
  useEffect(() => {
    document.documentElement.classList.remove('theme-paper', 'theme-sepia', 'theme-slate', 'theme-dark', 'dark');
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark', 'theme-dark');
    } else if (settings.theme === 'slate') {
      document.documentElement.classList.add('dark', 'theme-slate');
    } else if (settings.theme === 'sepia') {
      document.documentElement.classList.add('theme-sepia');
    } else {
      document.documentElement.classList.add('theme-paper');
    }
  }, [settings.theme]);

  // Load document from Rust backend via DocumentService
  const loadDocument = useCallback(async () => {
    const doc = await DocumentService.fetchCurrentDocument();
    if (doc) {
      setMarkdown(doc.markdown);
      setMetadata(doc.metadata);
    }
  }, []);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Server-Sent Events (SSE) for Live Reload from Rust watcher
  useEffect(() => {
    const unsubscribe = DocumentService.subscribeToFileChanges(
      () => {
        if (settings.autoReload) {
          loadDocument();
        }
      },
      (connected) => {
        setIsWatching(connected);
      }
    );

    return unsubscribe;
  }, [settings.autoReload, loadDocument]);

  // Compute HTML renderer & outline
  const renderer = useMemo(() => {
    return createMarkdownRenderer(metadata?.dirPath || '');
  }, [metadata?.dirPath]);

  const htmlContent = useMemo(() => {
    if (!markdown) return '';
    return renderer.render(markdown);
  }, [markdown, renderer]);

  const outline = useMemo(() => {
    if (!markdown) return [];
    return extractOutline(markdown);
  }, [markdown]);

  // Section jumping from outline
  const handleSelectHeading = useCallback((id: string) => {
    setActiveHeadingId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Page jumping
  const handlePageChange = useCallback((targetPage: number) => {
    const clamped = Math.max(1, Math.min(targetPage, totalPages));
    setCurrentPage(clamped);
    const targetEl = document.getElementById(`page-${clamped}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setSearchState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
      } else if (isCtrlOrMeta && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (isCtrlOrMeta && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        window.print();
      } else if (isCtrlOrMeta && e.key === '\\') {
        e.preventDefault();
        handleUpdateSettings({ showSidebar: !settings.showSidebar });
      } else if (isCtrlOrMeta && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleUpdateSettings({ zoom: Math.min(2.0, +(settings.zoom + 0.1).toFixed(2)) });
      } else if (isCtrlOrMeta && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleUpdateSettings({ zoom: Math.max(0.5, +(settings.zoom - 0.1).toFixed(2)) });
      } else if (isCtrlOrMeta && e.key === '0') {
        e.preventDefault();
        handleUpdateSettings({ zoom: 1.0 });
      } else if (e.key === 'PageDown' && settings.viewMode === 'paged') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'PageUp' && settings.viewMode === 'paged') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, currentPage, totalPages, handleUpdateSettings, handlePageChange]);

  // Handle local file selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setMarkdown(content);
      const stats = computeDocumentStats(content);
      const outlineItems = extractOutline(content);
      setMetadata({
        fileName: file.name,
        filePath: file.name,
        dirPath: '',
        sizeBytes: file.size,
        lastModified: new Date(file.lastModified).toLocaleTimeString(),
        wordCount: stats.words,
        readingTimeMinutes: stats.readingTimeMinutes,
        headingCount: outlineItems.length,
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans select-text">
      {/* Hidden file input for native Open File dialog */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* PDF Viewer Header Toolbar */}
      <Toolbar
        fileName={metadata?.fileName || ''}
        filePath={metadata?.filePath || ''}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onToggleSearch={() => setSearchState((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
        onOpenFile={() => fileInputRef.current?.click()}
        onReload={loadDocument}
        onPrint={() => window.print()}
        isWatching={isWatching}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Outline & Document Info) */}
        <Sidebar
          isOpen={settings.showSidebar}
          outline={outline}
          activeHeadingId={activeHeadingId}
          onSelectHeading={handleSelectHeading}
          metadata={metadata}
        />

        {/* Center Document Viewport */}
        <DocumentViewer
          htmlContent={htmlContent}
          documentTitle={metadata?.fileName || ''}
          settings={settings}
          searchState={searchState}
          onUpdateSearchMatches={(count) => {
            setSearchState((prev) => ({
              ...prev,
              matchesCount: count,
              currentMatchIndex: Math.min(prev.currentMatchIndex, Math.max(0, count - 1)),
            }));
          }}
          onPageChange={(curr, total) => {
            setCurrentPage(curr);
            setTotalPages(total);
          }}
          onDropFile={handleFileSelected}
        />

        {/* Floating Search Bar */}
        <SearchBar
          searchState={searchState}
          onUpdateQuery={(query) => setSearchState((prev) => ({ ...prev, query, currentMatchIndex: 0 }))}
          onNextMatch={() => {
            if (searchState.matchesCount > 0) {
              setSearchState((prev) => ({
                ...prev,
                currentMatchIndex: (prev.currentMatchIndex + 1) % searchState.matchesCount,
              }));
            }
          }}
          onPrevMatch={() => {
            if (searchState.matchesCount > 0) {
              setSearchState((prev) => ({
                ...prev,
                currentMatchIndex:
                  (prev.currentMatchIndex - 1 + searchState.matchesCount) % searchState.matchesCount,
              }));
            }
          }}
          onClose={() => setSearchState((prev) => ({ ...prev, isOpen: false, query: '' }))}
        />
      </div>
    </div>
  );
};
