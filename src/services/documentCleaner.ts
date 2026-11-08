import { Chapter } from '../types/book';

export interface CleanerOptions {
  smartQuotes: boolean; // Straight quotes "" and '' -> Curly “ ” and ‘ ’
  emDashes: boolean; // Double hyphens -- or --- -> Em-dash —
  ellipsis: boolean; // Three dots ... -> Ellipsis …
  multipleSpaces: boolean; // Multiple spaces -> Single space
  spaceBeforePunctuation: boolean; // "word ," -> "word,"
  emptyParagraphs: boolean; // Remove empty <p></p> or <p>&nbsp;</p>
  trailingSpaces: boolean; // Trim trailing whitespace
  stripHtmlArtifacts: boolean; // Remove zero-width spaces \u200B, \uFEFF, residual Word spans
}

export const DEFAULT_CLEANER_OPTIONS: CleanerOptions = {
  smartQuotes: true,
  emDashes: true,
  ellipsis: true,
  multipleSpaces: true,
  spaceBeforePunctuation: true,
  emptyParagraphs: true,
  trailingSpaces: true,
  stripHtmlArtifacts: true,
};

export interface CleanerStats {
  quotesFixed: number;
  emDashesFixed: number;
  ellipsisFixed: number;
  spacesFixed: number;
  punctuationFixed: number;
  emptyParagraphsRemoved: number;
  artifactsCleaned: number;
  totalIssues: number;
}

/**
 * Scans an HTML or text string for potential formatting and typesetting issues.
 */
export function scanTextForCleaningIssues(content: string): CleanerStats {
  if (!content) {
    return {
      quotesFixed: 0,
      emDashesFixed: 0,
      ellipsisFixed: 0,
      spacesFixed: 0,
      punctuationFixed: 0,
      emptyParagraphsRemoved: 0,
      artifactsCleaned: 0,
      totalIssues: 0,
    };
  }

  // Count straight quotes outside HTML tags
  const textWithoutTags = content.replace(/<[^>]+>/g, ' ');

  const straightDoubleQuotes = (textWithoutTags.match(/"/g) || []).length;
  const straightSingleQuotes = (textWithoutTags.match(/'/g) || []).length;
  const quotesFixed = straightDoubleQuotes + straightSingleQuotes;

  const emDashesFixed = (textWithoutTags.match(/---|--/g) || []).length;
  const ellipsisFixed = (textWithoutTags.match(/\.{3,}|\. \. \./g) || []).length;
  const spacesFixed = (textWithoutTags.match(/[ \t]{2,}/g) || []).length;
  const punctuationFixed = (textWithoutTags.match(/\s+[,.:;?!]/g) || []).length;

  const emptyParagraphsRemoved = (
    content.match(/<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi) || []
  ).length;

  const artifactsCleaned = (content.match(/[\u200B\u200C\u200D\uFEFF]/g) || []).length;

  const totalIssues =
    quotesFixed +
    emDashesFixed +
    ellipsisFixed +
    spacesFixed +
    punctuationFixed +
    emptyParagraphsRemoved +
    artifactsCleaned;

  return {
    quotesFixed,
    emDashesFixed,
    ellipsisFixed,
    spacesFixed,
    punctuationFixed,
    emptyParagraphsRemoved,
    artifactsCleaned,
    totalIssues,
  };
}

/**
 * Cleans straight quotes into typographical curly quotes inside text nodes only.
 */
function applySmartQuotes(text: string): { result: string; count: number } {
  let count = 0;
  let res = text;

  // Double quotes:
  // Opening: after start of line, whitespace, or open bracket
  const doubleOpenRegex = /(^|[\s(\[{<])"/g;
  res = res.replace(doubleOpenRegex, (match, p1) => {
    count++;
    return `${p1}“`;
  });
  // Remaining double quotes become closing
  res = res.replace(/"/g, () => {
    count++;
    return '”';
  });

  // Single quotes & Apostrophes:
  // Contractions & possessives (word's, don't, can't) -> ’
  res = res.replace(/(\b|[a-zA-Z0-9])'([a-zA-Z0-9])/g, (match, p1, p2) => {
    count++;
    return `${p1}’${p2}`;
  });

  // Common decennial/abbreviation apostrophes: '80s, 'cause, 'til
  res = res.replace(/(^|[\s])'(?=(?:\d{2}s?|cause|tis|twas|til|em)\b)/gi, (match, p1) => {
    count++;
    return `${p1}’`;
  });

  // Opening single quotes: after start of line or space
  res = res.replace(/(^|[\s(\[{<])'/g, (match, p1) => {
    count++;
    return `${p1}‘`;
  });

  // Closing single quotes
  res = res.replace(/'/g, () => {
    count++;
    return '’';
  });

  return { result: res, count };
}

/**
 * Cleans content text or HTML according to the selected options.
 * Accurately processes text nodes while preserving HTML tags and attributes!
 */
export function cleanDocumentContent(
  htmlOrText: string,
  options: CleanerOptions = DEFAULT_CLEANER_OPTIONS
): { cleaned: string; stats: CleanerStats } {
  if (!htmlOrText) {
    return {
      cleaned: '',
      stats: {
        quotesFixed: 0,
        emDashesFixed: 0,
        ellipsisFixed: 0,
        spacesFixed: 0,
        punctuationFixed: 0,
        emptyParagraphsRemoved: 0,
        artifactsCleaned: 0,
        totalIssues: 0,
      },
    };
  }

  let content = htmlOrText;
  let emptyParagraphsRemoved = 0;
  let artifactsCleaned = 0;
  let quotesFixed = 0;
  let emDashesFixed = 0;
  let ellipsisFixed = 0;
  let spacesFixed = 0;
  let punctuationFixed = 0;

  // 1. Remove empty paragraphs if HTML
  if (options.emptyParagraphs) {
    const emptyMatch = content.match(/<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi);
    if (emptyMatch) {
      emptyParagraphsRemoved = emptyMatch.length;
      content = content.replace(/<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
    }
  }

  // 2. Strip zero-width & non-breaking artifacts
  if (options.stripHtmlArtifacts) {
    const artMatches = content.match(/[\u200B\u200C\u200D\uFEFF]/g);
    if (artMatches) {
      artifactsCleaned += artMatches.length;
      content = content.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
    }
    // Clean repetitive &nbsp; runs
    content = content.replace(/(&nbsp;){2,}/g, ' ');
  }

  // 3. Process text runs between HTML tags (or the entire text if plain)
  // Split by HTML tags so we NEVER mutate attributes like class="..." or href="..."
  const tokens = content.split(/(<[^>]+>)/g);

  for (let i = 0; i < tokens.length; i++) {
    // If it's an HTML tag, skip
    if (tokens[i].startsWith('<') && tokens[i].endsWith('>')) {
      continue;
    }

    let text = tokens[i];
    if (!text) continue;

    // A. Smart Quotes
    if (options.smartQuotes) {
      const qRes = applySmartQuotes(text);
      text = qRes.result;
      quotesFixed += qRes.count;
    }

    // B. Em-dashes
    if (options.emDashes) {
      const dashMatches = text.match(/---|--/g);
      if (dashMatches) {
        emDashesFixed += dashMatches.length;
        text = text.replace(/---|--/g, '—');
      }
      // Spaced hyphens: "word - word" -> "word — word"
      text = text.replace(/(\w)\s+-\s+(\w)/g, '$1 — $2');
    }

    // C. Ellipsis
    if (options.ellipsis) {
      const ellMatches = text.match(/\.{3,}|\. \. \./g);
      if (ellMatches) {
        ellipsisFixed += ellMatches.length;
        text = text.replace(/\.{3,}|\. \. \./g, '…');
      }
    }

    // D. Multiple spaces
    if (options.multipleSpaces) {
      const spMatches = text.match(/[ \t]{2,}/g);
      if (spMatches) {
        spacesFixed += spMatches.length;
        text = text.replace(/[ \t]{2,}/g, ' ');
      }
    }

    // E. Space before punctuation
    if (options.spaceBeforePunctuation) {
      const punctMatches = text.match(/\s+([,.:;?!])/g);
      if (punctMatches) {
        punctuationFixed += punctMatches.length;
        text = text.replace(/\s+([,.:;?!])/g, '$1');
      }
    }

    // F. Trailing spaces
    if (options.trailingSpaces) {
      text = text.replace(/[ \t]+(?=\r?\n|$)/g, '');
    }

    tokens[i] = text;
  }

  const cleaned = tokens.join('');
  const totalIssues =
    quotesFixed +
    emDashesFixed +
    ellipsisFixed +
    spacesFixed +
    punctuationFixed +
    emptyParagraphsRemoved +
    artifactsCleaned;

  return {
    cleaned,
    stats: {
      quotesFixed,
      emDashesFixed,
      ellipsisFixed,
      spacesFixed,
      punctuationFixed,
      emptyParagraphsRemoved,
      artifactsCleaned,
      totalIssues,
    },
  };
}

/**
 * Cleans a single Chapter.
 */
export function cleanChapter(
  chapter: Chapter,
  options: CleanerOptions = DEFAULT_CLEANER_OPTIONS
): { updatedChapter: Chapter; stats: CleanerStats } {
  const { cleaned: cleanedContent, stats: contentStats } = cleanDocumentContent(
    chapter.content || '',
    options
  );

  let cleanedTitle = chapter.title;
  let cleanedSubtitle = chapter.subtitle;

  if (options.smartQuotes || options.emDashes) {
    if (cleanedTitle) {
      cleanedTitle = cleanDocumentContent(cleanedTitle, options).cleaned;
    }
    if (cleanedSubtitle) {
      cleanedSubtitle = cleanDocumentContent(cleanedSubtitle, options).cleaned;
    }
  }

  const wordCount = cleanedContent
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    updatedChapter: {
      ...chapter,
      title: cleanedTitle,
      subtitle: cleanedSubtitle,
      content: cleanedContent,
      wordCount,
    },
    stats: contentStats,
  };
}

/**
 * Cleans all Chapters across an entire manuscript.
 */
export function cleanAllChapters(
  chapters: Chapter[],
  options: CleanerOptions = DEFAULT_CLEANER_OPTIONS
): { updatedChapters: Chapter[]; totalStats: CleanerStats } {
  const totalStats: CleanerStats = {
    quotesFixed: 0,
    emDashesFixed: 0,
    ellipsisFixed: 0,
    spacesFixed: 0,
    punctuationFixed: 0,
    emptyParagraphsRemoved: 0,
    artifactsCleaned: 0,
    totalIssues: 0,
  };

  const updatedChapters = chapters.map((ch) => {
    const { updatedChapter, stats } = cleanChapter(ch, options);
    totalStats.quotesFixed += stats.quotesFixed;
    totalStats.emDashesFixed += stats.emDashesFixed;
    totalStats.ellipsisFixed += stats.ellipsisFixed;
    totalStats.spacesFixed += stats.spacesFixed;
    totalStats.punctuationFixed += stats.punctuationFixed;
    totalStats.emptyParagraphsRemoved += stats.emptyParagraphsRemoved;
    totalStats.artifactsCleaned += stats.artifactsCleaned;
    totalStats.totalIssues += stats.totalIssues;
    return updatedChapter;
  });

  return {
    updatedChapters,
    totalStats,
  };
}
