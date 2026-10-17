/**
 * Generates an anchor slug from heading text, preserving Unicode letters, numbers,
 * and stripping HTML entities and tags.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, '') // strip HTML entities like &quot;, &amp;, &lt;, &gt;
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // preserve all unicode letters (accents, ç, etc.) and numbers
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
