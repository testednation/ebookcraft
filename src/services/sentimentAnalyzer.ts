/**
 * Literary Writing Sentiment & Narrative Pacing Analyzer
 * Analyzes literary tone, emotional valence, narrative pacing, and emotional variance
 * across fiction and non-fiction prose.
 */

export interface ParagraphSlice {
  index: number;
  snippet: string;
  wordCount: number;
  sentimentScore: number; // -1.0 (dark/tense) to +1.0 (uplifting/luminous)
  sentenceCount: number;
  avgSentenceLength: number;
  hasDialogue: boolean;
}

export interface ChapterSentimentReport {
  overallScore: number; // -1.0 to +1.0
  normalizedScore: number; // 0 to 100 for gauge display (50 = neutral)
  toneLabel: string;
  toneDescription: string;
  emotionalVariance: number; // standard deviation of paragraph sentiments (0.0 to 1.0)
  varianceRating: 'Subtle / Flat' | 'Steady Mood' | 'Dynamic Arc' | 'High Contrast Rollercoaster';
  varianceFeedback: string;

  // Pacing metrics
  pacingScore: number; // 0 to 100 (rhythmic variety)
  pacingRating: 'Metronomic / Uniform' | 'Smooth Flow' | 'Vibrant / Varied' | 'Staccato & Dramatic';
  avgSentenceLength: number;
  sentenceLengthVariance: number; // std dev of sentence lengths
  dialogueRatio: number; // 0.0 to 1.0 (percentage of words in dialogue)
  pacingFeedback: string;

  // Narrative tone breakdown
  positiveWordCount: number;
  negativeWordCount: number;
  tensionWordCount: number;
  wonderWordCount: number;

  // Paragraph-by-paragraph emotional arc
  paragraphSlices: ParagraphSlice[];

  // Actionable craft suggestions
  editorialRecommendations: string[];
}

// Lexicons customized for literary prose
const POSITIVE_WORDS = new Set([
  'hope', 'hopeful', 'smiled', 'smile', 'smiling', 'laughed', 'laughter', 'joy', 'joyful', 'joyous',
  'warmth', 'warm', 'serene', 'serenity', 'peace', 'peaceful', 'gentle', 'gently', 'beauty', 'beautiful',
  'triumph', 'triumphant', 'radiant', 'radiance', 'magnificent', 'adore', 'adored', 'beloved', 'miracle',
  'transcendent', 'transcendence', 'bliss', 'blissful', 'victory', 'victorious', 'celebrate', 'celebration',
  'courage', 'courageous', 'brave', 'bravery', 'light', 'delight', 'delighted', 'solace', 'affection',
  'affectionate', 'grace', 'graceful', 'fond', 'fondly', 'tender', 'tenderness', 'embrace', 'embraced',
  'sparkle', 'glisten', 'golden', 'sanctuary', 'kind', 'kindness', 'harmony', 'cherish', 'cherished',
  'soothe', 'soothed', 'rejoice', 'rejoiced', 'comfort', 'comforted', 'healed', 'healing', 'alive',
  'exhilarated', 'exhilarating', 'gleam', 'gleaming', 'bright', 'sweet', 'sweeter', 'splendid',
  'glory', 'glorious', 'free', 'freedom', 'liberty', 'noble', 'faith', 'faithful', 'loyalty', 'loyal',
]);

const STRONG_POSITIVE_WORDS = new Set([
  'ecstatic', 'euphoric', 'euphoria', 'overjoyed', 'exquisite', 'divine', 'enraptured', 'sublime',
  'paradise', 'miraculous', 'immortal', 'resplendent', 'jubilant', 'unbreakable', 'masterpiece',
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'sadness', 'weary', 'weariness', 'shadow', 'shadows', 'doubt', 'cold', 'grim', 'sorrow',
  'sorrowful', 'ache', 'ached', 'aching', 'lonely', 'loneliness', 'frown', 'frowned', 'tears', 'wept',
  'weeping', 'sigh', 'sighed', 'regret', 'regretful', 'bitter', 'bitterness', 'fragile', 'hesitation',
  'tension', 'tense', 'fear', 'fearful', 'dread', 'dreading', 'grief', 'grieving', 'loss', 'lost',
  'pain', 'painful', 'shiver', 'shivered', 'tremble', 'trembled', 'hollow', 'bleak', 'darkness',
  'dark', 'chill', 'chilling', 'mourn', 'mourning', 'broken', 'shattered', 'wound', 'wounded',
  'struggle', 'struggling', 'guilt', 'guilty', 'shame', 'desolate', 'desolation', 'faint', 'fade',
  'fading', 'forsaken', 'abandoned', 'haggard', 'scar', 'scarred', 'ominous', 'bleeding', 'bleed',
]);

const STRONG_NEGATIVE_WORDS = new Set([
  'agony', 'agonizing', 'terror', 'terrified', 'nightmare', 'horrific', 'horror', 'despair', 'despairing',
  'murder', 'murdered', 'blood', 'bloody', 'scream', 'screamed', 'ruin', 'ruined', 'catastrophic',
  'betray', 'betrayal', 'betrayed', 'suffocating', 'fury', 'furious', 'wrath', 'merciless', 'doomed',
  'perish', 'slaughter', 'vengeance', 'hatred', 'cruel', 'cruelty', 'vicious', 'nightmarish', 'malice',
]);

const TENSION_WORDS = new Set([
  'breathless', 'pulse', 'racing', 'whisper', 'stalked', 'crept', 'abrupt', 'sudden', 'frozen',
  'gasp', 'gasped', 'clutched', 'grip', 'gripped', 'alarm', 'trigger', 'blade', 'edge', 'hunted',
  'pursuit', 'danger', 'lethal', 'snapped', 'warning', 'clatter', 'silence', 'heartbeat', 'stealth',
]);

const WONDER_WORDS = new Set([
  'infinite', 'vast', 'ancient', 'mystery', 'mysterious', 'unfathomable', 'stars', 'cosmos', 'horizon',
  'alchemy', 'enchanted', 'spellbound', 'awe', 'luminous', 'starlight', 'chronicle', 'reverence', 'voyage',
]);

const INTENSIFIERS = new Set([
  'deeply', 'profoundly', 'utterly', 'wildly', 'terribly', 'intensely', 'violently', 'overwhelmingly',
  'immensely', 'extraordinarily', 'completely', 'absolutely', 'piercingly', 'bitterly', 'desperately',
]);

const NEGATORS = new Set([
  'not', 'no', 'never', 'neither', 'nor', 'scarcely', 'hardly', 'barely', 'without', 'cannot', "didn't",
  "couldn't", "wasn't", "aren't", "won't",
]);

/**
 * Strips HTML tags, preserves paragraph breaks
 */
function cleanProse(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Extracts dialogue quotes from text
 */
function measureDialogueRatio(raw: string): number {
  if (!raw) return 0;
  const quoteMatches = raw.match(/"([^"]*)"|“([^”]*)”|«([^»]*)»/g);
  if (!quoteMatches || quoteMatches.length === 0) return 0;

  const dialogueWords = quoteMatches
    .map((q) => q.replace(/["“”«»]/g, '').trim().split(/\s+/).filter(Boolean).length)
    .reduce((sum, n) => sum + n, 0);

  const totalWords = raw.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  if (totalWords === 0) return 0;

  return Math.min(1.0, dialogueWords / totalWords);
}

/**
 * Scores a sentence or short block of text
 */
function scoreTextTokens(text: string): {
  score: number;
  posCount: number;
  negCount: number;
  tensionCount: number;
  wonderCount: number;
} {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let rawScore = 0;
  let posCount = 0;
  let negCount = 0;
  let tensionCount = 0;
  let wonderCount = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // Check for negation in preceding 2 words
    const isNegated =
      (i > 0 && NEGATORS.has(words[i - 1])) ||
      (i > 1 && NEGATORS.has(words[i - 2]));

    // Check for intensifier
    const isIntensified =
      (i > 0 && INTENSIFIERS.has(words[i - 1])) ||
      (i > 1 && INTENSIFIERS.has(words[i - 2]));

    const multiplier = isIntensified ? 1.5 : 1.0;

    if (STRONG_POSITIVE_WORDS.has(w)) {
      const val = 2.0 * multiplier * (isNegated ? -0.8 : 1.0);
      rawScore += val;
      if (val > 0) posCount += 2;
      else negCount += 1;
    } else if (POSITIVE_WORDS.has(w)) {
      const val = 1.0 * multiplier * (isNegated ? -0.7 : 1.0);
      rawScore += val;
      if (val > 0) posCount += 1;
      else negCount += 1;
    } else if (STRONG_NEGATIVE_WORDS.has(w)) {
      const val = -2.0 * multiplier * (isNegated ? 0.6 : 1.0);
      rawScore += val;
      if (val < 0) negCount += 2;
      else posCount += 1;
    } else if (NEGATIVE_WORDS.has(w)) {
      const val = -1.0 * multiplier * (isNegated ? 0.5 : 1.0);
      rawScore += val;
      if (val < 0) negCount += 1;
      else posCount += 1;
    }

    if (TENSION_WORDS.has(w)) tensionCount++;
    if (WONDER_WORDS.has(w)) wonderCount++;
  }

  // Normalize by word count with a dampener so long passages don't explode
  const wordCount = Math.max(1, words.length);
  // Scaling factor for literary density
  const normalized = Math.max(-1.0, Math.min(1.0, (rawScore / Math.sqrt(wordCount)) * 0.45));

  return {
    score: normalized,
    posCount,
    negCount,
    tensionCount,
    wonderCount,
  };
}

/**
 * Primary analysis engine for chapter prose
 */
export function analyzeChapterSentiment(content: string): ChapterSentimentReport {
  const plainText = cleanProse(content);

  if (!plainText || plainText.length < 15) {
    return {
      overallScore: 0,
      normalizedScore: 50,
      toneLabel: 'Neutral / Awaiting Prose',
      toneDescription: 'Type your manuscript to begin real-time tone and pacing analysis.',
      emotionalVariance: 0,
      varianceRating: 'Steady Mood',
      varianceFeedback: 'No emotional swings detected yet.',
      pacingScore: 50,
      pacingRating: 'Smooth Flow',
      avgSentenceLength: 0,
      sentenceLengthVariance: 0,
      dialogueRatio: 0,
      pacingFeedback: 'Add sentences to calculate narrative rhythm and dialogue balance.',
      positiveWordCount: 0,
      negativeWordCount: 0,
      tensionWordCount: 0,
      wonderWordCount: 0,
      paragraphSlices: [],
      editorialRecommendations: [
        'Write or paste chapter prose to view sentiment polarity, emotional arc, and sentence rhythm.',
      ],
    };
  }

  // Break text into paragraphs
  const rawParagraphs = plainText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  // Sentences across the entire chapter
  const allSentences = plainText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 2);

  // Calculate sentence length variance
  const sentenceLengths = allSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const totalSentences = Math.max(1, sentenceLengths.length);
  const avgSentenceLength =
    sentenceLengths.reduce((sum, len) => sum + len, 0) / totalSentences;

  const lengthVarianceSquared =
    sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) /
    totalSentences;
  const sentenceLengthVariance = Math.sqrt(lengthVarianceSquared);

  // Paragraph Slices for emotional arc
  const paragraphSlices: ParagraphSlice[] = [];
  let totalPos = 0;
  let totalNeg = 0;
  let totalTension = 0;
  let totalWonder = 0;

  // Process paragraphs or group into ~15 discrete slices if chapter is long
  const targetSlices = Math.min(24, Math.max(4, rawParagraphs.length));
  const chunkSize = Math.max(1, Math.floor(rawParagraphs.length / targetSlices));

  for (let i = 0; i < rawParagraphs.length; i += chunkSize) {
    const chunk = rawParagraphs.slice(i, i + chunkSize).join(' ');
    const chunkWords = chunk.split(/\s+/).filter(Boolean).length;
    const chunkSentences = chunk.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const { score, posCount, negCount, tensionCount, wonderCount } = scoreTextTokens(chunk);

    totalPos += posCount;
    totalNeg += negCount;
    totalTension += tensionCount;
    totalWonder += wonderCount;

    const hasDialogue = /["“”«»]/.test(chunk);
    const snippet =
      chunk.slice(0, 100) + (chunk.length > 100 ? '…' : '');

    paragraphSlices.push({
      index: paragraphSlices.length + 1,
      snippet,
      wordCount: chunkWords,
      sentimentScore: Math.round(score * 100) / 100,
      sentenceCount: Math.max(1, chunkSentences.length),
      avgSentenceLength: Math.round((chunkWords / Math.max(1, chunkSentences.length)) * 10) / 10,
      hasDialogue,
    });
  }

  // Overall chapter score based on all paragraph scores weighted by length
  let weightedScoreSum = 0;
  let totalWordsInSlices = 0;
  paragraphSlices.forEach((p) => {
    weightedScoreSum += p.sentimentScore * p.wordCount;
    totalWordsInSlices += p.wordCount;
  });

  const overallScore =
    totalWordsInSlices > 0
      ? Math.max(-1.0, Math.min(1.0, weightedScoreSum / totalWordsInSlices))
      : 0;

  // Normalized score 0-100 (50 = neutral)
  const normalizedScore = Math.round(((overallScore + 1) / 2) * 100);

  // Emotional Variance: Standard deviation of paragraph sentiment scores
  const sliceScores = paragraphSlices.map((p) => p.sentimentScore);
  const meanSliceScore =
    sliceScores.reduce((sum, val) => sum + val, 0) / Math.max(1, sliceScores.length);
  const varianceSum = sliceScores.reduce(
    (sum, val) => sum + Math.pow(val - meanSliceScore, 2),
    0
  );
  const emotionalVariance =
    Math.round(Math.sqrt(varianceSum / Math.max(1, sliceScores.length)) * 100) / 100;

  // Variance rating & feedback
  let varianceRating: ChapterSentimentReport['varianceRating'] = 'Steady Mood';
  let varianceFeedback = '';

  if (emotionalVariance >= 0.4) {
    varianceRating = 'High Contrast Rollercoaster';
    varianceFeedback =
      'High emotional contrast across scenes. Significant dramatic shifts between tension and relief create compelling peaks.';
  } else if (emotionalVariance >= 0.22) {
    varianceRating = 'Dynamic Arc';
    varianceFeedback =
      'Healthy narrative ebb and flow. Characters experience emotional movement without jarring tonal discord.';
  } else if (emotionalVariance >= 0.1) {
    varianceRating = 'Steady Mood';
    varianceFeedback =
      'Sustained atmospheric consistency. Good for deepening dread, melancholy, or serene reflection.';
  } else {
    varianceRating = 'Subtle / Flat';
    varianceFeedback =
      'Very uniform emotional tone throughout. Consider injecting a surprise, dialogue clash, or sensory shift to create narrative texture.';
  }

  // Pacing Rhythm evaluation
  let pacingScore = Math.round(
    Math.min(100, Math.max(10, (sentenceLengthVariance / (avgSentenceLength || 10)) * 75))
  );
  let pacingRating: ChapterSentimentReport['pacingRating'] = 'Smooth Flow';
  let pacingFeedback = '';

  if (sentenceLengthVariance > 12) {
    pacingRating = 'Staccato & Dramatic';
    pacingFeedback =
      'Dynamic, cinematic pacing. High contrast between punchy short clauses and long atmospheric descriptions keeps reader engagement sharp.';
  } else if (sentenceLengthVariance >= 7) {
    pacingRating = 'Vibrant / Varied';
    pacingFeedback =
      'Well-balanced sentence rhythms. Natural cadence mimicking authentic human observation and dialogue.';
  } else if (sentenceLengthVariance >= 4) {
    pacingRating = 'Smooth Flow';
    pacingFeedback =
      'Consistent rhythmic cadence. Prose flows steadily without abrupt velocity spikes.';
  } else {
    pacingRating = 'Metronomic / Uniform';
    pacingFeedback =
      'Sentence lengths are very uniform. Pacing may feel monotone; try introducing short 2-to-4 word fragments to quicken action scenes.';
  }

  const dialogueRatio = measureDialogueRatio(content);

  // Tone Classification
  let toneLabel = 'Neutral / Contemplative';
  let toneDescription = 'Measured, observational prose with balanced emotional balance.';

  if (overallScore <= -0.55) {
    toneLabel = 'Dark & Agonizing';
    toneDescription =
      'Heavy tragic weight, lethal stakes, or deep grief dominating the narrative atmosphere.';
  } else if (overallScore <= -0.25) {
    toneLabel = 'Tense & Melancholic';
    toneDescription =
      'Strong undercurrent of dread, unresolved conflict, or somber character introspection.';
  } else if (overallScore <= -0.06) {
    toneLabel = 'Somber & Atmospheric';
    toneDescription =
      'Muted, brooding tone with moments of quiet reservation and underlying unease.';
  } else if (overallScore < 0.08) {
    toneLabel = 'Neutral & Observational';
    toneDescription =
      'Balanced exposition, intellectual investigation, or worldbuilding description.';
  } else if (overallScore < 0.3) {
    toneLabel = 'Warm & Engaging';
    toneDescription =
      'Gentle optimism, camaraderie, sensory comfort, or budding romantic curiosity.';
  } else if (overallScore < 0.6) {
    toneLabel = 'Luminous & Hopeful';
    toneDescription =
      'Resilient uplift, character triumph, emotional resolution, and vibrant energy.';
  } else {
    toneLabel = 'Ecstatic & Triumphant';
    toneDescription =
      'High celebration, euphoric revelation, and unbridled joy.';
  }

  // Generate actionable editorial recommendations
  const recommendations: string[] = [];

  if (dialogueRatio < 0.08 && paragraphSlices.length > 3) {
    recommendations.push(
      'Dialogue represents under 8% of this chapter. If this is a character interaction scene, converting indirect thoughts into spoken dialogue will accelerate scene momentum.'
    );
  } else if (dialogueRatio > 0.55) {
    recommendations.push(
      'Dialogue represents over 55% of this passage. Anchor the dialogue with sensory beats, character gestures, or setting details to avoid "talking heads" syndrome.'
    );
  }

  if (avgSentenceLength > 24) {
    recommendations.push(
      `Average sentence length is high (${avgSentenceLength.toFixed(1)} words). Long periodic sentences enhance lyrical contemplation, but breaking a few during key actions will heighten urgency.`
    );
  } else if (avgSentenceLength < 9) {
    recommendations.push(
      `Average sentence length is brief (${avgSentenceLength.toFixed(1)} words). This creates high adrenaline; pair with occasional flowing descriptive sentences to prevent reader fatigue.`
    );
  }

  if (emotionalVariance < 0.12 && paragraphSlices.length >= 4) {
    recommendations.push(
      'Emotional variance is low. Consider introducing a contrasting beat (e.g. a flash of dark humor in grief, or a shadow of doubt in victory) to create multi-dimensional realism.'
    );
  } else if (emotionalVariance > 0.45) {
    recommendations.push(
      'Emotional swings are pronounced. Ensure the transition between the darkest dips and the highest peaks feels earned through progressive narrative causality.'
    );
  }

  if (totalTension > 5 && overallScore > 0.2) {
    recommendations.push(
      'Tension keywords are paired with positive valence, signaling exciting suspense with an undercurrent of hope.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Tone and pacing are harmonious. The chapter exhibits clean cadence, steady emotional progression, and immersive prose.'
    );
  }

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    normalizedScore,
    toneLabel,
    toneDescription,
    emotionalVariance,
    varianceRating,
    varianceFeedback,
    pacingScore,
    pacingRating,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    sentenceLengthVariance: Math.round(sentenceLengthVariance * 10) / 10,
    dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    pacingFeedback,
    positiveWordCount: totalPos,
    negativeWordCount: totalNeg,
    tensionWordCount: totalTension,
    wonderWordCount: totalWonder,
    paragraphSlices,
    editorialRecommendations: recommendations,
  };
}
