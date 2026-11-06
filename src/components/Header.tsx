import React from 'react';
import {
  BookOpen,
  Sliders,
  Settings,
  Download,
  Eye,
  EyeOff,
  Check,
  Loader2,
  HardDrive,
  Keyboard,
} from 'lucide-react';
import { Book } from '../types/book';

interface HeaderProps {
  book: Book;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
  onOpenStyleModal: () => void;
  onOpenBookDetailsModal: () => void;
  onOpenExportModal: () => void;
  onSaveManual: () => void;
  totalWordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  book,
  saveStatus,
  isPreviewOpen,
  onTogglePreview,
  onOpenStyleModal,
  onOpenBookDetailsModal,
  onOpenExportModal,
  onSaveManual,
  totalWordCount,
}) => {
  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Book Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-lg tracking-wide">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <span className="hidden sm:inline">FolioCraft</span>
        </div>

        <span className="text-neutral-600 hidden sm:inline">/</span>

        <button
          onClick={onOpenBookDetailsModal}
          className="flex items-center gap-2 group px-2 py-1 rounded hover:bg-neutral-800 transition text-left"
          title="Click to edit book metadata"
        >
          <span className="text-sm font-semibold text-neutral-200 group-hover:text-amber-300 truncate max-w-[180px] md:max-w-xs">
            {book.title || 'Untitled Book'}
          </span>
          <span className="text-xs text-neutral-500 hidden md:inline truncate max-w-[120px]">
            by {book.author || 'Author'}
          </span>
        </button>
      </div>

      {/* Persistence & Word Count Status */}
      <div className="flex items-center gap-4 text-xs">
        {/* Word Count & Book Target */}
        <div className="hidden lg:flex items-center gap-1.5 text-neutral-400">
          <span className="font-medium text-neutral-300">{totalWordCount.toLocaleString()}</span>
          <span className="text-neutral-600">/</span>
          <span className="font-mono text-neutral-500">{(book.targetWordCount || 60000).toLocaleString()} words</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 text-amber-400/90 rounded font-mono">
            {Math.min(100, Math.round((totalWordCount / (book.targetWordCount || 60000)) * 100))}%
          </span>
          <span className="text-neutral-600">&bull;</span>
          <span>~{Math.ceil(totalWordCount / 250)} pages</span>
        </div>

        {/* Offline & Save Status Indicator */}
        <button
          onClick={onSaveManual}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 transition"
          title="Click to manually save (Ctrl+S)"
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300 font-medium text-xs">Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-400 text-xs">Saved</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-400 text-xs font-medium">Unsaved</span>
            </>
          )}

          <span className="hidden xl:inline-flex items-center gap-1 ml-1 text-[10px] text-neutral-500 bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-700/50">
            <HardDrive className="w-2.5 h-2.5 text-emerald-500" />
            Offline DB
          </span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Style & Theme Modal */}
        <button
          onClick={onOpenStyleModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition"
          title="Customize Theme, Fonts, Drop Caps & Ornaments"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Styles</span>
        </button>

        {/* Metadata Modal */}
        <button
          onClick={onOpenBookDetailsModal}
          className="p-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition"
          title="Book Details & Auto-Save Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Device Preview */}
        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
            isPreviewOpen
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
          }`}
          title="Toggle Device Preview (Ctrl+P)"
        >
          {isPreviewOpen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">Preview</span>
          <span className="hidden lg:inline text-[10px] text-neutral-500 font-mono">⌘P</span>
        </button>

        {/* Export & Publish Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
