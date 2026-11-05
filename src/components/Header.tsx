import React from 'react';
import { BookOpen, Sliders, Settings, Download, Plus, Sparkles } from 'lucide-react';
import { BookProject } from '../types/book';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

interface HeaderProps {
  currentBook: BookProject;
  allBooks: BookProject[];
  onSelectBook: (bookId: string) => void;
  onNewBook: () => void;
  onOpenThemes: () => void;
  onOpenDetails: () => void;
  onOpenExport: () => void;
  totalWordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentBook,
  allBooks,
  onSelectBook,
  onNewBook,
  onOpenThemes,
  onOpenDetails,
  onOpenExport,
  totalWordCount,
}) => {
  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800/80 px-4 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Wordmark & Book Selector */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-base tracking-tight text-white font-serif">
            FolioCraft
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        <div className="flex items-center gap-2">
          <select
            value={currentBook.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="text-xs bg-neutral-900 border border-neutral-700/80 text-neutral-200 rounded-md px-2.5 py-1 max-w-[200px] truncate focus:outline-none focus:border-amber-500"
          >
            {allBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          <button
            onClick={onNewBook}
            title="Create New Book Project"
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Zone 2: Studio Tools & Wordcount */}
      <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-400">
        <button
          onClick={onOpenThemes}
          className="flex items-center gap-1.5 hover:text-neutral-100 transition whitespace-nowrap shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Book Theme & Styles</span>
        </button>

        <button
          onClick={onOpenDetails}
          className="flex items-center gap-1.5 hover:text-neutral-100 transition whitespace-nowrap shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Metadata & Trim</span>
        </button>

        <div className="flex items-center gap-2 text-neutral-400">
          <span className="font-mono tabular-nums text-neutral-300 font-semibold">{totalWordCount.toLocaleString()}</span>
          <span>words</span>
          <span aria-hidden="true">·</span>
          <span>~{Math.max(1, Math.ceil(totalWordCount / 250))} pages</span>
        </div>
      </div>

      {/* Zone 3: Actions & Offline Status */}
      <div className="flex items-center gap-3 shrink-0">
        <OfflineIndicator />
        <PWAInstallButton />

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition shadow-sm active:scale-98"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Book</span>
        </button>
      </div>
    </header>
  );
};
