export interface DocumentStats {
  words: number;
  chars: number;
  readingTimeMinutes: number;
}

/**
 * Computes word count, character count, and estimated reading time
 * from a raw markdown string by stripping code blocks and formatting noise.
 */
export function computeDocumentStats(markdown: string): DocumentStats {
  const cleanText = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>|-]/g, ' ')
    .trim();

  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
  const chars = cleanText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    chars,
    readingTimeMinutes,
  };
}
