import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chapter, CharacterProfile, FootnoteItem, StyleConfig } from '../types/book';
import {
  detectDuplicatesInContent,
  autoDeduplicateContent,
  removeParagraphByIndex,
  DuplicateParagraphItem,
} from '../services/duplicateDetector';
import {
  Bold,
  Italic,
  Sparkles,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Users,
  Target,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Bookmark,
  Copy,
  CopyCheck,
  AlertCircle,
  Wand2,
  Gauge,
  Waves,
  Flame,
  Map,
} from 'lucide-react';
import { analyzeChapterSentiment } from '../services/sentimentAnalyzer';
import { WritingSentimentGauge } from './WritingSentimentGauge';
import { analyzeRepetitiveWords } from '../services/repetitiveWordDetector';
import { WordRepetitionHeatmap } from './WordRepetitionHeatmap';
import { BookMapVisualizer } from './BookMapVisualizer';

interface EditorPaneProps {
  chapter: Chapter;
  chapters?: Chapter[];
  characters: CharacterProfile[];
  styleConfig: StyleConfig;
  focusMode: boolean;
  onUpdateChapter: (updated: Partial<Chapter>) => void;
  onOpenCharacterModal: () => void;
  onOpenDocumentCleaner?: () => void;
  onSelectChapter?: (chapterId: string) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  chapter,
  chapters = [],
  characters,
  styleConfig,
  focusMode,
  onUpdateChapter,
  onOpenCharacterModal,
  onOpenDocumentCleaner,
  onSelectChapter,
}) => {
  const currentDirection: 'ltr' | 'rtl' = chapter.direction || styleConfig.direction || 'ltr';

  const toggleDirection = () => {
    const nextDir = currentDirection === 'rtl' ? 'ltr' : 'rtl';
    onUpdateChapter({ direction: nextDir });
  };
  const [content, setContent] = useState(chapter.content || '');
  const [title, setTitle] = useState(chapter.title || '');
  const [subtitle, setSubtitle] = useState(chapter.subtitle || '');
  const [partNumber, setPartNumber] = useState<number>(chapter.partNumber || 1);
  const [showFootnotesDrawer, setShowFootnotesDrawer] = useState(false);
  const [showReadabilityDrawer, setShowReadabilityDrawer] = useState(false);
  const [showDuplicatesDrawer, setShowDuplicatesDrawer] = useState(false);
  const [showSentimentDrawer, setShowSentimentDrawer] = useState(false);
  const [showHeatmapDrawer, setShowHeatmapDrawer] = useState(false);
  const [showBookMapDrawer, setShowBookMapDrawer] = useState(false);
  const [showCharacterQuickRef, setShowCharacterQuickRef] = useState(false);

  // Sync state when selected chapter changes
  useEffect(() => {
    setContent(chapter.content || '');
    setTitle(chapter.title || '');
    setSubtitle(chapter.subtitle || '');
    if (chapter.partNumber) setPartNumber(chapter.partNumber);
  }, [chapter.id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    onUpdateChapter({ title: val });
  };

  const handleSubtitleChange = (val: string) => {
    setSubtitle(val);
    onUpdateChapter({ subtitle: val });
  };

  const handlePartNumberChange = (num: number) => {
    setPartNumber(num);
    onUpdateChapter({ partNumber: num });
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    const words = countWords(val);
    onUpdateChapter({ content: val, wordCount: words });
  };

  // Footnote Operations
  const handleAddFootnote = () => {
    const currentList = chapter.footnotes || [];
    const nextNum = currentList.length + 1;
    const newFn: FootnoteItem = {
      id: 'fn_' + Date.now(),
      number: nextNum,
      text: '',
    };
    const updated = [...currentList, newFn];
    onUpdateChapter({ footnotes: updated });
    setShowFootnotesDrawer(true);

    // Insert marker into content if appropriate
    const marker = `<sup class="footnote-ref" data-fn="${newFn.id}">[${nextNum}]</sup>`;
    handleContentChange(content + ` ${marker} `);
  };

  const handleUpdateFootnote = (fnId: string, text: string) => {
    const currentList = chapter.footnotes || [];
    const updated = currentList.map((fn) => (fn.id === fnId ? { ...fn, text } : fn));
    onUpdateChapter({ footnotes: updated });
  };

  const handleDeleteFootnote = (fnId: string) => {
    const currentList = chapter.footnotes || [];
    const updated = currentList
      .filter((fn) => fn.id !== fnId)
      .map((fn, idx) => ({ ...fn, number: idx + 1 }));
    onUpdateChapter({ footnotes: updated });
  };

  // Scene break inserter
  const handleInsertSceneBreak = () => {
    const breakHtml = `\n<p class="scene-break text-center my-6">❦  •  ❦</p>\n<p>`;
    handleContentChange(content + breakHtml);
  };

  // Readability computation
  const readabilityStats = computeReadability(content);

  // Literary Sentiment & Narrative Pacing computation (D3.js integration)
  const sentimentReport = useMemo(() => {
    return analyzeChapterSentiment(content);
  }, [content]);

  // Repetitive & Overused Words Heatmap computation (D3.js integration)
  const repetitiveWordsReport = useMemo(() => {
    return analyzeRepetitiveWords(content);
  }, [content]);

  // Duplicate Paragraphs Detection
  const duplicateParagraphs = useMemo(() => {
    return detectDuplicatesInContent(content, chapter.title, chapter.id);
  }, [content, chapter.title, chapter.id]);

  // Handle removing a specific duplicate paragraph occurrence
  const handleRemoveDuplicateParagraph = (pIndex: number) => {
    const updatedHtml = removeParagraphByIndex(content, pIndex);
    handleContentChange(updatedHtml);
  };

  // Handle auto-deduplication of entire chapter
  const handleAutoDeduplicateChapter = () => {
    const { newContent, removedCount } = autoDeduplicateContent(content);
    if (removedCount > 0) {
      handleContentChange(newContent);
    }
  };

  const isPartDivider = chapter.type === 'part';

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${
        focusMode
          ? 'bg-[#181614] text-[#e8e4de]'
          : 'bg-stone-900 text-stone-100'
      }`}
    >
      {/* Editor Sub-Header Toolbar */}
      <div
        className={`px-2 sm:px-4 py-2 border-b flex items-center justify-between shrink-0 select-none text-xs transition-colors overflow-x-auto no-scrollbar gap-2 ${
          focusMode
            ? 'border-stone-800 bg-[#141210]'
            : 'border-stone-800 bg-stone-950/80'
        }`}
      >
        <div className="flex items-center gap-2">
          {isPartDivider ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[11px] border border-amber-500/40 flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              <span>Full-Page Part Divider</span>
            </span>
          ) : (
            <span className="text-stone-400 font-mono text-[11px]">
              {countWords(content).toLocaleString()} words
              {chapter.targetWordCount && ` / ${chapter.targetWordCount.toLocaleString()} target`}
            </span>
          )}

          {!isPartDivider && (
            <>
              <div className="h-3 w-px bg-stone-800 mx-1" />
              <button
                onClick={handleAddFootnote}
                className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="Insert Footnote (EPUB 3 popup & Print notes)"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Footnote ({chapter.footnotes?.length || 0})</span>
              </button>

              <button
                onClick={handleInsertSceneBreak}
                className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="Insert Scene Break Fleuron"
              >
                <span>❦ Break</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Character Quick-Ref Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowCharacterQuickRef(!showCharacterQuickRef)}
              className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 flex items-center gap-1 transition-colors"
              title="Cast Dossiers"
            >
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Cast ({characters.length})</span>
            </button>

            {showCharacterQuickRef && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-3 z-30 animate-fade-in text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <span className="font-semibold text-stone-200">Character References</span>
                  <button
                    onClick={onOpenCharacterModal}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Manage Cast &rarr;
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {characters.length === 0 ? (
                    <div className="text-stone-500 text-center py-2 text-[11px]">No characters yet.</div>
                  ) : (
                    characters.map((c) => (
                      <div key={c.id} className="p-1.5 rounded bg-stone-950 border border-stone-800/80">
                        <div className="font-semibold text-amber-300 text-[11px]">{c.name}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-2">
                          {c.physicalTraits || c.bio}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Readability Meter Toggle */}
          {!isPartDivider && (
            <button
              onClick={() => setShowReadabilityDrawer(!showReadabilityDrawer)}
              className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
                showReadabilityDrawer
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <BarChart2 className="w-3 h-3 text-emerald-400" />
              <span>Grade {readabilityStats.gradeLevel}</span>
            </button>
          )}

          {/* Writing Sentiment & Tone Meter Toggle (D3.js) */}
          {!isPartDivider && (
            <button
              type="button"
              onClick={() => setShowSentimentDrawer(!showSentimentDrawer)}
              className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                showSentimentDrawer
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800'
              }`}
              title="Writing Sentiment & Narrative Pacing (D3.js Tone & Variance Analysis)"
            >
              <Gauge className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Tone:</span>
              <span className="font-semibold text-[11px] truncate max-w-[85px]">
                {sentimentReport.toneLabel.split(' ')[0]}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    sentimentReport.overallScore <= -0.2
                      ? '#f43f5e'
                      : sentimentReport.overallScore >= 0.2
                      ? '#34d399'
                      : '#94a3b8',
                }}
              />
            </button>
          )}

          {/* Overused Words Heatmap Toggle (D3.js) */}
          {!isPartDivider && (
            <button
              type="button"
              onClick={() => setShowHeatmapDrawer(!showHeatmapDrawer)}
              className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                showHeatmapDrawer
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-semibold shadow-sm'
                  : repetitiveWordsReport.highestLocalEcho && repetitiveWordsReport.highestLocalEcho.count >= 3
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800'
              }`}
              title="Vocabulary Heatmap & Overused Words (D3.js Density Grid)"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Repetition</span>
              <span className="font-mono text-[10px] text-stone-400">
                ({repetitiveWordsReport.allDetectedWords.length})
              </span>
            </button>
          )}

          {/* Book Map Timeline & Manuscript Pacing Toggle (D3.js) */}
          {chapters && chapters.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBookMapDrawer(!showBookMapDrawer)}
              className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                showBookMapDrawer
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 font-semibold shadow-sm'
                  : 'bg-stone-850 border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800'
              }`}
              title="Book Map (D3.js Entire Manuscript Timeline & Pacing Horizon)"
            >
              <Map className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Book Map</span>
            </button>
          )}

          {/* Duplicate Paragraphs Detector Toggle */}
          {!isPartDivider && (
            <button
              onClick={() => setShowDuplicatesDrawer(!showDuplicatesDrawer)}
              className={`px-2 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                duplicateParagraphs.length > 0
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                  : showDuplicatesDrawer
                  ? 'bg-stone-800 border-stone-700 text-stone-200'
                  : 'bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
              title="Duplicate Paragraph Detector"
            >
              {duplicateParagraphs.length > 0 ? (
                <Copy className="w-3 h-3 text-amber-400" />
              ) : (
                <CopyCheck className="w-3 h-3 text-emerald-400" />
              )}
              <span>
                {duplicateParagraphs.length > 0
                  ? `Duplicates (${duplicateParagraphs.length})`
                  : 'Duplicates (0)'}
              </span>
            </button>
          )}

          {/* Document Cleaner Tool */}
          {onOpenDocumentCleaner && (
            <button
              type="button"
              onClick={onOpenDocumentCleaner}
              className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
              title="Clean Document (Typographical scrub, smart quotes, em-dashes)"
            >
              <Wand2 className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Clean</span>
            </button>
          )}

          {/* RTL / LTR Direction Toggle */}
          <button
            type="button"
            onClick={toggleDirection}
            className={`px-2 py-1 rounded border font-mono text-[11px] font-bold flex items-center gap-1 transition-colors ${
              currentDirection === 'rtl'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            title={
              currentDirection === 'rtl'
                ? 'Right-To-Left active (Hebrew, Arabic, Persian, Urdu). Click to switch to LTR'
                : 'Left-To-Right active. Click to switch to RTL'
            }
          >
            <span>{currentDirection.toUpperCase()}</span>
          </button>

          {/* Footnotes Drawer Toggle */}
          {!isPartDivider && (chapter.footnotes?.length || 0) > 0 && (
            <button
              onClick={() => setShowFootnotesDrawer(!showFootnotesDrawer)}
              className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-violet-400" />
              <span>Notes</span>
              {showFootnotesDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Readability Analysis Drawer */}
      {showReadabilityDrawer && (
        <div className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 animate-fade-in text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-stone-200">Flesch-Kincaid Prose Analysis</h4>
            </div>
            <button
              onClick={() => setShowReadabilityDrawer(false)}
              className="text-stone-500 hover:text-stone-300 text-xs"
            >
              &times; Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider">Grade Level</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{readabilityStats.gradeLevel}</div>
              <div className="text-[9px] text-stone-500">{readabilityStats.gradeCategory}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider">Reading Ease</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{readabilityStats.readingEase} / 100</div>
              <div className="text-[9px] text-stone-500">{readabilityStats.easeCategory}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider">Avg Sentence</div>
              <div className="text-base font-bold text-stone-200 mt-0.5">{readabilityStats.avgWordsPerSentence} words</div>
              <div className="text-[9px] text-stone-500">Pacing guide</div>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider">Complex Words</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">{readabilityStats.complexWordsPercentage}%</div>
              <div className="text-[9px] text-stone-500">3+ syllables</div>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-300 text-[11px] leading-relaxed">
            <span className="font-semibold text-amber-300">Style Suggestion: </span>
            {readabilityStats.suggestion}
          </div>
        </div>
      )}

      {/* D3.js Writing Sentiment & Narrative Pacing Gauge Drawer */}
      {showSentimentDrawer && (
        <WritingSentimentGauge
          report={sentimentReport}
          onClose={() => setShowSentimentDrawer(false)}
        />
      )}

      {/* D3.js Overused Words & Vocabulary Heatmap Drawer */}
      {showHeatmapDrawer && (
        <WordRepetitionHeatmap
          report={repetitiveWordsReport}
          onClose={() => setShowHeatmapDrawer(false)}
        />
      )}

      {/* D3.js Book Map & Chapter Pacing Timeline Drawer */}
      {showBookMapDrawer && (
        <BookMapVisualizer
          chapters={chapters}
          currentChapterId={chapter.id}
          onSelectChapter={onSelectChapter}
          onClose={() => setShowBookMapDrawer(false)}
        />
      )}

      {/* Duplicate Paragraphs Inspector Drawer */}
      {showDuplicatesDrawer && (
        <div className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 animate-fade-in text-xs max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-semibold text-stone-200">
                  Duplicate Paragraph Detector ({duplicateParagraphs.length} found)
                </h4>
                <p className="text-[10px] text-stone-400">
                  Identifies repeated paragraph blocks in this chapter to avoid accidental pasting or redundant copy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {duplicateParagraphs.length > 0 && (
                <button
                  onClick={handleAutoDeduplicateChapter}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  title="Remove duplicate copies while keeping the original"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Deduplicate Chapter</span>
                </button>
              )}
              <button
                onClick={() => setShowDuplicatesDrawer(false)}
                className="text-stone-500 hover:text-stone-300 text-xs"
              >
                &times; Close
              </button>
            </div>
          </div>

          {duplicateParagraphs.length === 0 ? (
            <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800 flex items-center gap-2 text-stone-400">
              <CopyCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No duplicate paragraphs detected in this section. Every paragraph is unique.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicateParagraphs.map((dup) => (
                <div
                  key={dup.id}
                  className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        {dup.duplicateCount}x Repeated
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {dup.wordCount} words
                      </span>
                    </div>
                  </div>

                  <p className="text-stone-300 text-[11px] italic bg-stone-950/80 p-2 rounded-lg border border-stone-800/80 line-clamp-3">
                    "{dup.text}"
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                      Occurrences in Chapter:
                    </span>
                    {dup.occurrences.map((occ, oIdx) => (
                      <div
                        key={oIdx}
                        className="flex items-center justify-between p-1.5 rounded bg-stone-950 border border-stone-800/60 text-[11px]"
                      >
                        <span className="text-stone-400">
                          {oIdx === 0 ? (
                            <span className="text-emerald-400 font-semibold mr-1.5">[Original]</span>
                          ) : (
                            <span className="text-amber-400 font-semibold mr-1.5">[Copy #{oIdx}]</span>
                          )}
                          Paragraph #{occ.paragraphIndex + 1}
                        </span>

                        {oIdx > 0 && (
                          <button
                            onClick={() => handleRemoveDuplicateParagraph(occ.paragraphIndex)}
                            className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-medium flex items-center gap-1 transition-colors"
                            title="Remove this duplicate paragraph"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Remove Duplicate</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footnotes Management Drawer */}
      {showFootnotesDrawer && (
        <div className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 animate-fade-in text-xs max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <h4 className="font-semibold text-stone-200">
                Chapter Footnotes ({chapter.footnotes?.length || 0})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddFootnote}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Note</span>
              </button>
              <button
                onClick={() => setShowFootnotesDrawer(false)}
                className="text-stone-500 hover:text-stone-300"
              >
                &times; Close
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {(chapter.footnotes || []).map((fn) => (
              <div key={fn.id} className="flex items-start gap-2 bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold text-center text-[10px] leading-5 shrink-0">
                  {fn.number}
                </span>
                <textarea
                  rows={2}
                  value={fn.text}
                  onChange={(e) => handleUpdateFootnote(fn.id, e.target.value)}
                  placeholder="Enter footnote / citation text here (renders in EPUB 3 popup and bottom-of-page print)..."
                  className="flex-1 bg-stone-950 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
                <button
                  onClick={() => handleDeleteFootnote(fn.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 rounded transition-colors"
                  title="Delete Footnote"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Writing Canvas */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 flex justify-center pb-20 lg:pb-8">
        <div
          className={`w-full max-w-2xl flex flex-col transition-all ${
            focusMode ? 'max-w-3xl font-serif' : ''
          }`}
        >
          {isPartDivider ? (
            /* Dedicated Full-Page Part Divider Canvas (Phase 2) */
            <div className="p-8 rounded-2xl bg-stone-950/60 border border-stone-800/80 my-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-widest">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Multi-Volume / Part Divider</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <label className="text-xs text-stone-400 font-medium uppercase tracking-wider">Part Number:</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePartNumberChange(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-serif font-bold transition-all ${
                        partNumber === num
                          ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                          : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {toRoman(num)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Part Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Brass Meridian"
                  className="w-full text-center text-2xl font-serif font-bold bg-transparent border-b border-stone-800 focus:border-amber-500 pb-2 text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                  Optional Subtitle or Act Theme
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => handleSubtitleChange(e.target.value)}
                  placeholder="e.g. In which the sky fractures and ancient covenants unravel"
                  className="w-full text-center text-sm italic font-serif bg-transparent border-b border-stone-800 focus:border-amber-500 pb-1 text-stone-400 focus:outline-none"
                />
              </div>

              <div className="py-2 text-2xl text-stone-600 font-serif">❦  •  ❦</div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                  Divider Epigraph / Foreword Note (Optional)
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="&quot;To measure the meridian is not to tame the star...&quot; — Ancient Navigators’ Codex"
                  className="w-full text-center text-xs italic font-serif bg-stone-900/60 border border-stone-800 rounded-xl p-3 text-stone-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-[11px] text-stone-500 italic">
                Renders as a dedicated, standalone full page in EPUB, device preview, and print PDF.
              </div>
            </div>
          ) : (
            /* Standard Chapter Editor Canvas */
            <>
              {/* Title & Subtitle Inputs */}
              <div className="mb-6 space-y-2" dir={currentDirection}>
                <input
                  type="text"
                  dir={currentDirection}
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Chapter Title..."
                  className={`w-full bg-transparent font-serif font-bold text-2xl lg:text-3xl text-stone-100 placeholder-stone-600 focus:outline-none border-b pb-2 ${
                    focusMode ? 'border-stone-800' : 'border-stone-800 focus:border-amber-500'
                  }`}
                  style={{
                    direction: currentDirection,
                    textAlign: currentDirection === 'rtl' ? 'right' : 'left',
                  }}
                />
                <input
                  type="text"
                  dir={currentDirection}
                  value={subtitle}
                  onChange={(e) => handleSubtitleChange(e.target.value)}
                  placeholder="Optional Chapter Subtitle / Date / Location..."
                  className="w-full bg-transparent font-serif italic text-xs lg:text-sm text-stone-400 placeholder-stone-700 focus:outline-none border-b border-transparent focus:border-stone-800 pb-1"
                  style={{
                    direction: currentDirection,
                    textAlign: currentDirection === 'rtl' ? 'right' : 'left',
                  }}
                />
              </div>

              {/* Prose Writing Area */}
              <textarea
                dir={currentDirection}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Begin your story here... Use standard paragraphs and markdown headings (#) or HTML tags."
                className={`w-full flex-1 min-h-[500px] bg-transparent resize-none focus:outline-none leading-relaxed transition-all ${
                  focusMode
                    ? 'text-lg text-[#d8d2c8] leading-[1.8] font-serif'
                    : 'text-sm text-stone-200 leading-[1.7] font-serif'
                }`}
                style={{
                  fontFamily: styleConfig.bodyFont || 'Georgia, serif',
                  direction: currentDirection,
                  textAlign: currentDirection === 'rtl' ? 'right' : 'left',
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function countWords(str: string): number {
  if (!str) return 0;
  // Strip tags
  const clean = str.replace(/<[^>]+>/g, ' ');
  return clean.trim().split(/\s+/).filter(Boolean).length;
}

function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  w = w.replace(/^y/, '');
  const matches = w.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function computeReadability(text: string) {
  const clean = text.replace(/<[^>]+>/g, ' ').trim();
  if (!clean) {
    return {
      gradeLevel: '0.0',
      gradeCategory: 'No prose',
      readingEase: 100,
      easeCategory: 'Very Easy',
      avgWordsPerSentence: '0.0',
      complexWordsPercentage: 0,
      suggestion: 'Begin writing to see real-time readability feedback.',
    };
  }

  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  const numSentences = Math.max(1, sentences.length);
  const numWords = Math.max(1, words.length);

  let totalSyllables = 0;
  let complexWords = 0;

  words.forEach((w) => {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) complexWords++;
  });

  // Flesch Reading Ease: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const ease = 206.835 - 1.015 * (numWords / numSentences) - 84.6 * (totalSyllables / numWords);
  const clampedEase = Math.round(Math.max(0, Math.min(100, ease)));

  // Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const grade = 0.39 * (numWords / numSentences) + 11.8 * (totalSyllables / numWords) - 15.59;
  const clampedGrade = Math.max(1, Math.round(grade * 10) / 10);

  let gradeCat = 'Middle School';
  if (clampedGrade <= 6) gradeCat = 'Accessible / YA';
  else if (clampedGrade <= 9) gradeCat = 'Popular Fiction (Best Seller)';
  else if (clampedGrade <= 12) gradeCat = 'Literary / High School';
  else gradeCat = 'Academic / Complex';

  let easeCat = 'Standard';
  if (clampedEase >= 80) easeCat = 'Very Easy';
  else if (clampedEase >= 60) easeCat = 'Standard / Engaging';
  else if (clampedEase >= 40) easeCat = 'Challenging';
  else easeCat = 'Dense / Scholarly';

  let suggestion = 'Pacing is balanced and flowing naturally.';
  if (clampedGrade > 11) {
    suggestion = 'Sentences are fairly long and complex. Consider varying sentence length to create dramatic tension in action scenes.';
  } else if (clampedGrade < 5) {
    suggestion = 'Sentences are punchy and concise. Great for fast-paced thrillers or middle-grade prose.';
  }

  return {
    gradeLevel: clampedGrade.toFixed(1),
    gradeCategory: gradeCat,
    readingEase: clampedEase,
    easeCategory: easeCat,
    avgWordsPerSentence: (numWords / numSentences).toFixed(1),
    complexWordsPercentage: Math.round((complexWords / numWords) * 100),
    suggestion,
  };
}

function toRoman(num: number): string {
  const lookup: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || `${num}`;
}
