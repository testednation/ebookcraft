import React from 'react';
import { Book } from '../types/book';
import { FocusTimer } from './FocusTimer';
import {
  Feather,
  Sliders,
  BookOpen,
  Download,
  Keyboard,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  RefreshCw,
  Users,
  Layers,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wand2,
} from 'lucide-react';

interface HeaderProps {
  book: Book;
  totalWords: number;
  chapterCount: number;
  isSaving: boolean;
  lastSavedAt: number | null;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenBookDetails: () => void;
  onOpenStyleModal: () => void;
  onOpenExportModal: () => void;
  onOpenShortcuts: () => void;
  onOpenRoadmap: () => void;
  onOpenCharacters: () => void;
  onOpenCoverWrap: () => void;
  onOpenPreflight: () => void;
  onOpenWritingVelocity: () => void;
  onOpenImportModal: () => void;
  onOpenDocumentCleaner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  book,
  totalWords,
  chapterCount,
  isSaving,
  lastSavedAt,
  focusMode,
  onToggleFocusMode,
  onOpenBookDetails,
  onOpenStyleModal,
  onOpenExportModal,
  onOpenShortcuts,
  onOpenRoadmap,
  onOpenCharacters,
  onOpenCoverWrap,
  onOpenPreflight,
  onOpenWritingVelocity,
  onOpenImportModal,
  onOpenDocumentCleaner,
}) => {
  // Estimated reading time at average adult reading speed of 200 words per minute
  const readingTimeMinutes = totalWords > 0 ? Math.ceil(totalWords / 200) : 0;

  return (
    <header className="h-14 border-b border-stone-800 bg-stone-950 px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Branding & Manuscript Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-md">
            <Feather className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm tracking-wide text-stone-100">FolioCraft</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60">
                v2.1
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-sans -mt-0.5">Author Studio</p>
          </div>
        </div>

        <div className="h-4 w-px bg-stone-800 hidden md:block" />

        {/* Current Book Info */}
        <button
          onClick={onOpenBookDetails}
          className="text-left px-2 py-1 rounded-lg hover:bg-stone-900 transition-colors group flex items-center gap-2 max-w-[240px] lg:max-w-xs truncate"
          title={`Click to edit Book Details & Goals (${readingTimeMinutes} min estimated reading time)`}
        >
          <div className="truncate">
            <div className="text-xs font-serif font-semibold text-stone-200 group-hover:text-amber-400 transition-colors truncate">
              {book.title || 'Untitled Book'}
            </div>
            <div className="text-[10px] text-stone-500 truncate flex items-center gap-1">
              <span>by {book.author || 'Anonymous'}</span>
              <span>&bull;</span>
              <span>{totalWords.toLocaleString()} words</span>
              <span>&bull;</span>
              <span className="text-amber-400/90 font-medium">~{readingTimeMinutes}m read</span>
            </div>
          </div>
        </button>

        {/* Reading Time Badge */}
        <div
          className="hidden xl:flex items-center gap-1.5 text-[11px] text-stone-400 bg-stone-900/80 border border-stone-800 px-2.5 py-1 rounded-lg"
          title={`Estimated reading time: ${readingTimeMinutes} minutes (at 200 words per minute)`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-stone-300">
            {readingTimeMinutes} min read
          </span>
        </div>
      </div>

      {/* Center: Save Status & Phase 2 Roadmap Badge */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenRoadmap}
          className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm"
          title="Atticus & Vellum Parity Roadmap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Parity Roadmap</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
            Phase 3
          </span>
        </button>

        {/* Auto-Save Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          {isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="text-stone-400">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved'}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5">
        {/* Full Cover Wrap & Spine (Phase 3) */}
        <button
          onClick={onOpenCoverWrap}
          className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Full Cover Wrap & Spine Calculator (Phase 3)"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-xs">Cover Wrap</span>
        </button>

        {/* Pre-Flight Inspection (Phase 3) */}
        <button
          onClick={onOpenPreflight}
          className="p-2 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Pre-Flight Print Proof Inspection (Phase 3)"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden xl:inline text-xs">Pre-Flight</span>
        </button>

        {/* Import DOCX Manuscript */}
        <button
          onClick={onOpenImportModal}
          className="p-2 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Import DOCX, TXT, or Markdown Manuscript"
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          <span className="hidden xl:inline text-xs">Import DOCX</span>
        </button>

        {/* Clean Document (Typographical Scrub) */}
        <button
          onClick={onOpenDocumentCleaner}
          className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Clean Document (Typographical scrub, smart quotes, em-dashes)"
        >
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-xs">Clean Doc</span>
        </button>

        {/* Writing Velocity (Recharts Dashboard) */}
        <button
          onClick={onOpenWritingVelocity}
          className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Writing Velocity Dashboard & 30-Day Analytics"
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="hidden xl:inline text-xs">Velocity</span>
        </button>

        {/* Characters Bible Drawer button */}
        <button
          onClick={onOpenCharacters}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Characters Bible & Cast"
        >
          <Users className="w-4 h-4" />
          <span className="hidden lg:inline text-xs">Characters</span>
        </button>

        {/* Focus Session Timer (Writing Sprint) */}
        <FocusTimer focusMode={focusMode} onToggleFocusMode={onToggleFocusMode} />

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            focusMode
              ? 'bg-amber-500 text-stone-950 font-semibold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Focus Mode (Ctrl+Shift+F or Ctrl+F)"
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden lg:inline text-xs">{focusMode ? 'Exit Focus' : 'Focus'}</span>
        </button>

        {/* Styling Modal */}
        <button
          onClick={onOpenStyleModal}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors flex items-center gap-1.5 text-xs"
          title="Styling & Typography"
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden xl:inline text-xs">Styling</span>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
          title="Keyboard Shortcuts (Ctrl+K)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="ml-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-100 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
