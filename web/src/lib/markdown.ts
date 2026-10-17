import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import markedFootnote from 'marked-footnote';
import hljs from 'highlight.js';
import { slugify } from './slug';

export { slugify } from './slug';
export { extractOutline } from './outline';
export { computeDocumentStats, type DocumentStats } from './stats';

// Alert icons mapping for GitHub alerts
const ALERT_ICONS: Record<string, string> = {
  note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  tip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  important: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
  caution: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};

/**
 * Creates a configured Marked renderer instance supporting:
 * - Mathematical notation (KaTeX)
 * - Academic / GFM footnotes (marked-footnote)
 * - Syntax highlighting with language badges and copy button
 * - Mermaid diagram placeholders
 * - Relative local images via backend endpoint
 * - Task checklists
 * - GitHub-style callouts/alerts (> [!NOTE])
 */
export function createMarkdownRenderer(baseDirPath: string = '') {
  const marked = new Marked(
    markedKatex({
      throwOnError: false,
      output: 'htmlAndMathml',
      displayMode: false,
    }),
    markedFootnote()
  );

  const usedSlugs = new Map<string, number>();

  marked.use({
    renderer: {
      heading({ tokens, depth }: { tokens: any[]; depth: number }) {
        const text = this.parser.parseInline(tokens);
        const plainText = text.replace(/<[^>]+>/g, '').trim();
        let baseSlug = slugify(plainText);
        if (!baseSlug) baseSlug = `section-${depth}`;

        const count = usedSlugs.get(baseSlug) || 0;
        usedSlugs.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;

        return `<h${depth} id="${id}" data-heading-slug="${baseSlug}" class="heading-anchor-target">${text}</h${depth}>`;
      },

      code({ text, lang }: { text: string; lang?: string }) {
        const language = (lang || 'plaintext').trim().toLowerCase();

        // Handle Mermaid diagrams
        if (language === 'mermaid') {
          const encodedCode = encodeURIComponent(text);
          return `<div class="mermaid-wrapper my-4 flex justify-center overflow-x-auto" data-mermaid-code="${encodedCode}"><div class="mermaid-loading flex items-center justify-center p-6 text-xs text-gray-400">Loading diagram...</div></div>`;
        }

        const validLang = hljs.getLanguage(language) ? language : 'plaintext';
        const highlighted = hljs.highlight(text, { language: validLang }).value;
        const encodedCode = encodeURIComponent(text);

        return `
          <div class="code-block-wrapper">
            <div class="code-block-header">
              <span class="code-block-lang">${language.toUpperCase()}</span>
              <button class="code-block-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodedCode}')); this.innerText='Copied!'; setTimeout(() => this.innerText='Copy', 1500)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Copy
              </button>
            </div>
            <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
          </div>
        `;
      },

      image({ href, title, text }: { href: string; title: string | null; text: string }) {
        let finalHref = href;
        // Resolve relative images via local backend raw-file endpoint
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:')) {
          finalHref = `/api/raw-file?file=${encodeURIComponent(href)}&dir=${encodeURIComponent(baseDirPath)}`;
        }
        const titleAttr = title ? ` title="${title}"` : '';
        const altAttr = text ? ` alt="${text}"` : '';
        return `<figure class="image-wrapper"><img src="${finalHref}"${altAttr}${titleAttr} loading="lazy" />${text ? `<figcaption class="text-center text-xs text-muted mt-1">${text}</figcaption>` : ''}</figure>`;
      },

      listitem(item: any) {
        let body = this.parser.parse(item.tokens, !!item.loose);
        if (item.task) {
          const checked = item.checked ? 'checked disabled' : 'disabled';
          // unwrap wrapping <p> if present for clean inline task item
          body = body.replace(/^<p>([\s\S]*)<\/p>\s*$/, '$1');
          return `<li class="task-list-item"><input type="checkbox" ${checked} /> <span>${body}</span></li>\n`;
        }
        return `<li>${body}</li>\n`;
      },
    },
  });

  return {
    render(markdown: string): string {
      usedSlugs.clear();
      let html = marked.parse(markdown) as string;

      // Transform GitHub-style alerts:
      // > [!NOTE]
      // > Content
      html = html.replace(
        /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>|\n)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
        (_match, type, content) => {
          const alertType = type.toLowerCase();
          const title = alertType.charAt(0).toUpperCase() + alertType.slice(1);
          return `
            <div class="markdown-alert markdown-alert-${alertType}">
              <div class="markdown-alert-title">
                ${ALERT_ICONS[alertType] || ALERT_ICONS.note}
                <span>${title}</span>
              </div>
              <div class="markdown-alert-content">${content}</div>
            </div>
          `;
        }
      );

      return html;
    },
  };
}
