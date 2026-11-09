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
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  FolderInput,
  ArrowRight,
  Check,
  CheckSquare,
  Square,
  CornerDownRight,
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
  onOpenBackmatterModal?: () => void;
  onCloseMobile?: () => void;
  onReorderChapters?: (reorderedChapters: Chapter[]) => void;
}

interface PartGroup {
  partDivider: Chapter | null;
  partNumber: number | null;
  title: string;
  chapters: Chapter[];
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
  onOpenBackmatterModal,
  onCloseMobile,
  onReorderChapters,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters'>('chapters');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chapter Reordering Mode State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'into-part' | null>(null);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [reorderToast, setReorderToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setReorderToast(msg);
    setTimeout(() => setReorderToast(null), 2500);
  };

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

  const availableParts = bodyChapters.filter((c) => c.type === 'part');

  const totalBookWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const targetWordCount = book.targetWordCount || 60000;
  const bookProgressPercent = Math.min(
    100,
    Math.round((totalBookWords / Math.max(1, targetWordCount)) * 100)
  );

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  // Compute Part Groups in body chapters for visual clarity & block moving
  const partGroups: PartGroup[] = [];
  let currentGroup: PartGroup = {
    partDivider: null,
    partNumber: null,
    title: 'Opening Sections',
    chapters: [],
  };

  for (const ch of bodyChapters) {
    if (ch.type === 'part') {
      if (currentGroup.chapters.length > 0 || currentGroup.partDivider) {
        partGroups.push(currentGroup);
      }
      currentGroup = {
        partDivider: ch,
        partNumber: ch.partNumber || partGroups.length + 1,
        title: ch.title || `Part ${toRoman(ch.partNumber || partGroups.length + 1)}`,
        chapters: [],
      };
    } else {
      currentGroup.chapters.push(ch);
    }
  }
  if (currentGroup.chapters.length > 0 || currentGroup.partDivider) {
    partGroups.push(currentGroup);
  }

  // Helper to re-index all chapters sequentially and update Part Numbers
  const normalizeAndApplyChapters = (newChapters: Chapter[]) => {
    let currentOrder = 1;
    let partIdx = 1;
    const reindexed = newChapters.map((ch) => {
      const updated = { ...ch, order: currentOrder++ };
      if (updated.type === 'part') {
        updated.partNumber = partIdx;
        updated.subtitle = `Part ${toRoman(partIdx)} Divider`;
        partIdx++;
      }
      return updated;
    });
    onReorderChapters?.(reindexed);
    return reindexed;
  };

  // Toggle selection of a chapter for block operations
  const toggleSelectBlock = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(selectedBlockIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedBlockIds(next);
  };

  // Move a block of chapters to a specific Part divider or position
  const handleMoveBlockToPart = (targetPartId: string | 'before-parts' | 'end-of-body') => {
    if (selectedBlockIds.size === 0) return;
    const blockList = chapters.filter((c) => selectedBlockIds.has(c.id));
    const remaining = chapters.filter((c) => !selectedBlockIds.has(c.id));

    let targetIndex: number;
    if (targetPartId === 'before-parts') {
      const firstBodyIdx = remaining.findIndex((c) => c.group === 'body');
      targetIndex = firstBodyIdx !== -1 ? firstBodyIdx : remaining.length;
    } else if (targetPartId === 'end-of-body') {
      const backMatterIdx = remaining.findIndex((c) => c.group === 'back-matter');
      targetIndex = backMatterIdx !== -1 ? backMatterIdx : remaining.length;
    } else {
      const partIdx = remaining.findIndex((c) => c.id === targetPartId);
      if (partIdx === -1) return;
      targetIndex = partIdx + 1; // insert immediately after the part divider
    }

    const updatedBlock = blockList.map((c) => ({
      ...c,
      group: 'body' as const,
    }));

    const newChapters = [
      ...remaining.slice(0, targetIndex),
      ...updatedBlock,
      ...remaining.slice(targetIndex),
    ];

    normalizeAndApplyChapters(newChapters);
    setSelectedBlockIds(new Set());
    setShowMoveDropdown(false);

    const partObj = availableParts.find((p) => p.id === targetPartId);
    const destName = partObj ? `Part ${toRoman(partObj.partNumber || 1)}` : 'target section';
    showToast(`Moved ${blockList.length} ${blockList.length === 1 ? 'chapter' : 'chapters'} to ${destName}`);
  };

  // Move single item one step up or down
  const handleMoveStep = (chapterId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    e?.stopPropagation();
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;

    const updated = [...chapters];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    normalizeAndApplyChapters(updated);
  };

  // Drag and drop event handlers
  const resetDrag = () => {
    setDraggedId(null);
    setDragOverTargetId(null);
    setDragOverPosition(null);
  };

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedId(chapterId);
    e.dataTransfer.setData('text/plain', chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, isPart: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const height = rect.height;

    if (isPart && relY > height * 0.25 && relY < height * 0.75) {
      setDragOverPosition('into-part');
    } else if (relY < height / 2) {
      setDragOverPosition('before');
    } else {
      setDragOverPosition('after');
    }
    setDragOverTargetId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      resetDrag();
      return;
    }

    // Determine moving set of IDs (if dragged item is part of selected block, move the whole block)
    const movingIds =
      selectedBlockIds.has(draggedId) && selectedBlockIds.size > 1
        ? chapters.filter((c) => selectedBlockIds.has(c.id)).map((c) => c.id)
        : [draggedId];

    const itemsToMove = chapters.filter((c) => movingIds.includes(c.id));
    const remaining = chapters.filter((c) => !movingIds.includes(c.id));

    const targetIndex = remaining.findIndex((c) => c.id === targetId);
    if (targetIndex === -1) {
      resetDrag();
      return;
    }

    const targetChapter = remaining[targetIndex];
    let insertIndex = targetIndex;
    if (dragOverPosition === 'after' || dragOverPosition === 'into-part') {
      insertIndex = targetIndex + 1;
    }

    // Update group to match target section
    const updatedItems = itemsToMove.map((c) => ({
      ...c,
      group: targetChapter.group,
    }));

    const newChapters = [
      ...remaining.slice(0, insertIndex),
      ...updatedItems,
      ...remaining.slice(insertIndex),
    ];

    normalizeAndApplyChapters(newChapters);
    setSelectedBlockIds(new Set());

    const isPartTarget = targetChapter.type === 'part';
    const msg = isPartTarget
      ? `Moved ${updatedItems.length} into Part ${toRoman(targetChapter.partNumber || 1)}`
      : `Reordered ${updatedItems.length} ${updatedItems.length === 1 ? 'chapter' : 'chapters'}`;
    showToast(msg);
    resetDrag();
  };

  return (
    <aside className="w-full lg:w-72 bg-stone-950 border-r border-stone-800 flex flex-col h-full select-none shrink-0 text-stone-300">
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

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors ml-0.5"
            title="Close Outline"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
              className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Add Full-Page Part Divider (Phase 2)"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Part</span>
            </button>

            {/* Reordering Mode Toggle Button */}
            <button
              onClick={() => {
                setIsReorderMode(!isReorderMode);
                if (isReorderMode) setSelectedBlockIds(new Set());
              }}
              className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
                isReorderMode
                  ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-stone-850 hover:bg-stone-800 border-stone-800 text-stone-300 hover:text-amber-300'
              }`}
              title={isReorderMode ? 'Exit Reorder Mode' : 'Toggle Chapter Reordering Mode (Drag & Drop, Move blocks between parts)'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{isReorderMode ? 'Done' : 'Sort'}</span>
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

          {/* Reordering Mode Active Header Banner */}
          {isReorderMode && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 p-2.5 text-xs flex flex-col gap-1 shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ArrowUpDown className="w-4 h-4 text-amber-400" />
                  <span>Chapter Reordering Mode</span>
                </div>
                <button
                  onClick={() => {
                    setIsReorderMode(false);
                    setSelectedBlockIds(new Set());
                  }}
                  className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                Drag rows to reorder. Check multiple boxes to move a block of chapters between parts.
              </p>
            </div>
          )}

          {/* Reorder Success Toast */}
          {reorderToast && (
            <div className="bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/40 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shrink-0 animate-fadeIn">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{reorderToast}</span>
            </div>
          )}

          {/* Chapters Hierarchy List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {/* Multi-Selection Block Action Bar */}
            {isReorderMode && selectedBlockIds.size > 0 && (
              <div className="sticky top-0 z-20 p-2.5 bg-stone-900 border border-amber-500/50 rounded-xl shadow-xl flex flex-col gap-2 mb-2 animate-fadeIn backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-stone-100">
                      {selectedBlockIds.size} {selectedBlockIds.size === 1 ? 'Chapter' : 'Chapters'} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      onClick={() => {
                        const bodyIds = new Set(bodyChapters.map((c) => c.id));
                        setSelectedBlockIds(bodyIds);
                      }}
                      className="text-stone-400 hover:text-stone-200 underline"
                    >
                      Select All
                    </button>
                    <span className="text-stone-600">&bull;</span>
                    <button
                      onClick={() => setSelectedBlockIds(new Set())}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Move Block to Part Dropdown */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-stone-800">
                  <span className="text-[10px] text-stone-400 font-medium shrink-0">Move Block To:</span>
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                      className="w-full py-1.5 px-2 rounded-lg bg-stone-850 hover:bg-stone-800 border border-amber-500/30 text-stone-200 text-xs flex items-center justify-between font-medium transition-colors"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px]">Select Destination Part...</span>
                      </span>
                      <ChevronDown className="w-3 h-3 text-stone-400" />
                    </button>

                    {showMoveDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-1 z-30 space-y-1 text-xs max-h-56 overflow-y-auto">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Parts in Manuscript
                        </div>
                        {availableParts.length > 0 ? (
                          availableParts.map((part) => (
                            <button
                              key={part.id}
                              onClick={() => handleMoveBlockToPart(part.id)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-stone-200 flex items-center justify-between transition-colors"
                            >
                              <span className="truncate font-semibold">
                                PART {part.partNumber ? toRoman(part.partNumber) : ''}: {part.title}
                              </span>
                              <ArrowRight className="w-3 h-3 text-stone-500 shrink-0" />
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-[11px] text-stone-400 italic">
                            No parts created yet. Click &quot;+ Part&quot; above to create one.
                          </div>
                        )}
                        <div className="border-t border-stone-800 my-1" />
                        <button
                          onClick={() => handleMoveBlockToPart('before-parts')}
                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-[11px] flex items-center justify-between"
                        >
                          <span>Move to Top of Manuscript</span>
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveBlockToPart('end-of-body')}
                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-[11px] flex items-center justify-between"
                        >
                          <span>Move to End of Body Chapters</span>
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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

              {/* In Reorder Mode with Part Groups: show explicit Part groups */}
              {isReorderMode && availableParts.length > 0 ? (
                <div className="space-y-3 mt-1.5">
                  {partGroups.map((group, gIdx) => {
                    const isPartDivider = !!group.partDivider;
                    return (
                      <div
                        key={group.partDivider?.id || `opening-group-${gIdx}`}
                        className="rounded-xl border border-stone-800/80 bg-stone-900/40 p-2 space-y-1.5"
                      >
                        {/* Part Header Card */}
                        {isPartDivider ? (
                          renderChapterItem(group.partDivider!)
                        ) : (
                          <div className="px-2 py-1 text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1.5">
                            <Bookmark className="w-3 h-3 text-stone-500" />
                            <span>{group.title}</span>
                          </div>
                        )}

                        {/* Part's Child Chapters */}
                        <div className="space-y-1 pl-1">
                          {group.chapters.length > 0 ? (
                            group.chapters.map((ch) => renderChapterItem(ch))
                          ) : (
                            <div
                              onDragOver={(e) => {
                                if (group.partDivider) {
                                  handleDragOver(e, group.partDivider.id, true);
                                }
                              }}
                              onDrop={(e) => {
                                if (group.partDivider) {
                                  handleDrop(e, group.partDivider.id);
                                }
                              }}
                              className="py-3 px-2 border border-dashed border-stone-800 rounded-lg text-center text-[10px] text-stone-500 italic"
                            >
                              Empty part. Drag chapters or move block here.
                            </div>
                          )}
                        </div>

                        {/* Quick Action: Move Selected Block to This Part */}
                        {isPartDivider &&
                          selectedBlockIds.size > 0 &&
                          !group.chapters.every((c) => selectedBlockIds.has(c.id)) && (
                            <button
                              onClick={() => handleMoveBlockToPart(group.partDivider!.id)}
                              className="w-full py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <CornerDownRight className="w-3 h-3" />
                              <span>Move {selectedBlockIds.size} selected into Part {toRoman(group.partNumber || 1)}</span>
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard or Flat Body Chapters rendering */
                <div className="space-y-1 mt-1">
                  {bodyChapters.map((ch) => renderChapterItem(ch))}
                </div>
              )}
            </div>

            {/* Back Matter */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                <span>Back Matter</span>
                {onOpenBackmatterModal && (
                  <button
                    onClick={onOpenBackmatterModal}
                    className="text-[10px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Open Backmatter Manager"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage</span>
                  </button>
                )}
              </div>
              <div className="space-y-1 mt-1">
                {backMatter.map((ch) => renderChapterItem(ch))}
                {backMatter.length === 0 && onOpenBackmatterModal && (
                  <button
                    onClick={onOpenBackmatterModal}
                    className="w-full py-2 px-2.5 rounded-lg border border-dashed border-stone-800 hover:border-amber-500/40 text-stone-500 hover:text-stone-300 text-xs flex items-center justify-center gap-1.5 transition-colors group"
                  >
                    <Plus className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>+ Add Backmatter Pages</span>
                  </button>
                )}
              </div>
            </div>
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
    const isChecked = selectedBlockIds.has(ch.id);

    // Drop indicator highlights
    const isDragOver = dragOverTargetId === ch.id;
    const isDragged = draggedId === ch.id || (selectedBlockIds.has(ch.id) && draggedId && selectedBlockIds.has(draggedId));

    let dropIndicatorClass = '';
    if (isDragOver) {
      if (dragOverPosition === 'before') {
        dropIndicatorClass = 'border-t-2 border-t-amber-400';
      } else if (dragOverPosition === 'after') {
        dropIndicatorClass = 'border-b-2 border-b-amber-400';
      } else if (dragOverPosition === 'into-part') {
        dropIndicatorClass = 'ring-2 ring-amber-400 bg-amber-500/20';
      }
    }

    if (isPart) {
      // High-visibility Part Divider
      return (
        <div
          key={ch.id}
          draggable={isReorderMode}
          onDragStart={(e) => handleDragStart(e, ch.id)}
          onDragOver={(e) => handleDragOver(e, ch.id, true)}
          onDrop={(e) => handleDrop(e, ch.id)}
          onDragEnd={resetDrag}
          onClick={() => {
            if (isReorderMode) {
              toggleSelectBlock(ch.id);
            } else {
              onSelectChapter(ch.id);
              onCloseMobile?.();
            }
          }}
          className={`group relative p-2.5 rounded-xl border text-left transition-all ${
            isDragged ? 'opacity-40 scale-95' : ''
          } ${dropIndicatorClass} ${
            isSelected
              ? 'bg-amber-500/15 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-stone-900/90 border-stone-800/80 hover:border-stone-700 text-stone-300'
          } ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {isReorderMode && (
                <div
                  className="p-1 -ml-1 text-stone-500 hover:text-amber-400 cursor-grab shrink-0"
                  title="Drag part divider to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
              <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 truncate">
                PART {ch.partNumber ? toRoman(ch.partNumber) : 'DIVIDER'}
              </span>
            </div>

            {/* Reorder Up/Down or Delete */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {isReorderMode ? (
                <>
                  <button
                    onClick={(e) => handleMoveStep(ch.id, 'up', e)}
                    className="p-1 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800"
                    title="Move Part Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleMoveStep(ch.id, 'down', e)}
                    className="p-1 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800"
                    title="Move Part Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </>
              ) : (
                chapters.length > 1 && (
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
                )
              )}
            </div>
          </div>
          <div className="text-xs font-serif font-bold text-stone-100 mt-0.5 truncate pl-5">
            {ch.title}
          </div>
        </div>
      );
    }

    // Standard Chapter item
    return (
      <div
        key={ch.id}
        draggable={isReorderMode}
        onDragStart={(e) => handleDragStart(e, ch.id)}
        onDragOver={(e) => handleDragOver(e, ch.id, false)}
        onDrop={(e) => handleDrop(e, ch.id)}
        onDragEnd={resetDrag}
        onClick={() => {
          if (isReorderMode) {
            toggleSelectBlock(ch.id);
          } else {
            onSelectChapter(ch.id);
            onCloseMobile?.();
          }
        }}
        className={`group relative px-2.5 py-2 rounded-lg text-left transition-all flex items-center justify-between ${
          isDragged ? 'opacity-40 scale-95' : ''
        } ${dropIndicatorClass} ${
          isChecked
            ? 'bg-amber-500/15 border border-amber-500/50 text-amber-200 shadow-sm'
            : isSelected
            ? 'bg-stone-850 text-stone-100 font-medium border border-stone-700/70 shadow-sm'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
        } ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {isReorderMode ? (
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Block Selection Checkbox */}
              <button
                type="button"
                onClick={(e) => toggleSelectBlock(ch.id, e)}
                className="text-stone-400 hover:text-amber-400 p-0.5"
                title={isChecked ? 'Deselect from block' : 'Select chapter for block move'}
              >
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-600" />
                )}
              </button>
              {/* Drag Handle */}
              <div className="text-stone-500 hover:text-amber-400 cursor-grab">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`} />
          )}

          <div className="truncate flex-1 min-w-0">
            <div className="text-xs truncate font-medium">
              {ch.title || 'Untitled Chapter'}
            </div>
            <div className="text-[10px] text-stone-500 font-mono">
              {(ch.wordCount || 0).toLocaleString()} words
              {ch.footnotes && ch.footnotes.length > 0 && ` \u2022 ${ch.footnotes.length} fn`}
            </div>
          </div>
        </div>

        {/* Actions Cluster: Reorder Buttons or Delete */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isReorderMode ? (
            <>
              <button
                onClick={(e) => handleMoveStep(ch.id, 'up', e)}
                className="p-1 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800"
                title="Move Chapter Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => handleMoveStep(ch.id, 'down', e)}
                className="p-1 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800"
                title="Move Chapter Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </>
          ) : (
            chapters.length > 1 && (
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
            )
          )}
        </div>
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
