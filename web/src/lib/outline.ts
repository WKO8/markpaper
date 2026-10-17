import { OutlineItem } from '../types';
import { slugify } from './slug';

/**
 * Parses markdown lines to extract an interactive Table of Contents outline (H1-H6),
 * ignoring code blocks and generating unique slugs.
 */
export function extractOutline(markdown: string): OutlineItem[] {
  const headings: OutlineItem[] = [];
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;

  const usedSlugs = new Map<string, number>();

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim().replace(/[*_`~[\]]/g, '');
      let baseSlug = slugify(rawText);
      if (!baseSlug) baseSlug = `heading-${headings.length + 1}`;

      const count = usedSlugs.get(baseSlug) || 0;
      usedSlugs.set(baseSlug, count + 1);
      const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;

      headings.push({
        id,
        text: rawText,
        level,
      });
    }
  }

  return headings;
}
