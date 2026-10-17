import { useEffect, RefObject } from 'react';
import mermaid from 'mermaid';
import { ViewerTheme } from '../types';

/**
 * Hook to render Mermaid diagrams inside a DOM container when content or theme updates.
 * Handles async rendering, diagram error fallbacks, and cleanup.
 */
export function useMermaid(
  containerRef: RefObject<HTMLElement | null>,
  deps: any[],
  theme: ViewerTheme
) {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' || theme === 'slate' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    if (!containerRef.current) return;
    let isMounted = true;

    const renderAllMermaid = async () => {
      const wrappers = containerRef.current?.querySelectorAll<HTMLElement>('.mermaid-wrapper');
      if (!wrappers || wrappers.length === 0) return;

      for (let i = 0; i < wrappers.length; i++) {
        const wrapper = wrappers[i];
        const rawEncoded = wrapper.getAttribute('data-mermaid-code');
        if (!rawEncoded) continue;

        const rawCode = decodeURIComponent(rawEncoded).trim();
        const diagramId = `mermaid-diag-${Date.now()}-${i}`;

        try {
          const { svg } = await mermaid.render(diagramId, rawCode);
          if (isMounted && wrapper) {
            wrapper.innerHTML = svg;
          }
        } catch (err: any) {
          console.warn('[useMermaid] Diagram render notice:', err);
          const errEl = document.getElementById(diagramId);
          if (errEl) errEl.remove();
          const dErrEl = document.getElementById(`d${diagramId}`);
          if (dErrEl) dErrEl.remove();

          if (isMounted && wrapper) {
            wrapper.innerHTML = `
              <div class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg text-xs font-mono w-full">
                <div class="font-semibold text-amber-800 dark:text-amber-300 mb-1">Diagram Syntax Notice</div>
                <div class="text-amber-700 dark:text-amber-400 text-[11px] mb-2">${err?.message || 'Check diagram syntax'}</div>
                <pre class="bg-black/5 dark:bg-white/5 p-2 rounded text-[11px] overflow-x-auto">${rawCode}</pre>
              </div>
            `;
          }
        }
      }
    };

    const timer = setTimeout(renderAllMermaid, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [containerRef, theme, ...deps]);
}
