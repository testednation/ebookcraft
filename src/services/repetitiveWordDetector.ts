/**
 * Repetitive and Overused Word Analysis Service
 * Identifies high-frequency crutch words, local echoes, and repetition heatmaps
 * across manuscript paragraphs.
 */

export interface WordRepetitionItem {
  word: string;
  totalCount: number;
  frequencyPercent: number; // e.g. 1.2%
  category: 'crutch' | 'adverb' | 'action-verb' | 'content';
  severity: 'high' | 'medium' | 'mild';
  synonyms: string[];
  craftTip?: string;
  paragraphCounts: number[]; // index matches paragraph index
  maxSingleParagraphCount: number;
  peakParagraphIndex: number;
}

export interface ParagraphMeta {
  index: number;
  wordCount: number;
  previewSnippet: string;
}

export interface RepetitiveWordReport {
  totalWords: number;
  uniqueWords: number;
  lexicalDiversityTTR: number; // Type-Token Ratio: unique / total (0.0 to 1.0)
  lexicalDiversityRating: 'Rich & Varied' | 'Balanced Prose' | 'Repetitive / Constrained';
  topOverusedWords: WordRepetitionItem[];
  allDetectedWords: WordRepetitionItem[];
  paragraphs: ParagraphMeta[];
  highestLocalEcho?: {
    word: string;
    paragraphIndex: number;
    count: number;
  };
  recommendations: string[];
}

// Common English Stop Words to exclude
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'so', 'if', 'then', 'that', 'this', 'these', 'those',
  'it', 'its', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'done', 'i', 'you', 'he', 'she', 'they', 'we', 'me', 'him', 'her', 'them',
  'us', 'my', 'your', 'his', 'their', 'our', 'what', 'which', 'who', 'whom', 'whose', 'when',
  'where', 'why', 'how', 'by', 'with', 'from', 'to', 'at', 'in', 'on', 'of', 'for', 'about',
  'as', 'into', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without',
  'before', 'under', 'around', 'among', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'than', 'such', 'not', 'no', 'nor', 'too', 'very', 's', 't', 'don',
  'didn', 'wasn', 'weren', 'couldn', 'wouldn', 'there', 'here', 'all', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'any', 'same', 'own',
]);

// Author crutch words and filter verbs with contextual synonyms
const CRUTCH_DICTIONARY: Record<
  string,
  { category: WordRepetitionItem['category']; synonyms: string[]; tip: string }
> = {
  suddenly: {
    category: 'crutch',
    synonyms: ['abruptly', 'in an instant', 'without warning', 'strike action directly'],
    tip: 'Pacing intensifies when you drop "suddenly" and state the abrupt event directly.',
  },
  seemed: {
    category: 'crutch',
    synonyms: ['appeared', 'gave the impression of', 'manifested as', 'state as fact'],
    tip: 'Filter verb: state what the character observes directly rather than hedging with "seemed".',
  },
  felt: {
    category: 'crutch',
    synonyms: ['sensed', 'experienced', 'shivered with', 'anchor in physical sensation'],
    tip: 'Filter verb: replace internal "she felt cold" with sensory action like "the draft raised goosebumps".',
  },
  just: {
    category: 'crutch',
    synonyms: ['merely', 'simply', 'scarcely', 'remove if filler'],
    tip: 'Often a diluting filler word; removing "just" almost always strengthens prose authority.',
  },
  really: {
    category: 'crutch',
    synonyms: ['truly', 'genuinely', 'undeniably', 'omit filler'],
    tip: 'Avoid using "really" as an amplifier; select a more evocative base adjective instead.',
  },
  almost: {
    category: 'crutch',
    synonyms: ['nearly', 'virtually', 'all but', 'verging on'],
    tip: 'Repeated "almost" creates an impression of indecisiveness in scene action.',
  },
  somehow: {
    category: 'crutch',
    synonyms: ['inexplicably', 'mysteriously', 'by some grace', 'describe the mechanism'],
    tip: 'Can read as authorial convenience; show the specific sensory cause whenever possible.',
  },
  started: {
    category: 'crutch',
    synonyms: ['began', 'commenced', 'initiated', 'state action directly'],
    tip: 'Unless interrupted, characters should do the action rather than "start to" do it.',
  },
  began: {
    category: 'crutch',
    synonyms: ['embarked on', 'commenced', 'state action directly'],
    tip: 'Replace "began to walk" with "walked" to make narrative velocity immediate.',
  },
  looked: {
    category: 'action-verb',
    synonyms: ['gazed', 'peered', 'glanced', 'surveyed', 'scanned', 'locked eyes'],
    tip: 'Diversify eye-movement verbs to reflect the emotional intensity of the gaze.',
  },
  turned: {
    category: 'action-verb',
    synonyms: ['pivoted', 'wheeled', 'swiveled', 'faced', 'twisted'],
    tip: 'Very common transitional filler in blocking; combine with emotional gesture.',
  },
  nodded: {
    category: 'action-verb',
    synonyms: ['affirmed', 'concurred', 'dipped head', 'acknowledged', 'bowed slightly'],
    tip: 'Dialogue tags frequently overuse nodding; try vocal agreement or physical stillness.',
  },
  sighed: {
    category: 'action-verb',
    synonyms: ['exhaled', 'breathed out', 'groaned softly', 'whispered wearily'],
    tip: 'Sighing can become a repetitive emotional crutch in character conversations.',
  },
  walked: {
    category: 'action-verb',
    synonyms: ['strided', 'paced', 'trudged', 'marched', 'wandered', 'drifted'],
    tip: 'Match the character’s gait to their internal mental state and footwear.',
  },
  smiled: {
    category: 'action-verb',
    synonyms: ['beamed', 'grinned', 'smirked', 'softened', 'parted lips'],
    tip: 'Specify the quality of the smile (wry, wistful, predatory, faint).',
  },
  whispered: {
    category: 'action-verb',
    synonyms: ['murmured', 'breathed', 'hushed', 'muttered', 'confided'],
    tip: 'Vary vocal volume and timbre during clandestine or intimate moments.',
  },
  quietly: {
    category: 'adverb',
    synonyms: ['softly', 'in a hush', 'under breath', 'faintly'],
    tip: 'Action verbs often carry quietness without needing the adverb tag.',
  },
  slowly: {
    category: 'adverb',
    synonyms: ['deliberately', 'unhurriedly', 'inch by inch', 'gradually'],
    tip: 'Pace the prose syntax itself (longer clauses) to convey slowness naturally.',
  },
  quickly: {
    category: 'adverb',
    synonyms: ['briskly', 'swiftly', 'hastily', 'in an instant'],
    tip: 'Use short, punchy sentence fragments to mimic high speed instead of using "quickly".',
  },
};

/**
 * Clean HTML and extract paragraph strings
 */
function extractParagraphs(content: string): string[] {
  if (!content) return [];
  const text = content
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);
}

/**
 * Tokenize a paragraph into lowercase cleaned words
 */
function tokenizeWords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
    .filter((w) => w.length > 2);
}

/**
 * Analyzes manuscript content for word repetition and paragraph-level heatmap density
 */
export function analyzeRepetitiveWords(content: string): RepetitiveWordReport {
  const paragraphs = extractParagraphs(content);

  // Fallback for minimal or blank content
  if (paragraphs.length === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      lexicalDiversityTTR: 1.0,
      lexicalDiversityRating: 'Balanced Prose',
      topOverusedWords: [],
      allDetectedWords: [],
      paragraphs: [],
      recommendations: ['Begin writing prose to inspect vocabulary repetition and heatmap density.'],
    };
  }

  // Tokenize each paragraph
  const paragraphWordLists = paragraphs.map((p) => tokenizeWords(p));
  const paragraphMetaList: ParagraphMeta[] = paragraphs.map((p, idx) => ({
    index: idx + 1,
    wordCount: paragraphWordLists[idx].length,
    previewSnippet: p.slice(0, 85) + (p.length > 85 ? '…' : ''),
  }));

  const allWords = paragraphWordLists.flat();
  const totalWords = allWords.length;

  if (totalWords === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      lexicalDiversityTTR: 1.0,
      lexicalDiversityRating: 'Balanced Prose',
      topOverusedWords: [],
      allDetectedWords: [],
      paragraphs: paragraphMetaList,
      recommendations: ['Type or paste manuscript prose to analyze word repetition.'],
    };
  }

  // Count word frequencies per paragraph and globally
  const wordGlobalCounts = new Map<string, number>();
  const wordParagraphMaps = new Map<string, number[]>();

  allWords.forEach((word) => {
    wordGlobalCounts.set(word, (wordGlobalCounts.get(word) || 0) + 1);
  });

  const uniqueWords = wordGlobalCounts.size;
  const ttr = Math.round((uniqueWords / Math.max(1, totalWords)) * 100) / 100;

  let lexicalDiversityRating: RepetitiveWordReport['lexicalDiversityRating'] = 'Balanced Prose';
  if (ttr >= 0.55) {
    lexicalDiversityRating = 'Rich & Varied';
  } else if (ttr <= 0.35) {
    lexicalDiversityRating = 'Repetitive / Constrained';
  }

  // Populate per-paragraph distribution
  paragraphWordLists.forEach((pWords, pIdx) => {
    pWords.forEach((word) => {
      if (!wordParagraphMaps.has(word)) {
        wordParagraphMaps.set(word, new Array(paragraphs.length).fill(0));
      }
      wordParagraphMaps.get(word)![pIdx]++;
    });
  });

  // Filter candidate repetitive words
  const candidateList: WordRepetitionItem[] = [];

  wordGlobalCounts.forEach((count, word) => {
    const isStopWord = STOP_WORDS.has(word);
    const crutchEntry = CRUTCH_DICTIONARY[word];
    const isAdverb = word.endsWith('ly') && word.length > 4;

    // We include stop words ONLY if they are explicitly in our crutch dictionary (e.g. "very")
    if (isStopWord && !crutchEntry) {
      return;
    }

    const paragraphCounts = wordParagraphMaps.get(word) || new Array(paragraphs.length).fill(0);
    const maxInSingleParagraph = Math.max(...paragraphCounts, 0);
    const peakIndex = paragraphCounts.indexOf(maxInSingleParagraph);
    const freqPercent = Math.round((count / totalWords) * 1000) / 10;

    // Qualifications for repetition:
    // 1. In crutch dictionary and count >= 2
    // 2. Or -ly adverb and count >= 2
    // 3. Or content word with count >= 3 (or count >= 2 if totalWords < 200)
    // 4. Or local echo (appears >= 2 times in a single paragraph)
    const qualifies =
      (crutchEntry && count >= 2) ||
      (isAdverb && count >= 2) ||
      (count >= 3 && !isStopWord) ||
      (maxInSingleParagraph >= 2 && !isStopWord);

    if (qualifies) {
      let category: WordRepetitionItem['category'] = 'content';
      let synonyms: string[] = [];
      let craftTip: string | undefined = undefined;

      if (crutchEntry) {
        category = crutchEntry.category;
        synonyms = crutchEntry.synonyms;
        craftTip = crutchEntry.tip;
      } else if (isAdverb) {
        category = 'adverb';
        synonyms = ['consider replacing adverb with a more precise verb'];
        craftTip = 'Adverbs ending in -ly often dilute strong verbs; check if the action stands on its own.';
      } else {
        category = 'content';
        synonyms = [];
      }

      // Severity classification
      let severity: WordRepetitionItem['severity'] = 'mild';
      if (
        (crutchEntry && count >= 4) ||
        count >= 6 ||
        maxInSingleParagraph >= 3 ||
        freqPercent >= 1.5
      ) {
        severity = 'high';
      } else if (
        (crutchEntry && count >= 3) ||
        count >= 4 ||
        maxInSingleParagraph >= 2 ||
        freqPercent >= 0.8
      ) {
        severity = 'medium';
      }

      candidateList.push({
        word,
        totalCount: count,
        frequencyPercent: freqPercent,
        category,
        severity,
        synonyms,
        craftTip,
        paragraphCounts,
        maxSingleParagraphCount: maxInSingleParagraph,
        peakParagraphIndex: peakIndex,
      });
    }
  });

  // Sort by severity (high first), then total count descending
  const severityOrder = { high: 0, medium: 1, mild: 2 };
  candidateList.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.totalCount - a.totalCount;
  });

  // Highest local echo (cluster in a single paragraph)
  let highestEcho: { word: string; paragraphIndex: number; count: number } | undefined = undefined;
  for (const item of candidateList) {
    if (item.maxSingleParagraphCount >= 2) {
      if (!highestEcho || item.maxSingleParagraphCount > highestEcho.count) {
        highestEcho = {
          word: item.word,
          paragraphIndex: item.peakParagraphIndex + 1,
          count: item.maxSingleParagraphCount,
        };
      }
    }
  }

  // Actionable recommendations
  const recommendations: string[] = [];
  const highSeverityItems = candidateList.filter((c) => c.severity === 'high');
  const crutchItems = candidateList.filter((c) => c.category === 'crutch');
  const adverbItems = candidateList.filter((c) => c.category === 'adverb');

  if (highestEcho && highestEcho.count >= 3) {
    recommendations.push(
      `Local Echo Alert: "${highestEcho.word}" appears ${highestEcho.count} times within Paragraph ${highestEcho.paragraphIndex}. Rephrase to avoid close auditory repetition.`
    );
  }

  if (crutchItems.length > 0) {
    const topCrutch = crutchItems[0];
    recommendations.push(
      `Filter Word Warning: "${topCrutch.word}" occurs ${topCrutch.totalCount} times. Try substituting with: ${topCrutch.synonyms.slice(0, 3).join(', ')}.`
    );
  }

  if (adverbItems.length >= 3) {
    recommendations.push(
      `Multiple -ly adverbs repeated across scenes (${adverbItems.slice(0, 3).map((a) => `"${a.word}"`).join(', ')}). Strengthen prose by swapping with vivid sensory verbs.`
    );
  }

  if (ttr < 0.38) {
    recommendations.push(
      `Lexical Diversity (Type-Token Ratio) is low (${(ttr * 100).toFixed(0)}%). Expanding word choices across descriptive passages will elevate literary texture.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Vocabulary is well-balanced with minimal repetitive echoes or crutch word clustering.'
    );
  }

  return {
    totalWords,
    uniqueWords,
    lexicalDiversityTTR: ttr,
    lexicalDiversityRating,
    topOverusedWords: candidateList.slice(0, 15),
    allDetectedWords: candidateList,
    paragraphs: paragraphMetaList,
    highestLocalEcho: highestEcho,
    recommendations,
  };
}
