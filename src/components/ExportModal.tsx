import React, { useState } from 'react';
import {
  X,
  Download,
  Book,
  Printer,
  FileCode,
  FileArchive,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Book as BookType, Chapter, CharacterProfile } from '../types/book';
import { generateEpubBlob } from '../services/epubCompiler';
import { openPrintDialog } from '../services/printCompiler';
import { exportFullBackupJSON, importFullBackupJSON } from '../services/storage';
import { importTextOrMarkdownFile } from '../services/fileImporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookType;
  chapters: Chapter[];
  characters: CharacterProfile[];
  onImportBackup: (imported: { book: BookType; chapters: Chapter[]; characters: CharacterProfile[] }) => void;
  onImportChapters: (newChapters: Chapter[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  characters,
  onImportBackup,
  onImportChapters,
}) => {
  const [isExportingEpub, setIsExportingEpub] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Export EPUB 3
  const handleExportEpub = async () => {
    try {
      setIsExportingEpub(true);
      const blob = await generateEpubBlob(book, chapters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(book.title || 'book').replace(/[^a-zA-Z0-9_-]/g, '_')}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('success', 'EPUB 3 compiled successfully!');
    } catch (err: any) {
      showNotice('error', `EPUB generation failed: ${err.message}`);
    } finally {
      setIsExportingEpub(false);
    }
  };

  // 2. Print-Ready PDF
  const handleExportPrint = () => {
    try {
      openPrintDialog(book, chapters);
      showNotice('success', 'Print dialogue opened. Select "Save as PDF" in your print destination.');
    } catch (err: any) {
      showNotice('error', `Failed to open print preview: ${err.message}`);
    }
  };

  // 3. Export Markdown / Text
  const handleExportMarkdown = () => {
    try {
      let combined = `# ${book.title}\n`;
      if (book.subtitle) combined += `*${book.subtitle}*\n`;
      combined += `**Author:** ${book.author}\n\n---\n\n`;

      chapters.forEach((ch) => {
        combined += `## ${ch.title}\n`;
        if (ch.subtitle) combined += `*${ch.subtitle}*\n\n`;
        // Strip basic HTML to text paragraphs
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ch.content;
        const textContent = tempDiv.innerText || tempDiv.textContent || '';
        combined += `${textContent}\n\n---\n\n`;
      });

      const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(book.title || 'manuscript').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('success', 'Markdown manuscript downloaded!');
    } catch (err: any) {
      showNotice('error', `Markdown export failed: ${err.message}`);
    }
  };

  // 4. Export JSON Full Project Backup
  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportFullBackupJSON(book.id);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(book.title || 'project').replace(/[^a-zA-Z0-9_-]/g, '_')}_backup.foliocraft.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotice('success', 'Project backup exported with all chapters & characters!');
    } catch (err: any) {
      showNotice('error', `Backup failed: ${err.message}`);
    }
  };

  // Import JSON Backup File
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const restored = await importFullBackupJSON(text);
        onImportBackup(restored);
        showNotice('success', 'Project backup successfully restored!');
      } catch (err: any) {
        showNotice('error', `Failed to restore backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import Markdown / Text Chapter File
  const handleImportManuscriptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newChapters = await importTextOrMarkdownFile(file, book.id, chapters.length + 1);
      onImportChapters(newChapters);
      showNotice('success', `Imported ${newChapters.length} chapter(s) from ${file.name}!`);
    } catch (err: any) {
      showNotice('error', `Import failed: ${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Publish, Export &amp; Backup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice banner */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Main Publishing Formats */}
          <div>
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Distribution Formats
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* EPUB 3 */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between hover:border-neutral-700 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Book className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-sm text-white">EPUB 3 Publication</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Reflowable standard EPUB with embedded styling, automated Table of Contents, and custom fleurons. Ready for Amazon KDP, Apple Books, and Kobo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportEpub}
                  disabled={isExportingEpub}
                  className="mt-4 w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isExportingEpub ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling EPUB...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .epub</span>
                    </>
                  )}
                </button>
              </div>

              {/* Print-Ready PDF */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between hover:border-neutral-700 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-sm text-white">Print-Ready PDF</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Formatted for physical paperback &amp; hardcover printing. Mirrored margins, running headers, and trim size ({book.styleConfig?.trimSize || '5.5x8.5'}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPrint}
                  className="mt-4 w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-md transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Print Dialog</span>
                </button>
              </div>
            </div>
          </div>

          {/* Raw Text & Backups */}
          <div className="pt-3 border-t border-neutral-800">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Manuscript Files &amp; Full Backups
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Markdown Export */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-neutral-200 block">Clean Markdown (.md)</span>
                  <span className="text-[10px] text-neutral-500">
                    Export all chapters in plain markdown format.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition"
                  title="Download Markdown"
                >
                  <FileCode className="w-4 h-4" />
                </button>
              </div>

              {/* Project JSON Backup */}
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-neutral-200 block">FolioCraft Project Backup</span>
                  <span className="text-[10px] text-neutral-500">
                    Includes all chapters, styles &amp; characters.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition"
                  title="Download JSON Project Backup"
                >
                  <FileArchive className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="pt-3 border-t border-neutral-800">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Import Content
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Restore Backup */}
              <label className="bg-neutral-950/60 border border-dashed border-neutral-700 hover:border-amber-500/80 rounded-lg p-3.5 flex items-center gap-3 cursor-pointer transition">
                <Upload className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-medium text-neutral-200 block">Restore Project Backup</span>
                  <span className="text-[10px] text-neutral-500">Upload .foliocraft.json file</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </label>

              {/* Import Text / Markdown */}
              <label className="bg-neutral-950/60 border border-dashed border-neutral-700 hover:border-amber-500/80 rounded-lg p-3.5 flex items-center gap-3 cursor-pointer transition">
                <FileCode className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-medium text-neutral-200 block">Import Chapters</span>
                  <span className="text-[10px] text-neutral-500">Upload .md, .txt manuscript</span>
                </div>
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={handleImportManuscriptFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
