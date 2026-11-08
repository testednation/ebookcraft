import React, { useState, useRef } from 'react';
import { Chapter, CharacterProfile, Book, SectionType } from '../types/book';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { importManuscriptFile } from '../services/fileImporter';
import {
  BookOpen,
  Plus,
  Bookmark,
  FileText,
  Users,
  Upload,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface SidebarNavProps {
  book: Book;
  chapters: Chapter[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: (type?: SectionType) => void;
  onAddPartDivider: () => void;
  onDeleteChapter: (chapterId: string) => void;
  characters: CharacterProfile[];
  onOpenCharacterModal: () => void;
  onImportManuscript: (result: { bookTitle?: string; chapters: Omit<Chapter, 'id' | 'bookId'>[] }) => void;
  onUpdateBookGoals: (goals: { targetWordCount: number; dailyWordGoal: number; resetTodayBaseline?: boolean }) => void;
  onUpdateChapterTarget: (chapterId: string, target: number) => void;
  onOpenWritingVelocity?: () => void;
  onOpenImportModal?: (file?: File) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  book,
  chapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  onAddPartDivider,
  onDeleteChapter,
  characters,
  onOpenCharacterModal,
  onImportManuscript,
  onUpdateBookGoals,
  onUpdateChapterTarget,
  onOpenWritingVelocity,
  onOpenImportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters'>('chapters');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onOpenImportModal) {
      onOpenImportModal(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const result = await importManuscriptFile(file);
      onImportManuscript(result);
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const frontMatter = chapters.filter((c) => c.group === 'front-matter');
  const bodyChapters = chapters.filter((c) => c.group === 'body');
  const backMatter = chapters.filter((c) => c.group === 'back-matter');

  const totalBookWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const targetWordCount = book.targetWordCount || 60000;
  const bookProgressPercent = Math.min(
    100,
    Math.round((totalBookWords / Math.max(1, targetWordCount)) * 100)
  );

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <aside className="w-72 bg-stone-950 border-r border-stone-800 flex flex-col h-full select-none shrink-0 text-stone-300">
      {/* Navigation Tabs: Manuscript Chapters vs Characters */}
      <div className="flex items-center border-b border-stone-800 bg-stone-900/40 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chapters'
              ? 'bg-stone-800 text-stone-100 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Manuscript</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-stone-700/60 text-stone-300">
            {chapters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'characters'
              ? 'bg-stone-800 text-stone-100 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Characters</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-stone-700/60 text-stone-300">
            {characters.length}
          </span>
        </button>
      </div>

      {activeTab === 'chapters' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Toolbar */}
          <div className="p-2 border-b border-stone-800/80 bg-stone-950/60 flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onAddChapter('chapter')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              title="Add Chapter (Ctrl+N)"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Chapter</span>
            </button>

            <button
              onClick={onAddPartDivider}
              className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Add Full-Page Part Divider (Phase 2)"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Part</span>
            </button>

            <button
              onClick={() => (onOpenImportModal ? onOpenImportModal() : fileInputRef.current?.click())}
              disabled={isImporting}
              className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs transition-colors flex items-center justify-center"
              title="Import DOCX, TXT, or Markdown Manuscript"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Chapters Hierarchy List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {/* Front Matter */}
            {frontMatter.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Front Matter
                </div>
                <div className="space-y-1 mt-1">
                  {frontMatter.map((ch) => renderChapterItem(ch))}
                </div>
              </div>
            )}

            {/* Body Matter (Parts & Chapters) */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                <span>Body Chapters</span>
                <span className="text-stone-600 font-mono text-[9px]">{bodyChapters.length} sections</span>
              </div>
              <div className="space-y-1 mt-1">
                {bodyChapters.map((ch) => renderChapterItem(ch))}
              </div>
            </div>

            {/* Back Matter */}
            {backMatter.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Back Matter
                </div>
                <div className="space-y-1 mt-1">
                  {backMatter.map((ch) => renderChapterItem(ch))}
                </div>
              </div>
            )}
          </div>

          {/* Visual Progress Bar beneath Sidebar Navigation */}
          <div className="px-3 pt-2.5 pb-2 border-t border-stone-800/80 bg-stone-950/90 shrink-0">
            <div
              onClick={onOpenWritingVelocity}
              className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 cursor-pointer transition-all group shadow-sm"
              title="Click to open Writing Velocity Dashboard & 30-Day History"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium group-hover:text-amber-300 transition-colors">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Manuscript Goal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                    {bookProgressPercent}%
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>

              {/* Filling Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(bookProgressPercent, 2)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5 text-[10px] text-stone-400 font-mono">
                <span className="text-stone-300 font-medium">{totalBookWords.toLocaleString()} words</span>
                <span className="text-stone-500">of {targetWordCount.toLocaleString()} target</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Concentric Circular Goal Tracker Widget */}
          <div className="p-3 border-t border-stone-800 bg-stone-900/60 shrink-0">
            <GoalTrackerWidget
              book={book}
              chapters={chapters}
              activeChapter={selectedChapter || null}
              onUpdateBookGoals={onUpdateBookGoals}
              onUpdateChapterTarget={onUpdateChapterTarget}
            />
          </div>
        </div>
      ) : (
        /* Characters Bible Tab */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-800/80 bg-stone-950/60 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-stone-400">Cast Profiles</span>
            <button
              onClick={onOpenCharacterModal}
              className="py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Manage</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {characters.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No characters created yet.</p>
                <button
                  onClick={onOpenCharacterModal}
                  className="mt-2 text-amber-400 hover:underline font-medium text-xs inline-block"
                >
                  Create first character &rarr;
                </button>
              </div>
            ) : (
              characters.map((c) => (
                <div
                  key={c.id}
                  onClick={onOpenCharacterModal}
                  className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/80 hover:border-indigo-500/40 hover:bg-stone-850 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200">{c.name}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-medium">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                    {c.physicalTraits || c.bio || 'Profile record'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );

  function renderChapterItem(ch: Chapter) {
    const isSelected = selectedChapterId === ch.id;
    const isPart = ch.type === 'part';

    if (isPart) {
      // High-visibility Part Divider in Sidebar
      return (
        <div
          key={ch.id}
          onClick={() => onSelectChapter(ch.id)}
          className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
            isSelected
              ? 'bg-amber-500/15 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-stone-900/90 border-stone-800/80 hover:border-stone-700 text-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                PART {ch.partNumber ? toRoman(ch.partNumber) : 'DIVIDER'}
              </span>
            </div>
            {chapters.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChapter(ch.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-rose-400 rounded transition-opacity"
                title="Delete Part Divider"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="text-xs font-serif font-bold text-stone-100 mt-0.5 truncate">{ch.title}</div>
        </div>
      );
    }

    // Standard Chapter item
    return (
      <div
        key={ch.id}
        onClick={() => onSelectChapter(ch.id)}
        className={`group relative px-2.5 py-2 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between ${
          isSelected
            ? 'bg-stone-850 text-stone-100 font-medium border border-stone-700/70 shadow-sm'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`} />
          <div className="truncate">
            <div className="text-xs truncate">{ch.title || 'Untitled Chapter'}</div>
            <div className="text-[10px] text-stone-500 font-mono">
              {(ch.wordCount || 0).toLocaleString()} words
              {ch.footnotes && ch.footnotes.length > 0 && ` \u2022 ${ch.footnotes.length} fn`}
            </div>
          </div>
        </div>

        {chapters.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChapter(ch.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-rose-400 rounded transition-opacity shrink-0"
            title="Delete Section"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }
};

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
