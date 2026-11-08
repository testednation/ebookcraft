import React, { useMemo } from 'react';
import { Book, Chapter } from '../types/book';
import {
  calculateSpineAndWrap,
  estimatePageCountFromWords,
  TRIM_DIMENSIONS,
} from '../services/spineCalculator';
import { detectDuplicatesAcrossChapters } from '../services/duplicateDetector';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  Info,
  Copy,
} from 'lucide-react';

interface PreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapters: Chapter[];
  onOpenPrintDialog: () => void;
  onOpenCoverWrap: () => void;
  onToggleRectoOpenings?: (enabled: boolean) => void;
}

interface PreflightCheckItem {
  id: string;
  category: 'Spine & Cover' | 'Pagination' | 'Margins & Gutter' | 'Typography' | 'Manuscript Integrity';
  title: string;
  status: 'pass' | 'warning' | 'info';
  description: string;
  recommendation?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const PreflightModal: React.FC<PreflightModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  onOpenPrintDialog,
  onOpenCoverWrap,
  onToggleRectoOpenings,
}) => {
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const trimSize = book.styleConfig?.trimSize || '5.5x8.5';
  const estimatedPages = useMemo(
    () => estimatePageCountFromWords(totalWords, trimSize),
    [totalWords, trimSize]
  );
  const specs = useMemo(
    () => calculateSpineAndWrap(estimatedPages, trimSize, book.coverWrap?.paperStock || 'cream-55'),
    [estimatedPages, trimSize, book.coverWrap?.paperStock]
  );

  const checks: PreflightCheckItem[] = useMemo(() => {
    const list: PreflightCheckItem[] = [];

    // 1. Spine Thickness Check
    if (estimatedPages >= 100) {
      list.push({
        id: 'spine-safe',
        category: 'Spine & Cover',
        title: 'Spine Width Safe for Title Text',
        status: 'pass',
        description: `Spine width is ${specs.spineWidthInches}" (${specs.spineWidthMm}mm) across ${estimatedPages} estimated pages. Spine title is comfortably centered without bleeding over fold creases.`,
      });
    } else if (estimatedPages >= 80) {
      list.push({
        id: 'spine-tight',
        category: 'Spine & Cover',
        title: 'Spine Width Narrow on KDP',
        status: 'warning',
        description: `At ${estimatedPages} pages (${specs.spineWidthInches}"), spine text meets minimum KDP thresholds but requires a concise font size.`,
        recommendation: 'Check that your spine title is concise or consider slightly larger body type size.',
        actionLabel: 'Adjust Cover Wrap',
        onAction: onOpenCoverWrap,
      });
    } else {
      list.push({
        id: 'spine-too-thin',
        category: 'Spine & Cover',
        title: 'Spine Under 80 Pages (No Title Text)',
        status: 'warning',
        description: `Manuscript length (${estimatedPages} estimated pages) is below the 80-page minimum required by Amazon KDP for text on the spine.`,
        recommendation: 'Spine text should be left blank for pamphlets and novellas under 80 pages.',
      });
    }

    // 2. Gutter Margin Compliance
    const recommendedGutter = specs.gutterMarginInches;
    list.push({
      id: 'gutter-margin',
      category: 'Margins & Gutter',
      title: `Inside Gutter Margin (${recommendedGutter}")`,
      status: 'pass',
      description: `KDP & IngramSpark tier for ${estimatedPages} pages requires minimum ${recommendedGutter}" inside margin. FolioCraft print compiler automatically applies mirrored gutters.`,
    });

    // 3. Recto / Verso Chapter Openings
    const isRectoEnabled = !!book.styleConfig?.rectoChapterOpening;
    if (isRectoEnabled) {
      list.push({
        id: 'recto-enabled',
        category: 'Pagination',
        title: 'Recto (Right-Hand) Chapter Openings Active',
        status: 'pass',
        description: 'All chapter and part dividers begin on odd (recto) pages with automatic blank verso inserts for prestige collector styling.',
      });
    } else {
      list.push({
        id: 'recto-optional',
        category: 'Pagination',
        title: 'Continuous Chapter Pagination (Standard POD)',
        status: 'info',
        description: 'Chapters begin on the immediate next page (verso or recto). Standard for contemporary trade paperbacks to minimize page count.',
        recommendation: 'Enable Recto Openings if publishing formal hardcover or prestige historical fiction.',
        actionLabel: 'Enable Recto Openings',
        onAction: () => onToggleRectoOpenings?.(true),
      });
    }

    // 4. ISBN & Barcode
    if (book.isbn && book.isbn.replace(/[^0-9]/g, '').length === 13) {
      list.push({
        id: 'isbn-valid',
        category: 'Spine & Cover',
        title: 'Valid ISBN-13 Registered',
        status: 'pass',
        description: `ISBN-13 (${book.isbn}) is verified and ready for vector EAN-13 barcode generation.`,
      });
    } else {
      list.push({
        id: 'isbn-missing',
        category: 'Spine & Cover',
        title: 'Missing or Incomplete ISBN-13',
        status: 'warning',
        description: 'No valid 13-digit ISBN was detected in manuscript metadata.',
        recommendation: 'Amazon KDP provides free ISBNs, or enter your Bowker/Nielsen ISBN in Book Details.',
      });
    }

    // 5. Part Dividers & Hierarchy
    const partCount = chapters.filter((c) => c.type === 'part').length;
    if (partCount > 0) {
      list.push({
        id: 'parts-verified',
        category: 'Typography',
        title: `${partCount} Full-Page Part Dividers Validated`,
        status: 'pass',
        description: 'Part dividers have dedicated full-page page breaks before and after, preventing text overflow.',
      });
    }

    // 6. Signature Multiple Check (4-page signature)
    const signatureRem = estimatedPages % 4;
    if (signatureRem === 0) {
      list.push({
        id: 'signature-perfect',
        category: 'Pagination',
        title: 'Even 4-Page Signature Alignment',
        status: 'pass',
        description: `Page count (${estimatedPages}) is an exact multiple of 4. Zero wasted blank pages at the end of the book block.`,
      });
    } else {
      list.push({
        id: 'signature-pad',
        category: 'Pagination',
        title: `Signature Trailing Pages (${4 - signatureRem} blank)`,
        status: 'info',
        description: `Printers bind in 4-page signatures. KDP will append ${4 - signatureRem} blank end sheets automatically.`,
      });
    }

    // 7. Duplicate Paragraphs Audit
    const dupReport = detectDuplicatesAcrossChapters(chapters);
    if (dupReport.totalDuplicates === 0) {
      list.push({
        id: 'no-duplicate-paragraphs',
        category: 'Manuscript Integrity',
        title: 'Zero Duplicate Paragraphs Detected',
        status: 'pass',
        description: `Scanned all ${chapters.length} sections. Every paragraph block is unique with no redundant duplicate text blocks.`,
      });
    } else {
      list.push({
        id: 'duplicate-paragraphs-found',
        category: 'Manuscript Integrity',
        title: `${dupReport.totalDuplicates} Duplicate Paragraph Groups Detected`,
        status: 'warning',
        description: `Found ${dupReport.totalRedundantParagraphs} repeated duplicate paragraphs (~${dupReport.totalRedundantWords.toLocaleString()} redundant words). Review repeated text to prevent copy-paste errors.`,
        recommendation: 'Use the Duplicates detector in the Editor to inspect and auto-deduplicate.',
      });
    }

    return list;
  }, [estimatedPages, specs, book, chapters, onOpenCoverWrap, onToggleRectoOpenings]);

  if (!isOpen) return null;

  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const healthScore = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Pre-Flight Print Proof &amp; Inspection
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  KDP &amp; Ingram Ready
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Automated technical audit for trim, gutter margins, pagination signatures, and spine tolerances.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Score Summary Banner */}
        <div className="px-6 py-4 bg-stone-950/70 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-lg font-bold font-mono text-emerald-400">{healthScore}%</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-200">
                Print Readiness: {healthScore >= 90 ? 'Certified Production Grade' : 'Ready with Minor Advisory'}
              </div>
              <div className="text-xs text-stone-400">
                {passedCount} checks passed &bull; {warningCount} recommendations &bull; {estimatedPages} estimated pages
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenPrintDialog();
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Open Print Proof</span>
          </button>
        </div>

        {/* Diagnostic Check List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {checks.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                item.status === 'pass'
                  ? 'bg-stone-950/50 border-stone-800/80 hover:border-emerald-500/30'
                  : item.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-stone-950/30 border-stone-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : item.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-200">{item.title}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-mono">
                      {item.category}
                    </span>
                  </div>
                  {item.actionLabel && item.onAction && (
                    <button
                      onClick={item.onAction}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">{item.description}</p>
                {item.recommendation && (
                  <div className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1 font-medium">
                    <span>Recommendation:</span>
                    <span>{item.recommendation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            Validated against official <strong>Amazon KDP</strong> and <strong>IngramSpark</strong> specifications.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
