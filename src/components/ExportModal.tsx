import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  BookOpen, 
  Printer, 
  Code, 
  Archive, 
  UploadCloud, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { BookProject, BookSection, TRIM_SIZES } from '../types/book';
import { generateEpub, downloadBlob } from '../services/epubCompiler';
import { openPrintDialog, exportHtmlFile, exportMarkdownFile } from '../services/printCompiler';
import { exportProjectBackup, importProjectBackup } from '../services/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookProject;
  sections: BookSection[];
  onProjectRestored: (restoredBook: BookProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  book,
  sections,
  onProjectRestored,
}) => {
  const [isExportingEpub, setIsExportingEpub] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const trim = TRIM_SIZES.find((t) => t.id === book.trimSize) || TRIM_SIZES[2];

  const handleExportEpub = async () => {
    try {
      setIsExportingEpub(true);
      const blob = await generateEpub(book, sections);
      const filename = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.epub`;
      downloadBlob(blob, filename);
      setSuccessMessage('EPUB 3 file generated and downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(`EPUB export error: ${(err as Error).message}`);
    } finally {
      setIsExportingEpub(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportProjectBackup(book.id);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Backup.foliocraft.json`;
      downloadBlob(blob, filename);
      setSuccessMessage('Full project backup archive downloaded!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert(`Backup error: ${(err as Error).message}`);
    }
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const restored = await importProjectBackup(text);
      onProjectRestored(restored);
      setSuccessMessage(`Restored "${restored.title}" successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      alert(`Restore failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Publish & Export Center</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Primary Option 1: EPUB 3 */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/80 transition flex items-center justify-between gap-4 group">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                  EPUB 3 eBook Package (.epub)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Universal standard for Amazon Kindle, Apple Books, Kobo, and Google Play. Includes embedded styles, TOC, and metadata.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportEpub}
              disabled={isExportingEpub}
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExportingEpub ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export EPUB</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Option 2: Print PDF */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/80 transition flex items-center justify-between gap-4 group">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                  Print-Ready PDF via Browser Print ({trim.name})
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Formats entire book with exact {trim.widthInches}"×{trim.heightInches}" trim size, inner gutter margins, verso/recto running headers, and page folios. Select "Save as PDF".
                </p>
              </div>
            </div>

            <button
              onClick={() => openPrintDialog(book, sections)}
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition shrink-0 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print to PDF</span>
            </button>
          </div>

          {/* Secondary Formats: HTML & Markdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Clean HTML Edition</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Standalone file with CSS</div>
              </div>
              <button
                onClick={() => exportHtmlFile(book, sections)}
                className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700"
              >
                Download
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Markdown Manuscript</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Clean .md with frontmatter</div>
              </div>
              <button
                onClick={() => exportMarkdownFile(book, sections)}
                className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700"
              >
                Download
              </button>
            </div>
          </div>

          {/* Backup & Project Archive */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="p-3.5 rounded-lg bg-neutral-950/40 border border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-neutral-400" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">Full Project Backup & Restore</div>
                  <div className="text-[11px] text-neutral-400">Save all chapters, styling, and metadata to JSON archive</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={restoreInputRef}
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleRestoreBackup(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => restoreInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition"
                  title="Restore Project Archive"
                >
                  <UploadCloud className="w-3.5 h-3.5 inline mr-1" />
                  Restore
                </button>

                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 rounded transition"
                >
                  Backup JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>All exports are generated hermetically and offline in your browser.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
