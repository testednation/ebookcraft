import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoveUp,
  MoveDown,
  Search,
  Sparkles,
  Edit2,
  Send,
  UserCheck,
} from 'lucide-react';
import { Book, Chapter, SectionGroup, SectionType, CharacterProfile, CharacterRole } from '../types/book';
import { GoalTrackerWidget } from './GoalTrackerWidget';

interface SidebarNavProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onAddChapter: (group: SectionGroup, type?: SectionType) => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapter: (id: string, direction: 'up' | 'down') => void;
  // Characters
  characters: CharacterProfile[];
  onOpenCharacterModal: (character?: CharacterProfile) => void;
  onDeleteCharacter: (id: string) => void;
  onInsertCharacterName: (name: string) => void;
  // Goal Tracking
  book: Book;
  onUpdateBookGoals: (goals: { targetWordCount: number; dailyWordGoal: number; resetTodayBaseline?: boolean }) => void;
  onUpdateChapterTarget: (chapterId: string, target: number) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onReorderChapter,
  characters,
  onOpenCharacterModal,
  onDeleteCharacter,
  onInsertCharacterName,
  book,
  onUpdateBookGoals,
  onUpdateChapterTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'manuscript' | 'characters'>('manuscript');

  // Groups toggle state
  const [openGroups, setOpenGroups] = useState<Record<SectionGroup, boolean>>({
    'front-matter': true,
    body: true,
    'back-matter': true,
  });

  // Character search & filter state
  const [charSearch, setCharSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | CharacterRole>('all');
  const [deletingCharId, setDeletingCharId] = useState<string | null>(null);

  const toggleGroup = (group: SectionGroup) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const frontMatterChapters = chapters.filter((c) => c.group === 'front-matter');
  const bodyChapters = chapters.filter((c) => c.group === 'body');
  const backMatterChapters = chapters.filter((c) => c.group === 'back-matter');

  // Filtered characters
  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(charSearch.toLowerCase()) ||
      (char.aliases && char.aliases.toLowerCase().includes(charSearch.toLowerCase())) ||
      char.physicalTraits.toLowerCase().includes(charSearch.toLowerCase()) ||
      (char.occupation && char.occupation.toLowerCase().includes(charSearch.toLowerCase()));
    const matchesRole = roleFilter === 'all' || char.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const renderChapterItem = (chapter: Chapter, index: number, groupList: Chapter[]) => {
    const isActive = chapter.id === activeChapterId;
    const target = chapter.targetWordCount || (chapter.group === 'body' ? 2500 : 500);
    const pct = Math.min(100, Math.round(((chapter.wordCount || 0) / target) * 100));
    const miniRadius = 5;
    const miniCircumference = 2 * Math.PI * miniRadius; // ~31.42
    const miniOffset = miniCircumference - (pct / 100) * miniCircumference;

    return (
      <div
        key={chapter.id}
        onClick={() => onSelectChapter(chapter.id)}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition border ${
          isActive
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-medium shadow-xs'
            : 'border-transparent text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
          <FileText
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? 'text-amber-400' : 'text-neutral-500 group-hover:text-neutral-300'
            }`}
          />
          <div className="truncate">
            <span className="truncate block font-medium">
              {chapter.title || 'Untitled Section'}
            </span>
            {chapter.subtitle && (
              <span className="text-[10px] text-neutral-500 truncate block">
                {chapter.subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Per-chapter progress circular meter */}
          <div
            className="flex items-center gap-1 text-[10px] text-neutral-500 group-hover:hidden"
            title={`Chapter Goal: ${chapter.wordCount || 0} / ${target} words (${pct}%)`}
          >
            <svg className="w-3.5 h-3.5 -rotate-90 transform shrink-0" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="5" stroke="#262626" strokeWidth="2" fill="none" />
              <circle
                cx="8"
                cy="8"
                r="5"
                stroke={pct >= 100 ? '#10b981' : isActive ? '#f59e0b' : '#38bdf8'}
                strokeWidth="2"
                strokeDasharray={miniCircumference}
                strokeDashoffset={miniOffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="font-mono">{chapter.wordCount > 0 ? `${chapter.wordCount}w` : '0w'}</span>
          </div>

          {/* Action buttons on hover */}
          <div className="hidden group-hover:flex items-center gap-0.5">
            {index > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorderChapter(chapter.id, 'up');
                }}
                className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-700/60"
                title="Move section up"
              >
                <MoveUp className="w-3 h-3" />
              </button>
            )}
            {index < groupList.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorderChapter(chapter.id, 'down');
                }}
                className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-700/60"
                title="Move section down"
              >
                <MoveDown className="w-3 h-3" />
              </button>
            )}
            {chapters.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${chapter.title}"?`)) {
                    onDeleteChapter(chapter.id);
                  }
                }}
                className="p-1 hover:text-red-400 text-neutral-400 rounded hover:bg-neutral-700/60 ml-0.5"
                title="Delete section"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (
    groupKey: SectionGroup,
    title: string,
    list: Chapter[],
    defaultType: SectionType
  ) => {
    const isOpen = openGroups[groupKey];
    const totalWords = list.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 select-none">
          <button
            onClick={() => toggleGroup(groupKey)}
            className="flex items-center gap-1.5 hover:text-neutral-200 transition"
          >
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>{title}</span>
            <span className="text-[10px] text-neutral-500 font-normal normal-case">
              ({list.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onAddChapter(groupKey, defaultType)}
            className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition"
            title={`Add new ${title} section (Ctrl+N)`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOpen && (
          <div className="space-y-0.5 pl-1.5 border-l border-neutral-800/80 ml-2">
            {list.map((ch, idx) => renderChapterItem(ch, idx, list))}
            {list.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-neutral-500 italic">No sections</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full select-none shrink-0 text-neutral-200">
      {/* Top Tab Switcher: Manuscript vs Characters */}
      <div className="p-2 border-b border-neutral-800 bg-neutral-950/40">
        <div className="grid grid-cols-2 p-0.5 bg-neutral-900 rounded-lg border border-neutral-800">
          <button
            onClick={() => setActiveTab('manuscript')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'manuscript'
                ? 'bg-neutral-800 text-amber-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manuscript</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition relative ${
              activeTab === 'characters'
                ? 'bg-neutral-800 text-amber-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Characters</span>
            {characters.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded-full font-mono">
                {characters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'manuscript' ? (
          <div>
            {renderGroup('front-matter', 'Front Matter', frontMatterChapters, 'title-page')}
            {renderGroup('body', 'Body Chapters', bodyChapters, 'chapter')}
            {renderGroup('back-matter', 'Back Matter', backMatterChapters, 'about-author')}
          </div>
        ) : (
          /* Characters View */
          <div className="space-y-3">
            {/* Header & Add Button */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Dramatis Personae
                </h3>
                <p className="text-[10px] text-neutral-500">
                  {filteredCharacters.length} character{filteredCharacters.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenCharacterModal()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-md transition shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                placeholder="Search characters or traits..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-7 pr-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {(['all', 'protagonist', 'antagonist', 'supporting', 'minor'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition ${
                    roleFilter === r
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-transparent'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Characters List */}
            <div className="space-y-2 pt-1">
              {filteredCharacters.map((char) => {
                const isConfirmingDelete = deletingCharId === char.id;

                return (
                  <div
                    key={char.id}
                    className="group bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700/80 rounded-lg p-2.5 transition relative space-y-1.5"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Avatar Badge */}
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-neutral-950 shrink-0"
                          style={{ backgroundColor: char.color || '#f59e0b' }}
                        >
                          {char.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-white leading-tight">
                            {char.name}
                          </h4>
                          {char.occupation && (
                            <span className="text-[10px] text-neutral-400 block leading-tight">
                              {char.occupation}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role Pill */}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                          char.role === 'protagonist'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : char.role === 'antagonist'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {char.role}
                      </span>
                    </div>

                    {/* Physical Traits Snippet */}
                    {char.physicalTraits && (
                      <div className="text-[10.5px] text-neutral-400 line-clamp-2 leading-relaxed bg-neutral-900/60 p-1.5 rounded border border-neutral-800/50">
                        <span className="text-neutral-500 font-medium">Traits: </span>
                        {char.physicalTraits}
                      </div>
                    )}

                    {/* Bio Snippet if no traits */}
                    {!char.physicalTraits && char.bio && (
                      <div className="text-[10.5px] text-neutral-400 line-clamp-2 leading-relaxed bg-neutral-900/60 p-1.5 rounded border border-neutral-800/50">
                        {char.bio}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-[10px]">
                      {/* One-Click Insert into manuscript */}
                      <button
                        type="button"
                        onClick={() => onInsertCharacterName(char.name)}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium hover:underline py-0.5"
                        title={`Insert "${char.name}" into current chapter`}
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Insert Name</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenCharacterModal(char)}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Edit character profile"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-950/80 px-1 py-0.5 rounded border border-red-800">
                            <span className="text-[9px] text-red-300">Confirm?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCharacter(char.id);
                                setDeletingCharId(null);
                              }}
                              className="text-red-200 hover:text-white font-bold px-1"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCharId(null)}
                              className="text-neutral-400 hover:text-neutral-200 px-1"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingCharId(char.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800"
                            title="Delete character"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredCharacters.length === 0 && (
                <div className="text-center py-8 px-3 border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs">
                  <Users className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                  <p className="font-medium text-neutral-400">No characters found</p>
                  <p className="text-[11px] mt-1 text-neutral-500">
                    Add character profiles to reference traits while writing.
                  </p>
                  <button
                    onClick={() => onOpenCharacterModal()}
                    className="mt-3 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded text-xs transition"
                  >
                    + Add First Character
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Circular Goal Tracking Dashboard */}
      <GoalTrackerWidget
        book={book}
        chapters={chapters}
        activeChapter={chapters.find((c) => c.id === activeChapterId) || null}
        onUpdateBookGoals={onUpdateBookGoals}
        onUpdateChapterTarget={onUpdateChapterTarget}
      />

      {/* Footer / Shortcuts Help */}
      <div className="p-2.5 border-t border-neutral-800 bg-neutral-950/60 text-[10px] text-neutral-500 flex items-center justify-between">
        <span className="truncate">Ctrl+N: New Section</span>
        <span className="truncate">Ctrl+P: Preview</span>
      </div>
    </aside>
  );
};
