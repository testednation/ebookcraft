import React, { useState } from 'react';
import { Book, Chapter } from '../types/book';
import { generateEpubBlob } from '../services/epubCompiler';
import { generateDocxBlob } from '../services/docxCompiler';
import { compilePrintReadyHtml } from '../services/printCompiler';
import { X, Download, FileText, BookOpen, FileCode, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapters: Chapter[];
  onOpenCoverWrap?: () => void;
  onOpenPreflight?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  onOpenCoverWrap,
  onOpenPreflight,
}) => {
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportEpub = async () => {
    try {
      setExportingType('epub');
      const blob = await generateEpubBlob(book, chapters);
      const safeTitle = (book.title || 'Manuscript').replace(/[^a-zA-Z0-9_-]/g, '_');
      triggerDownload(blob, `${safeTitle}.epub`);
      setSuccessMessage('EPUB 3 compiled successfully! Validated for Kindle, Apple Books, and Kobo.');
    } catch (err) {
      console.error(err);
      alert('Failed to generate EPUB: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExportingType(null);
    }
  };

  const handleExportDocx = async () => {
    try {
      setExportingType('docx');
      const blob = await generateDocxBlob(book, chapters);
      const safeTitle = (book.title || 'Manuscript').replace(/[^a-zA-Z0-9_-]/g, '_');
      triggerDownload(blob, `${safeTitle}.docx`);
      setSuccessMessage('Word (.docx) compiled successfully with native headings, part dividers, and footnotes!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate DOCX: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPrintPdf = () => {
    try {
      setExportingType('pdf');
      const html = compilePrintReadyHtml(book, chapters);
      // Open print preview in an iframe or dedicated printable window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        // Give fonts a moment to layout
        setTimeout(() => {
          printWindow.print();
        }, 800);
        setSuccessMessage('Print document prepared! Use &quot;Save as PDF&quot; in the print dialog for KDP/Ingram.');
      } else {
        // Fallback to downloading HTML file if popup is blocked
        const blob = new Blob([html], { type: 'text/html' });
        const safeTitle = (book.title || 'Manuscript').replace(/[^a-zA-Z0-9_-]/g, '_');
        triggerDownload(blob, `${safeTitle}_print_ready.html`);
        setSuccessMessage('Print layout downloaded as HTML file. Open in Chrome and choose Print -> Save as PDF.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to compile print layout: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">Export Published Book</h2>
              <p className="text-xs text-stone-400">
                Industry-standard files ready for Kindle Direct Publishing, Apple Books, IngramSpark &amp; Editors.
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* EPUB 3 */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 flex flex-col justify-between transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-stone-200 mb-1">EPUB 3 eBook</h3>
                <p className="text-[11px] text-stone-400 mb-3">
                  Reflowable eBook standard for Apple Books, Amazon KDP, Kobo, Barnes &amp; Noble Nook.
                </p>
                <div className="text-[10px] text-stone-500 space-y-0.5 mb-4">
                  <div>&bull; EPUB 3 popup footnotes</div>
                  <div>&bull; Full-page part dividers</div>
                  <div>&bull; Drop caps &amp; fleuron glyphs</div>
                </div>
              </div>
              <button
                onClick={handleExportEpub}
                disabled={!!exportingType}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {exportingType === 'epub' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download EPUB</span>
                  </>
                )}
              </button>
            </div>

            {/* Print-Ready PDF */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 hover:border-indigo-500/40 flex flex-col justify-between transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-stone-200 mb-1">Print-Ready PDF</h3>
                <p className="text-[11px] text-stone-400 mb-3">
                  Typeset for print-on-demand with exact trim size ({book.styleConfig?.trimSize || '5.5x8.5'}).
                </p>
                <div className="text-[10px] text-stone-500 space-y-0.5 mb-4">
                  <div>&bull; Mirrored inner/outer margins</div>
                  <div>&bull; Running headers &amp; page numbers</div>
                  <div>&bull; Bottom-of-page running notes</div>
                </div>
              </div>
              <button
                onClick={handleExportPrintPdf}
                disabled={!!exportingType}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-stone-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {exportingType === 'pdf' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Typesetting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate Print PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Microsoft Word .docx */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 hover:border-blue-500/40 flex flex-col justify-between transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-semibold text-sm text-stone-200">Word (.docx)</h3>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                    Phase 2
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mb-3">
                  Styled manuscript for literary agents, proofreaders, and developmental editors.
                </p>
                <div className="text-[10px] text-stone-500 space-y-0.5 mb-4">
                  <div>&bull; Native Word styles (H1, Body)</div>
                  <div>&bull; Linked XML footnotes</div>
                  <div>&bull; Part divider page breaks</div>
                </div>
              </div>
              <button
                onClick={handleExportDocx}
                disabled={!!exportingType}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-stone-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {exportingType === 'docx' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Packaging...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download DOCX</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Phase 3 Tools Banner: Cover Wrap & Pre-Flight Inspection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div
              onClick={() => {
                onClose();
                onOpenCoverWrap?.();
              }}
              className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 to-stone-900 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors">
                    Full Cover Wrap &amp; Spine
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    Phase 3
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Design back cover, barcode &amp; spine width with KDP spine physics.
                </p>
              </div>
              <span className="text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform font-bold">&rarr;</span>
            </div>

            <div
              onClick={() => {
                onClose();
                onOpenPreflight?.();
              }}
              className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-stone-900 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-200 group-hover:text-emerald-300 transition-colors">
                    Pre-Flight Inspection
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    Phase 3
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Verify gutter margins, bleed, recto openings &amp; printer signature math.
                </p>
              </div>
              <span className="text-xs text-emerald-400 group-hover:translate-x-0.5 transition-transform font-bold">&rarr;</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Files are packaged locally in your browser with zero latency.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
