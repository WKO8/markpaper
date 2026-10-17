import React, { useRef, useState } from 'react';
import { ViewerSettings, SearchState } from '../types';
import { usePagination } from '../hooks/usePagination';
import { useMermaid } from '../hooks/useMermaid';
import { useSearchHighlight } from '../hooks/useSearchHighlight';

interface DocumentViewerProps {
  htmlContent: string;
  documentTitle: string;
  settings: ViewerSettings;
  searchState: SearchState;
  onUpdateSearchMatches: (count: number) => void;
  onPageChange: (currentPage: number, totalPages: number) => void;
  onDropFile: (file: File) => void;
}

/**
 * Presentation component for displaying the publication-grade document.
 * Composes specialized hooks for pagination, Mermaid rendering, and search highlights.
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  htmlContent,
  documentTitle,
  settings,
  searchState,
  onUpdateSearchMatches,
  onPageChange,
  onDropFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hook 1: Slices content into PDF-style sheets or continuous flow
  const pages = usePagination({
    htmlContent,
    viewMode: settings.viewMode,
    fontSize: settings.fontSize,
    fontFamily: settings.fontFamily,
    onPageCountChange: (total) => onPageChange(1, total),
  });

  // Hook 2: Renders any Mermaid diagrams present in the DOM
  useMermaid(contentRef, [pages, htmlContent], settings.theme);

  // Hook 3: Performs text search and highlight overlay
  useSearchHighlight(
    contentRef,
    searchState.query,
    searchState.currentMatchIndex,
    [htmlContent, pages],
    onUpdateSearchMatches
  );

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.md') ||
        file.name.endsWith('.markdown') ||
        file.type.includes('markdown') ||
        file.type.includes('text')
      ) {
        onDropFile(file);
      }
    }
  };

  // Intercept anchor clicks to support in-document jump links and safe external tabs
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      e.preventDefault();
      const rawTarget = href.slice(1);
      const targetId = decodeURIComponent(rawTarget).trim();

      // Find target by ID or slug attribute
      const targetEl =
        document.getElementById(targetId) ||
        document.querySelector(`[data-heading-slug="${targetId}"]`) ||
        document.querySelector(`[id^="${targetId}"]`) ||
        document.querySelector(`[data-heading-slug^="${targetId}"]`);

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const fontClass =
    settings.fontFamily === 'serif'
      ? 'font-serif'
      : settings.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const themeClass =
    settings.theme === 'sepia'
      ? 'bg-sepia-canvas text-sepia-ink'
      : settings.theme === 'slate'
      ? 'bg-slate-canvas text-slate-ink'
      : settings.theme === 'dark'
      ? 'bg-dark-canvas text-dark-ink'
      : 'bg-paper-canvas text-paper-ink';

  return (
    <main
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden p-6 md:p-10 relative transition-colors ${themeClass}`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-4 z-50 border-2 border-dashed border-blue-500 bg-blue-50/80 dark:bg-blue-950/80 rounded-xl flex items-center justify-center backdrop-blur-sm pointer-events-none">
          <div className="text-center font-semibold text-blue-600 dark:text-blue-400 text-lg">
            Drop Markdown file to view
          </div>
        </div>
      )}

      {/* Document Scaled Viewport */}
      <div
        ref={contentRef}
        onClick={handleContentClick}
        style={{
          transform: `scale(${settings.zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.12s ease-out',
        }}
        className="w-full flex flex-col items-center"
      >
        {settings.viewMode === 'paged' ? (
          // Paged Sheets Mode (PDF Page View)
          pages.map((pageHtml, index) => (
            <article
              key={index}
              id={`page-${index + 1}`}
              className="pdf-page-sheet"
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              {/* Running Header */}
              <div className="pdf-page-header">
                <span className="truncate max-w-[70%]">{documentTitle || 'Markdown Document'}</span>
                <span>Section {index + 1}</span>
              </div>

              {/* Sheet Body */}
              <div
                className={`markdown-body ${fontClass} pt-4 pb-4`}
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />

              {/* Running Footer with Page Numbers */}
              <div className="pdf-page-footer">
                <span>PDF Style Viewer</span>
                <span className="font-mono font-medium">
                  Page {index + 1} of {pages.length}
                </span>
              </div>
            </article>
          ))
        ) : (
          // Continuous Reading Mode
          <article
            className="pdf-page-sheet min-h-[92vh] max-w-[860px]"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            <div
              className={`markdown-body ${fontClass}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </article>
        )}
      </div>
    </main>
  );
};
