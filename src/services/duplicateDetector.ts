import { Chapter } from '../types/book';

export interface DuplicateOccurrence {
  chapterId?: string;
  chapterTitle: string;
  paragraphIndex: number;
  preview: string;
  rawHtml: string;
}

export interface DuplicateParagraphItem {
  id: string;
  text: string;
  normalizedKey: string;
  wordCount: number;
  occurrences: DuplicateOccurrence[];
  duplicateCount: number;
  isCrossChapter: boolean;
}

export interface DuplicateReport {
  totalDuplicates: number;
  totalRedundantParagraphs: number;
  totalRedundantWords: number;
  items: DuplicateParagraphItem[];
}

/**
 * Strips HTML tags and decodes basic entities.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text for robust duplicate comparison:
 * lowercase, stripped punctuation, normalized whitespace.
 */
export function normalizeParagraph(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[—–-]/g, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines whether a paragraph is too short or is a standard scene break fleuron
 * to be considered a redundant duplicate.
 */
export function isTrivialParagraph(rawText: string): boolean {
  const clean = stripHtml(rawText);
  if (!clean || clean.length < 20) return true;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 5) return true;

  // Scene breaks and decorative dividers
  if (/^(\*|\* \* \*|\*\*\*|❦|❖|✦|#|---|~~\~|•\s*•\s*•|\. \. \.)$/.test(clean.trim())) {
    return true;
  }
  if (/^(chapter|part|act|prologue|epilogue|scene)\s*\d*$/i.test(clean.trim())) {
    return true;
  }

  return false;
}

/**
 * Splits HTML content into individual paragraph blocks (<p>...</p> or newline separated).
 */
export function splitIntoParagraphBlocks(content: string): string[] {
  if (!content) return [];

  // If HTML with <p> tags
  if (/<p[\s>]/i.test(content)) {
    const matches = content.match(/<p[\s\S]*?<\/p>/gi);
    if (matches && matches.length > 0) {
      return matches;
    }
  }

  // Fallback to splitting by double newlines or single newlines
  return content
    .split(/\r?\n\r?\n|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${s}</p>`);
}

/**
 * Detects duplicate paragraphs within a single chapter's content.
 */
export function detectDuplicatesInContent(
  content: string,
  chapterTitle: string = 'Current Chapter',
  chapterId?: string
): DuplicateParagraphItem[] {
  const blocks = splitIntoParagraphBlocks(content);
  const map = new Map<
    string,
    {
      originalText: string;
      wordCount: number;
      occurrences: DuplicateOccurrence[];
    }
  >();

  blocks.forEach((block, index) => {
    if (isTrivialParagraph(block)) return;

    const normalized = normalizeParagraph(block);
    if (normalized.length < 15) return;

    const plainText = stripHtml(block);
    const words = plainText.split(/\s+/).filter(Boolean).length;

    const existing = map.get(normalized);
    const occ: DuplicateOccurrence = {
      chapterId,
      chapterTitle,
      paragraphIndex: index,
      preview: plainText.length > 120 ? plainText.slice(0, 117) + '...' : plainText,
      rawHtml: block,
    };

    if (existing) {
      existing.occurrences.push(occ);
    } else {
      map.set(normalized, {
        originalText: plainText,
        wordCount: words,
        occurrences: [occ],
      });
    }
  });

  const duplicates: DuplicateParagraphItem[] = [];
  let idCounter = 1;

  for (const [key, val] of map.entries()) {
    if (val.occurrences.length > 1) {
      duplicates.push({
        id: `dup_${idCounter++}`,
        text: val.originalText,
        normalizedKey: key,
        wordCount: val.wordCount,
        occurrences: val.occurrences,
        duplicateCount: val.occurrences.length,
        isCrossChapter: false,
      });
    }
  }

  return duplicates.sort((a, b) => b.wordCount * b.duplicateCount - a.wordCount * a.duplicateCount);
}

/**
 * Scans an entire manuscript across all chapters for duplicate paragraphs
 * (both intra-chapter and cross-chapter copies).
 */
export function detectDuplicatesAcrossChapters(chapters: Chapter[]): DuplicateReport {
  const map = new Map<
    string,
    {
      originalText: string;
      wordCount: number;
      occurrences: DuplicateOccurrence[];
    }
  >();

  chapters.forEach((ch) => {
    const blocks = splitIntoParagraphBlocks(ch.content || '');
    blocks.forEach((block, pIndex) => {
      if (isTrivialParagraph(block)) return;

      const normalized = normalizeParagraph(block);
      if (normalized.length < 15) return;

      const plainText = stripHtml(block);
      const words = plainText.split(/\s+/).filter(Boolean).length;

      const occ: DuplicateOccurrence = {
        chapterId: ch.id,
        chapterTitle: ch.title || `Chapter ${ch.order + 1}`,
        paragraphIndex: pIndex,
        preview: plainText.length > 120 ? plainText.slice(0, 117) + '...' : plainText,
        rawHtml: block,
      };

      const existing = map.get(normalized);
      if (existing) {
        existing.occurrences.push(occ);
      } else {
        map.set(normalized, {
          originalText: plainText,
          wordCount: words,
          occurrences: [occ],
        });
      }
    });
  });

  const items: DuplicateParagraphItem[] = [];
  let totalRedundantParagraphs = 0;
  let totalRedundantWords = 0;
  let idCounter = 1;

  for (const [key, val] of map.entries()) {
    if (val.occurrences.length > 1) {
      const distinctChapters = new Set(val.occurrences.map((o) => o.chapterId)).size;
      const redundantCount = val.occurrences.length - 1;

      totalRedundantParagraphs += redundantCount;
      totalRedundantWords += redundantCount * val.wordCount;

      items.push({
        id: `dup_global_${idCounter++}`,
        text: val.originalText,
        normalizedKey: key,
        wordCount: val.wordCount,
        occurrences: val.occurrences,
        duplicateCount: val.occurrences.length,
        isCrossChapter: distinctChapters > 1,
      });
    }
  }

  items.sort((a, b) => b.wordCount * b.duplicateCount - a.wordCount * a.duplicateCount);

  return {
    totalDuplicates: items.length,
    totalRedundantParagraphs,
    totalRedundantWords,
    items,
  };
}

/**
 * Removes a specific duplicate occurrence by paragraphIndex from the chapter's HTML content.
 */
export function removeParagraphByIndex(content: string, targetIndex: number): string {
  const blocks = splitIntoParagraphBlocks(content);
  if (targetIndex < 0 || targetIndex >= blocks.length) return content;

  blocks.splice(targetIndex, 1);
  return blocks.join('\n');
}

/**
 * Removes all duplicate repeat occurrences of paragraphs, keeping only the first instance of each.
 */
export function autoDeduplicateContent(content: string): { newContent: string; removedCount: number } {
  const blocks = splitIntoParagraphBlocks(content);
  const seen = new Set<string>();
  const filtered: string[] = [];
  let removedCount = 0;

  for (const block of blocks) {
    if (isTrivialParagraph(block)) {
      filtered.push(block);
      continue;
    }

    const norm = normalizeParagraph(block);
    if (seen.has(norm)) {
      removedCount++;
      // Skip redundant duplicate
    } else {
      seen.add(norm);
      filtered.push(block);
    }
  }

  return {
    newContent: filtered.join('\n'),
    removedCount,
  };
}
