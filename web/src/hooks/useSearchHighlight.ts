import { useEffect, RefObject } from 'react';

/**
 * Hook to manage DOM text highlighting for in-document search.
 * Traverses text nodes via TreeWalker, highlights matching query occurrences,
 * marks current active occurrence, and scrolls to it.
 */
export function useSearchHighlight(
  containerRef: RefObject<HTMLElement | null>,
  query: string,
  currentMatchIndex: number,
  deps: any[],
  onUpdateMatches: (count: number) => void
) {
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous highlights
    const oldMarks = containerRef.current.querySelectorAll('mark.search-highlight');
    oldMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });

    if (!query || query.trim().length === 0) {
      onUpdateMatches(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const matchNodes: HTMLElement[] = [];

    // TreeWalker to safely find visible text nodes without touching scripts or styles
    const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodesToReplace: { node: Text; matches: number[] }[] = [];
    let textNode: Text | null;

    while ((textNode = walker.nextNode() as Text | null)) {
      const val = textNode.nodeValue || '';
      const lower = val.toLowerCase();
      let index = 0;
      const indices: number[] = [];
      while ((index = lower.indexOf(searchQuery, index)) !== -1) {
        indices.push(index);
        index += searchQuery.length;
      }
      if (indices.length > 0) {
        nodesToReplace.push({ node: textNode, matches: indices });
      }
    }

    nodesToReplace.forEach(({ node, matches }) => {
      const val = node.nodeValue || '';
      const fragment = document.createDocumentFragment();
      let lastIdx = 0;

      matches.forEach((idx) => {
        if (idx > lastIdx) {
          fragment.appendChild(document.createTextNode(val.substring(lastIdx, idx)));
        }
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = val.substring(idx, idx + searchQuery.length);
        fragment.appendChild(mark);
        matchNodes.push(mark);
        lastIdx = idx + searchQuery.length;
      });

      if (lastIdx < val.length) {
        fragment.appendChild(document.createTextNode(val.substring(lastIdx)));
      }

      node.parentNode?.replaceChild(fragment, node);
    });

    onUpdateMatches(matchNodes.length);

    if (matchNodes.length > 0) {
      const activeIdx = Math.min(currentMatchIndex, matchNodes.length - 1);
      const activeNode = matchNodes[activeIdx];
      if (activeNode) {
        activeNode.classList.add('search-highlight-current');
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [containerRef, query, currentMatchIndex, ...deps]);
}
