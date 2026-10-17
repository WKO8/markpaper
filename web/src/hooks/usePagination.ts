import { useState, useEffect } from 'react';
import { ViewMode, ViewerFont } from '../types';

interface PaginationOptions {
  htmlContent: string;
  viewMode: ViewMode;
  fontSize: number;
  fontFamily: ViewerFont;
  onPageCountChange?: (totalPages: number) => void;
}

const PAGE_CONTENT_HEIGHT = 900; // Standard available content height in virtual A4/Letter page

/**
 * Hook to partition HTML content into realistic, publication-grade PDF-style pages.
 * Handles DOM height measurement offscreen, heading-aware breaks, and fallback continuous flow.
 */
export function usePagination({
  htmlContent,
  viewMode,
  fontSize,
  fontFamily,
  onPageCountChange,
}: PaginationOptions): string[] {
  const [pages, setPages] = useState<string[]>([htmlContent]);

  useEffect(() => {
    if (viewMode !== 'paged') {
      setPages([htmlContent]);
      onPageCountChange?.(1);
      return;
    }

    if (!htmlContent) {
      setPages(['']);
      onPageCountChange?.(1);
      return;
    }

    // Create an offscreen staging container to measure child elements accurately
    const staging = document.createElement('div');
    staging.className = `markdown-body font-${fontFamily}`;
    staging.style.fontSize = `${fontSize}px`;
    staging.style.width = '676px'; // 820px sheet width - 144px horizontal padding
    staging.style.visibility = 'hidden';
    staging.style.position = 'absolute';
    staging.innerHTML = htmlContent;
    document.body.appendChild(staging);

    const calculatedPages: string[] = [];
    let currentPageHtml = '';
    let currentHeight = 0;

    const children = Array.from(staging.children);

    if (children.length === 0) {
      calculatedPages.push(htmlContent);
    } else {
      children.forEach((child) => {
        const el = child as HTMLElement;
        const elHeight = el.offsetHeight || 30;

        // Force page break before H1 (if sheet already has content) or if sheet height budget exceeded
        const isH1 = el.tagName === 'H1';
        if (
          (currentHeight + elHeight > PAGE_CONTENT_HEIGHT && currentHeight > 0) ||
          (isH1 && currentHeight > 200)
        ) {
          calculatedPages.push(currentPageHtml);
          currentPageHtml = el.outerHTML;
          currentHeight = elHeight;
        } else {
          currentPageHtml += el.outerHTML;
          currentHeight += elHeight;
        }
      });

      if (currentPageHtml) {
        calculatedPages.push(currentPageHtml);
      }
    }

    document.body.removeChild(staging);

    const finalPages = calculatedPages.length > 0 ? calculatedPages : [htmlContent];
    setPages(finalPages);
    onPageCountChange?.(finalPages.length);
  }, [htmlContent, viewMode, fontSize, fontFamily]);

  return pages;
}
