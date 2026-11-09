import React, { useState, useMemo } from 'react';
import { Chapter } from '../types/book';
import {
  CleanerOptions,
  DEFAULT_CLEANER_OPTIONS,
  scanTextForCleaningIssues,
  cleanChapter,
  cleanAllChapters,
} from '../services/documentCleaner';
import {
  X,
  Sparkles,
  CheckCircle2,
  Wand2,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';

interface DocumentCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChapter: Chapter;
  chapters: Chapter[];
  onApplyCleaning: (updatedChapters: Chapter[], message: string) => void;
}

export const DocumentCleanerModal: React.FC<DocumentCleanerModalProps> = ({
  isOpen,
  onClose,
  activeChapter,
  chapters,
  onApplyCleaning,
}) => {
  const [scope, setScope] = useState<'chapter' | 'all'>('chapter');
  const [options, setOptions] = useState<CleanerOptions>(DEFAULT_CLEANER_OPTIONS);
  const [previewSnippet, setPreviewSnippet] = useState<string>('');
  const [hasApplied, setHasApplied] = useState(false);

  // Scan current scope for issues
  const scanReport = useMemo(() => {
    if (scope === 'chapter') {
      return scanTextForCleaningIssues(activeChapter?.content || '');
    } else {
      const allText = chapters.map((c) => c.content || '').join('\n');
      return scanTextForCleaningIssues(allText);
    }
  }, [scope, activeChapter, chapters]);

  // Preview before and after cleaning on a sample of text
  const previewComparison = useMemo(() => {
    const rawContent = activeChapter?.content || '';
    // Find a paragraph with some punctuation or formatting if possible
    const paragraphs = rawContent.split(/<\/?p>/).filter((p) => p.trim().length > 20);
    const sample = paragraphs.find((p) => /["'–-]|(\.{3})|\s{2,}/.test(p)) || paragraphs[0] || 'He said, "It\'s about time--we need to move... quickly ."';

    const { updatedChapter } = cleanChapter(
      {
        ...activeChapter,
        content: `<p>${sample}</p>`,
      },
      options
    );

    const cleanSample = updatedChapter.content.replace(/<\/?p>/g, '');

    return {
      before: sample.replace(/<[^>]+>/g, ''),
      after: cleanSample.replace(/<[^>]+>/g, ''),
    };
  }, [activeChapter, options]);

  const toggleOption = (key: keyof CleanerOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExecuteClean = () => {
    if (scope === 'chapter') {
      const { updatedChapter, stats } = cleanChapter(activeChapter, options);
      const updatedList = chapters.map((c) => (c.id === updatedChapter.id ? updatedChapter : c));
      onApplyCleaning(
        updatedList,
        `Cleaned ${stats.totalIssues} typographical issues in ${activeChapter.title}`
      );
    } else {
      const { updatedChapters, totalStats } = cleanAllChapters(chapters, options);
      onApplyCleaning(
        updatedChapters,
        `Cleaned ${totalStats.totalIssues} typographical issues across all ${chapters.length} chapters`
      );
    }
    setHasApplied(true);
    setTimeout(() => {
      onClose();
      setHasApplied(false);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                <span>Manuscript Document Cleaner</span>
              </h2>
              <p className="text-xs text-stone-400">
                Atticus & Vellum-grade typographical scrub, curly quotes, and spacing optimizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Scope Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800">
            <div>
              <div className="text-xs font-semibold text-stone-200">Cleaning Scope</div>
              <p className="text-[10px] text-stone-400">Select whether to clean active chapter or whole manuscript</p>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => setScope('chapter')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  scope === 'chapter'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Active Chapter</span>
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  scope === 'all'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Entire Book ({chapters.length})</span>
              </button>
            </div>
          </div>

          {/* Audit Summary Badges */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Straight Quotes</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                {scanReport.quotesFixed}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Hyphens to Em-Dash</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                {scanReport.emDashesFixed}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Double Spaces</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                {scanReport.spacesFixed}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Empty Paras</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                {scanReport.emptyParagraphsRemoved}
              </div>
            </div>
          </div>

          {/* Cleaning Rules Checklist */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Cleaning Rules &amp; Typographical Scrub
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.smartQuotes}
                  onChange={() => toggleOption('smartQuotes')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Smart Curly Quotes</div>
                  <div className="text-[10px] text-stone-400">Convert straight "" and '' to curly “ ” and ‘ ’</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.emDashes}
                  onChange={() => toggleOption('emDashes')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Em-Dash Typographics</div>
                  <div className="text-[10px] text-stone-400">Convert double hyphens (--) to proper em-dashes (—)</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.ellipsis}
                  onChange={() => toggleOption('ellipsis')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Proper Ellipsis</div>
                  <div className="text-[10px] text-stone-400">Convert three periods (...) to unicode ellipsis (…)</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.multipleSpaces}
                  onChange={() => toggleOption('multipleSpaces')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Collapse Multiple Spaces</div>
                  <div className="text-[10px] text-stone-400">Replace double and triple spaces with a single space</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.spaceBeforePunctuation}
                  onChange={() => toggleOption('spaceBeforePunctuation')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Space Before Punctuation</div>
                  <div className="text-[10px] text-stone-400">Fix accidental gaps like "word , text ." to "word, text."</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.emptyParagraphs}
                  onChange={() => toggleOption('emptyParagraphs')}
                  className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-stone-200">Purge Empty Paragraphs</div>
                  <div className="text-[10px] text-stone-400">Remove orphaned &lt;p&gt;&lt;/p&gt; and redundant line breaks</div>
                </div>
              </label>
            </div>
          </div>

          {/* Before & After Live Sample Preview */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
              <span>Sample Typography Transformation:</span>
              <span className="text-[10px] text-amber-400 font-mono">Live Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-serif">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80 text-stone-400">
                <span className="text-[10px] font-mono text-stone-500 uppercase font-sans block mb-1">
                  Before Scrub
                </span>
                <p className="text-[11px] leading-relaxed italic">{previewComparison.before}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-900 border border-amber-500/30 text-stone-200">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-sans block mb-1">
                  After Scrub
                </span>
                <p className="text-[11px] leading-relaxed italic">{previewComparison.after}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-medium hover:bg-stone-850 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteClean}
            disabled={hasApplied}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            {hasApplied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Cleaned Successfully!</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 fill-stone-950" />
                <span>
                  Clean Document ({scanReport.totalIssues} Issue{scanReport.totalIssues !== 1 ? 's' : ''})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
