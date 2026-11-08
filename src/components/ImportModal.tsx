import React, { useState, useRef } from 'react';
import { Chapter, SectionType } from '../types/book';
import {
  importManuscriptFile,
  ImportResult,
} from '../services/fileImporter';
import {
  autoDeduplicateContent,
} from '../services/duplicateDetector';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (imported: {
    bookTitle?: string;
    chapters: Omit<Chapter, 'id' | 'bookId'>[];
    mode: 'append' | 'replace';
  }) => void;
  preloadedFile?: File | null;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  preloadedFile,
}) => {
  const [file, setFile] = useState<File | null>(preloadedFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // User import options
  const [autoDeduplicate, setAutoDeduplicate] = useState(true);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [selectedChapterIndices, setSelectedChapterIndices] = useState<number[]>([]);
  const [showDuplicatesList, setShowDuplicatesList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If a preloaded file was passed in, process it immediately
  React.useEffect(() => {
    if (preloadedFile && isOpen) {
      setFile(preloadedFile);
      processFile(preloadedFile);
    }
  }, [preloadedFile, isOpen]);

  const processFile = async (inputFile: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await importManuscriptFile(inputFile);
      setImportResult(res);
      // Select all chapters by default
      setSelectedChapterIndices(res.chapters.map((_, i) => i));
    } catch (err) {
      console.error('Import processing error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse manuscript file.');
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };

  const toggleChapterSelection = (index: number) => {
    setSelectedChapterIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectAll = () => {
    if (!importResult) return;
    setSelectedChapterIndices(importResult.chapters.map((_, i) => i));
  };

  const deselectAll = () => {
    setSelectedChapterIndices([]);
  };

  const handleExecuteImport = () => {
    if (!importResult) return;

    let chaptersToImport = importResult.chapters.filter((_, idx) =>
      selectedChapterIndices.includes(idx)
    );

    // Apply auto-deduplication if checked
    if (autoDeduplicate) {
      chaptersToImport = chaptersToImport.map((ch) => {
        const { newContent } = autoDeduplicateContent(ch.content);
        return {
          ...ch,
          content: newContent,
        };
      });
    }

    onConfirmImport({
      bookTitle: importResult.bookTitle,
      chapters: chaptersToImport,
      mode: importMode,
    });

    onClose();
    // Reset state
    setFile(null);
    setImportResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100 flex items-center gap-2">
                <span>Import Manuscript (.docx, .txt, .md)</span>
              </h2>
              <p className="text-xs text-stone-400">
                Atticus & Vellum-grade DOCX parser with automatic duplicate paragraph detection
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
          {/* File Upload Zone */}
          {!importResult && !isProcessing && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-700 hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-stone-950/40 hover:bg-stone-950/80"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-200">
                Choose a manuscript or drag & drop here
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                Supports Microsoft Word <strong>.docx</strong> (with bold, italics, headings, scene breaks), Markdown <strong>.md</strong>, and plain text <strong>.txt</strong>.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700 transition-colors">
                Browse Files
              </div>
            </div>
          )}

          {/* Loading state */}
          {isProcessing && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <div className="text-sm font-semibold text-stone-200">Analyzing Manuscript & XML Runs...</div>
              <p className="text-xs text-stone-400 mt-1">
                Parsing chapters, part dividers, formatting, and scanning for duplicate paragraphs
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">Import Error</div>
                <div>{errorMsg}</div>
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setImportResult(null);
                  }}
                  className="mt-2 text-rose-400 underline font-medium"
                >
                  Try another file
                </button>
              </div>
            </div>
          )}

          {/* Parsed Result Display */}
          {importResult && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-stone-200">{importResult.fileName}</span>
                    <span className="text-stone-500 text-[11px] ml-2 font-mono">
                      ({(importResult.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportResult(null);
                    setFile(null);
                  }}
                  className="text-stone-400 hover:text-stone-200 hover:underline text-xs"
                >
                  Change file
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Total Words
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {importResult.detectedWordCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Sections Found
                  </div>
                  <div className="text-lg font-bold font-mono text-stone-200 mt-0.5">
                    {importResult.chapters.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Duplicate Paragraphs
                  </div>
                  <div
                    className={`text-lg font-bold font-mono mt-0.5 ${
                      importResult.duplicateReport.totalDuplicates > 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {importResult.duplicateReport.totalDuplicates}
                  </div>
                </div>
              </div>

              {/* Duplicate Paragraphs Detection Warning / Status Card */}
              {importResult.duplicateReport.totalDuplicates > 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-300">
                          Duplicate Paragraphs Detected ({importResult.duplicateReport.totalDuplicates} clusters)
                        </div>
                        <p className="text-stone-300 text-[11px] mt-0.5">
                          Found {importResult.duplicateReport.totalRedundantParagraphs} repeated paragraph blocks (~{importResult.duplicateReport.totalRedundantWords.toLocaleString()} redundant words).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDuplicatesList(!showDuplicatesList)}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{showDuplicatesList ? 'Hide' : 'Review'}</span>
                      {showDuplicatesList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Auto-Deduplicate Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer bg-stone-950/60 p-2.5 rounded-lg border border-amber-500/20 text-stone-200">
                    <input
                      type="checkbox"
                      checked={autoDeduplicate}
                      onChange={(e) => setAutoDeduplicate(e.target.checked)}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-500/30"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-stone-200">
                        Auto-deduplicate on import (Recommended)
                      </span>
                      <p className="text-[10px] text-stone-400">
                        Keeps the first occurrence of each paragraph and strips subsequent copies.
                      </p>
                    </div>
                  </label>

                  {/* Collapsible Duplicates Inspector */}
                  {showDuplicatesList && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {importResult.duplicateReport.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-stone-400">
                            <span className="font-semibold text-amber-400">
                              Repeated {item.duplicateCount} times ({item.wordCount} words)
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {item.occurrences.map((o) => o.chapterTitle).join(', ')}
                            </span>
                          </div>
                          <p className="text-stone-300 italic line-clamp-2">
                            "{item.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold">Zero duplicate paragraphs detected.</span>
                    <span className="text-stone-400 ml-1">The imported manuscript text is clean and unique.</span>
                  </div>
                </div>
              )}

              {/* Chapters Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-stone-300">
                    Chapters to Import ({selectedChapterIndices.length} of {importResult.chapters.length} selected)
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={selectAll}
                      className="text-amber-400 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-stone-600">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-stone-400 hover:underline"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="border border-stone-800 rounded-xl divide-y divide-stone-800/80 max-h-52 overflow-y-auto bg-stone-950/60">
                  {importResult.chapters.map((ch, idx) => {
                    const isSelected = selectedChapterIndices.includes(idx);
                    const isPart = ch.type === 'part';
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChapterSelection(idx)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-stone-900/50 hover:bg-stone-850' : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className="rounded border-stone-700 text-amber-500 focus:ring-0"
                          />
                          {isPart ? (
                            <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          )}
                          <span className="font-medium text-stone-200 truncate">
                            {ch.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 shrink-0">
                            {ch.type}
                          </span>
                        </div>

                        <div className="text-stone-400 font-mono text-[11px] shrink-0">
                          {ch.wordCount.toLocaleString()} words
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Import Destination Options */}
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-2">
                <span className="font-semibold text-stone-300">Import Mode</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-amber-500 focus:ring-0"
                    />
                    <span className="text-stone-200">Append to current manuscript</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-500 focus:ring-0"
                    />
                    <span className="text-rose-300">Replace current book contents</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-medium hover:bg-stone-850 transition-colors"
          >
            Cancel
          </button>

          {importResult && (
            <button
              onClick={handleExecuteImport}
              disabled={selectedChapterIndices.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                Import {selectedChapterIndices.length} Section{selectedChapterIndices.length !== 1 ? 's' : ''}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
