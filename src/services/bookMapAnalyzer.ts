import { Chapter, SectionType, SectionGroup } from '../types/book';

export interface ChapterPacingNode {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  type: SectionType;
  group: SectionGroup;
  wordCount: number;
  readingTimeMinutes: number;
  percentageOfBook: number; // 0 to 100
  cumulativeWordOffset: number; // words before this chapter
  cumulativePercentage: number; // 0 to 100 start position in book
  partNumber?: number;
  partGroupTitle?: string;
  isPartDivider: boolean;
  isCurrent: boolean;
  targetWordCount?: number;
  pacingCategory: 'standard' | 'expansive' | 'brisk' | 'interlude' | 'part-marker';
  pacingDeviationPercent: number; // relative to mean body chapter length (-100% to +X%)
}

export interface BookMapReport {
  totalWords: number;
  totalChapters: number;
  bodyChapterCount: number;
  totalReadingTimeMinutes: number;
  meanBodyWordCount: number;
  wordCountStdDev: number;
  pacingConsistencyScore: number; // 0 to 100 (100 = rhythmic and steady)
  pacingConsistencyRating: 'Very Consistent' | 'Balanced Cadence' | 'High Dynamic Variance' | 'Irregular / Spike Pacing';
  longestChapter?: {
    id: string;
    title: string;
    wordCount: number;
    ratioToMean: number;
  };
  shortestChapter?: {
    id: string;
    title: string;
    wordCount: number;
    ratioToMean: number;
  };
  nodes: ChapterPacingNode[];
  partSummaries: {
    partNumber: number;
    title: string;
    chapterCount: number;
    totalWords: number;
    percentageOfBook: number;
  }[];
  pacingRecommendations: string[];
}

function countWords(str: string): number {
  if (!str) return 0;
  return str.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

export function analyzeBookMap(
  chapters: Chapter[],
  currentChapterId?: string
): BookMapReport {
  if (!chapters || chapters.length === 0) {
    return {
      totalWords: 0,
      totalChapters: 0,
      bodyChapterCount: 0,
      totalReadingTimeMinutes: 0,
      meanBodyWordCount: 0,
      wordCountStdDev: 0,
      pacingConsistencyScore: 100,
      pacingConsistencyRating: 'Balanced Cadence',
      nodes: [],
      partSummaries: [],
      pacingRecommendations: ['Add chapters to your manuscript to visualize book structure and chapter pacing.'],
    };
  }

  // Sort chapters by order
  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  // Compute word counts for each chapter accurately
  const chapterWords = sorted.map((ch) => ch.wordCount ?? countWords(ch.content || ''));
  const totalWords = Math.max(1, chapterWords.reduce((sum, w) => sum + w, 0));

  // Isolate body chapters (exclude parts and front/back matter for calculating prose pacing norms)
  const bodyWords = sorted
    .filter((ch) => ch.group === 'body' && ch.type !== 'part')
    .map((ch) => ch.wordCount ?? countWords(ch.content || ''));

  const meanBodyWordCount =
    bodyWords.length > 0
      ? Math.round(bodyWords.reduce((sum, w) => sum + w, 0) / bodyWords.length)
      : 2500;

  // Calculate standard deviation of body chapter lengths
  const varianceSum = bodyWords.reduce(
    (sum, w) => sum + Math.pow(w - meanBodyWordCount, 2),
    0
  );
  const wordCountStdDev =
    bodyWords.length > 1 ? Math.round(Math.sqrt(varianceSum / bodyWords.length)) : 0;

  // Consistency score: higher when std dev is reasonable fraction of mean
  const cv = meanBodyWordCount > 0 ? wordCountStdDev / meanBodyWordCount : 0;
  const pacingConsistencyScore = Math.round(Math.max(10, Math.min(100, 100 - cv * 60)));

  let pacingConsistencyRating: BookMapReport['pacingConsistencyRating'] = 'Balanced Cadence';
  if (cv < 0.25) pacingConsistencyRating = 'Very Consistent';
  else if (cv < 0.5) pacingConsistencyRating = 'Balanced Cadence';
  else if (cv < 0.85) pacingConsistencyRating = 'High Dynamic Variance';
  else pacingConsistencyRating = 'Irregular / Spike Pacing';

  // Build nodes with cumulative word offsets and pacing categories
  let runningWords = 0;
  let currentPartNumber = 1;
  let currentPartTitle = 'Part I';

  const nodes: ChapterPacingNode[] = sorted.map((ch, idx) => {
    const words = chapterWords[idx];
    const isPart = ch.type === 'part';

    if (isPart) {
      currentPartNumber = ch.partNumber || currentPartNumber;
      currentPartTitle = ch.title || `Part ${currentPartNumber}`;
    }

    const readingTime = Math.max(1, Math.round(words / 200));
    const percentage = Math.round((words / totalWords) * 1000) / 10;
    const cumulativeOffset = runningWords;
    const cumulativePct = Math.round((cumulativeOffset / totalWords) * 1000) / 10;
    runningWords += words;

    // Deviation from mean body length
    const deviation =
      meanBodyWordCount > 0
        ? Math.round(((words - meanBodyWordCount) / meanBodyWordCount) * 100)
        : 0;

    let pacingCategory: ChapterPacingNode['pacingCategory'] = 'standard';
    if (isPart) {
      pacingCategory = 'part-marker';
    } else if (words < 400) {
      pacingCategory = 'interlude';
    } else if (deviation > 35) {
      pacingCategory = 'expansive';
    } else if (deviation < -35) {
      pacingCategory = 'brisk';
    }

    return {
      id: ch.id,
      order: ch.order,
      title: ch.title || `Chapter ${ch.order}`,
      subtitle: ch.subtitle,
      type: ch.type,
      group: ch.group,
      wordCount: words,
      readingTimeMinutes: readingTime,
      percentageOfBook: percentage,
      cumulativeWordOffset: cumulativeOffset,
      cumulativePercentage: cumulativePct,
      partNumber: currentPartNumber,
      partGroupTitle: currentPartTitle,
      isPartDivider: isPart,
      isCurrent: ch.id === currentChapterId,
      targetWordCount: ch.targetWordCount,
      pacingCategory,
      pacingDeviationPercent: deviation,
    };
  });

  // Calculate Part summaries
  const partMap = new Map<number, { title: string; count: number; words: number }>();
  let activePart = 1;
  nodes.forEach((n) => {
    if (n.isPartDivider) {
      activePart = n.partNumber || activePart;
      if (!partMap.has(activePart)) {
        partMap.set(activePart, { title: n.title, count: 0, words: 0 });
      }
    } else {
      if (!partMap.has(activePart)) {
        partMap.set(activePart, { title: `Part ${activePart}`, count: 0, words: 0 });
      }
      const p = partMap.get(activePart)!;
      p.count++;
      p.words += n.wordCount;
    }
  });

  const partSummaries = Array.from(partMap.entries()).map(([partNumber, data]) => ({
    partNumber,
    title: data.title,
    chapterCount: data.count,
    totalWords: data.words,
    percentageOfBook: Math.round((data.words / totalWords) * 100),
  }));

  // Identify longest & shortest body chapters
  const bodyNodes = nodes.filter((n) => n.group === 'body' && !n.isPartDivider);
  let longest: BookMapReport['longestChapter'] = undefined;
  let shortest: BookMapReport['shortestChapter'] = undefined;

  if (bodyNodes.length > 0) {
    const sortedByLen = [...bodyNodes].sort((a, b) => b.wordCount - a.wordCount);
    const max = sortedByLen[0];
    const min = sortedByLen[sortedByLen.length - 1];

    longest = {
      id: max.id,
      title: max.title,
      wordCount: max.wordCount,
      ratioToMean: Math.round((max.wordCount / (meanBodyWordCount || 1)) * 10) / 10,
    };

    shortest = {
      id: min.id,
      title: min.title,
      wordCount: min.wordCount,
      ratioToMean: Math.round((min.wordCount / (meanBodyWordCount || 1)) * 10) / 10,
    };
  }

  // Pacing recommendations
  const recommendations: string[] = [];

  // Check for consecutive extreme pacing discrepancies
  for (let i = 0; i < bodyNodes.length - 1; i++) {
    const curr = bodyNodes[i];
    const next = bodyNodes[i + 1];
    if (curr.wordCount > 0 && next.wordCount > 0) {
      const ratio = Math.max(curr.wordCount / next.wordCount, next.wordCount / curr.wordCount);
      if (ratio >= 3.0 && Math.abs(curr.wordCount - next.wordCount) > 2500) {
        recommendations.push(
          `Pacing Shift Alert: "${curr.title}" (${curr.wordCount.toLocaleString()} words) is ${ratio.toFixed(1)}x different from "${next.title}" (${next.wordCount.toLocaleString()} words). Consider smoothing transitions or inserting a scene interlude.`
        );
        break; // one alert is sufficient
      }
    }
  }

  if (longest && longest.ratioToMean >= 2.0 && longest.wordCount > 5000) {
    recommendations.push(
      `"${longest.title}" is ${longest.wordCount.toLocaleString()} words (${longest.ratioToMean}x book average). Consider breaking this into two distinct narrative chapters or acts.`
    );
  }

  if (partSummaries.length > 1) {
    const partWords = partSummaries.map((p) => p.totalWords).filter((w) => w > 0);
    if (partWords.length >= 2) {
      const maxPart = Math.max(...partWords);
      const minPart = Math.min(...partWords);
      if (maxPart / (minPart || 1) >= 2.8 && minPart > 0) {
        recommendations.push(
          `Multi-Part Balance: One volume part is significantly heavier than another. Review whether narrative arcs across parts have equitable dramatic weight.`
        );
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Chapter lengths and narrative pacing exhibit healthy proportion and steady structural flow across the book.'
    );
  }

  return {
    totalWords,
    totalChapters: chapters.length,
    bodyChapterCount: bodyNodes.length,
    totalReadingTimeMinutes: Math.round(totalWords / 200),
    meanBodyWordCount,
    wordCountStdDev,
    pacingConsistencyScore,
    pacingConsistencyRating,
    longestChapter: longest,
    shortestChapter: shortest,
    nodes,
    partSummaries,
    pacingRecommendations: recommendations,
  };
}
