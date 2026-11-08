import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, Chapter, CharacterProfile, SectionType, StyleConfig, CoverWrapConfig } from './types/book';
import {
  seedInitialDemoIfEmpty,
  saveBook,
  saveChapter,
  saveChapters,
  deleteChapter,
  saveCharacter,
  deleteCharacter as deleteCharFromDb,
} from './services/storage';
import { openPrintDialog } from './services/printCompiler';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { BookDetailsModal } from './components/BookDetailsModal';
import { StyleModal } from './components/StyleModal';
import { ExportModal } from './components/ExportModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { RoadmapModal } from './components/RoadmapModal';
import { CharacterModal } from './components/CharacterModal';
import { CoverWrapModal } from './components/CoverWrapModal';
import { PreflightModal } from './components/PreflightModal';
import { WritingVelocityModal } from './components/WritingVelocityModal';
import { ImportModal } from './components/ImportModal';
import { DocumentCleanerModal } from './components/DocumentCleanerModal';
import { Loader2 } from 'lucide-react';

export function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Layout view toggles
  const [focusMode, setFocusMode] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(true);

  // Modal dialog states
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCoverWrapModal, setShowCoverWrapModal] = useState(false);
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [showVelocityModal, setShowVelocityModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [preloadedImportFile, setPreloadedImportFile] = useState<File | null>(null);
  const [showCleanerModal, setShowCleanerModal] = useState(false);

  // Pending saves ref for debounce
  const pendingSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial project data from IndexedDB
  useEffect(() => {
    async function init() {
      try {
        const seeded = await seedInitialDemoIfEmpty();
        setBook(seeded.book);
        setChapters(seeded.chapters);
        setCharacters(seeded.characters);
        if (seeded.chapters.length > 0) {
          // Select first chapter or first prologue
          const firstBody = seeded.chapters.find((c) => c.group === 'body') || seeded.chapters[0];
          setSelectedChapterId(firstBody.id);
        }
      } catch (err) {
        console.error('Error loading manuscript:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Compute total book words
  const totalBookWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  // Trigger immediate save to IndexedDB
  const executeSaveNow = useCallback(async () => {
    if (!book) return;
    setIsSaving(true);
    try {
      await saveBook(book);
      const currentChapter = chapters.find((c) => c.id === selectedChapterId);
      if (currentChapter) {
        await saveChapter(currentChapter);
      }
      setLastSavedAt(Date.now());
    } catch (err) {
      console.error('Failed to auto-save:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  }, [book, chapters, selectedChapterId]);

  // Schedule auto-save based on user's AutoSaveFrequency configuration
  const scheduleAutoSave = useCallback(() => {
    if (!book) return;
    const freq = book.autoSaveFrequency || '5s';

    if (freq === 'manual') return; // Manual mode only saves on Ctrl+S

    if (pendingSaveTimeoutRef.current) {
      clearTimeout(pendingSaveTimeoutRef.current);
    }

    let delayMs = 5000;
    if (freq === 'immediate') delayMs = 400;
    else if (freq === '5s') delayMs = 5000;
    else if (freq === '15s') delayMs = 15000;
    else if (freq === '30s') delayMs = 30000;

    pendingSaveTimeoutRef.current = setTimeout(() => {
      executeSaveNow();
    }, delayMs);
  }, [book, executeSaveNow]);

  // Keyboard Shortcuts Listener (Ctrl+S, Ctrl+N, Ctrl+P, Ctrl+F, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        executeSaveNow();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddChapter('chapter');
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPreviewPane((prev) => !prev);
      // Focus Mode toggle: supports both Ctrl+Shift+F and Ctrl+F (preventing browser Find conflict)
      } else if (
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'f')
      ) {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeSaveNow]);

  // Chapter update handler
  const handleUpdateChapter = (patch: Partial<Chapter>) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === selectedChapterId) {
          const updated = { ...ch, ...patch };
          // If content changed, persist to memory and schedule save
          return updated;
        }
        return ch;
      })
    );
    scheduleAutoSave();
  };

  // Add standard chapter
  const handleAddChapter = async (type: SectionType = 'chapter') => {
    if (!book) return;
    const existingChapters = chapters.filter((c) => c.type === 'chapter');
    const chapterNumber = existingChapters.length + 1;
    const newChapterId = 'ch_' + Date.now();

    const newChapter: Chapter = {
      id: newChapterId,
      bookId: book.id,
      title: `Chapter ${chapterNumber}`,
      subtitle: '',
      number: chapterNumber,
      type,
      group: 'body',
      content: '<p>Start writing your new chapter...</p>',
      order: chapters.length + 1,
      wordCount: 5,
      targetWordCount: 2500,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    };

    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    setSelectedChapterId(newChapterId);
    await saveChapter(newChapter);
    setLastSavedAt(Date.now());
  };

  // Add Full-Page Part Divider (Phase 2 feature)
  const handleAddPartDivider = async () => {
    if (!book) return;
    const existingParts = chapters.filter((c) => c.type === 'part');
    const partNumber = existingParts.length + 1;
    const newPartId = 'part_' + Date.now();

    const newPartChapter: Chapter = {
      id: newPartId,
      bookId: book.id,
      title: `The New Horizon`,
      subtitle: `Part ${toRoman(partNumber)} Divider`,
      partNumber,
      type: 'part',
      group: 'body',
      content: `<p class="text-center italic opacity-75">"When shadows lengthen across the brass meridian..."</p>`,
      order: chapters.length + 1,
      wordCount: 8,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    };

    const updatedChapters = [...chapters, newPartChapter];
    setChapters(updatedChapters);
    setSelectedChapterId(newPartId);
    await saveChapter(newPartChapter);
    setLastSavedAt(Date.now());
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (chapters.length <= 1) {
      alert('Manuscripts must contain at least one section.');
      return;
    }
    const updated = chapters.filter((c) => c.id !== chapterId);
    setChapters(updated);
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(updated[0]?.id || '');
    }
    await deleteChapter(chapterId);
  };

  // Update book metadata / goals / autosave
  const handleSaveBookDetails = async (patch: Partial<Book>) => {
    if (!book) return;
    const updatedBook: Book = {
      ...book,
      ...patch,
      updatedAt: Date.now(),
    };
    setBook(updatedBook);
    await saveBook(updatedBook);
    setLastSavedAt(Date.now());
  };

  // Update book typography & styling config
  const handleUpdateStyle = async (patch: Partial<StyleConfig>) => {
    if (!book) return;
    const updatedStyle: StyleConfig = {
      ...book.styleConfig,
      ...patch,
    };
    const updatedBook: Book = {
      ...book,
      styleConfig: updatedStyle,
      updatedAt: Date.now(),
    };
    setBook(updatedBook);
    await saveBook(updatedBook);
    setLastSavedAt(Date.now());
  };

  // Character operations
  const handleSaveCharacter = async (char: CharacterProfile) => {
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === char.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = char;
        return next;
      }
      return [...prev, char];
    });
    await saveCharacter(char);
  };

  const handleDeleteCharacter = async (charId: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== charId));
    await deleteCharFromDb(charId);
  };

  // Open Import Modal (optionally with pre-selected file)
  const handleOpenImport = (file?: File) => {
    setPreloadedImportFile(file || null);
    setShowImportModal(true);
  };

  // Import manuscript handler (.docx, .txt, .md) with append or replace
  const handleConfirmImport = async (result: {
    bookTitle?: string;
    chapters: Omit<Chapter, 'id' | 'bookId'>[];
    mode: 'append' | 'replace';
  }) => {
    if (!book || result.chapters.length === 0) return;

    if (result.mode === 'replace') {
      // Clean up previous chapters
      for (const ch of chapters) {
        await deleteChapter(ch.id);
      }
      const newChapters: Chapter[] = result.chapters.map((ch, idx) => ({
        ...ch,
        id: `imported_${Date.now()}_${idx}`,
        bookId: book.id,
        order: idx + 1,
      }));
      setChapters(newChapters);
      setSelectedChapterId(newChapters[0]?.id || '');
      await saveChapters(newChapters);
    } else {
      // Append to current chapters
      const importedChapters: Chapter[] = result.chapters.map((ch, idx) => ({
        ...ch,
        id: `imported_${Date.now()}_${idx}`,
        bookId: book.id,
        order: chapters.length + idx + 1,
      }));
      const combined = [...chapters, ...importedChapters];
      setChapters(combined);
      setSelectedChapterId(importedChapters[0].id);
      await saveChapters(importedChapters);
    }

    if (result.bookTitle && (!book.title || book.title === 'The Brass Meridian')) {
      handleSaveBookDetails({ title: result.bookTitle });
    }
    setLastSavedAt(Date.now());
  };

  const handleImportManuscript = async (result: {
    bookTitle?: string;
    chapters: Omit<Chapter, 'id' | 'bookId'>[];
  }) => {
    await handleConfirmImport({ ...result, mode: 'append' });
  };

  const handleUpdateBookGoals = async (goals: {
    targetWordCount: number;
    dailyWordGoal: number;
    resetTodayBaseline?: boolean;
  }) => {
    if (!book) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const patch: Partial<Book> = {
      targetWordCount: goals.targetWordCount,
      dailyWordGoal: goals.dailyWordGoal,
    };
    if (goals.resetTodayBaseline) {
      patch.dailyBaselineDate = todayStr;
      patch.dailyBaselineWords = totalBookWords;
    }
    await handleSaveBookDetails(patch);
  };

  const handleUpdateChapterTarget = async (chapterId: string, target: number) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, targetWordCount: target } : ch))
    );
    const ch = chapters.find((c) => c.id === chapterId);
    if (ch) {
      await saveChapter({ ...ch, targetWordCount: target });
    }
  };

  const handleSaveCoverWrap = async (wrapConfig: CoverWrapConfig) => {
    if (!book) return;
    const updated: Book = {
      ...book,
      coverWrap: wrapConfig,
      updatedAt: Date.now(),
    };
    setBook(updated);
    await saveBook(updated);
    setLastSavedAt(Date.now());
  };

  const handleToggleRectoOpenings = async (enabled: boolean) => {
    await handleUpdateStyle({ rectoChapterOpening: enabled });
  };

  const handleApplyCleaning = async (updatedChapters: Chapter[], message: string) => {
    setChapters(updatedChapters);
    await saveChapters(updatedChapters);
    setLastSavedAt(Date.now());
  };

  // Quick action from Roadmap Modal
  const handleRoadmapAction = (
    action: 'part' | 'import' | 'footnotes' | 'docx' | 'goals' | 'cover-wrap' | 'preflight'
  ) => {
    if (action === 'part') {
      handleAddPartDivider();
    } else if (action === 'import') {
      handleOpenImport();
    } else if (action === 'docx') {
      setShowExportModal(true);
    } else if (action === 'goals') {
      setShowBookDetails(true);
    } else if (action === 'cover-wrap') {
      setShowCoverWrapModal(true);
    } else if (action === 'preflight') {
      setShowPreflightModal(true);
    }
  };

  if (loading || !book) {
    return (
      <div className="h-screen w-screen bg-stone-950 flex flex-col items-center justify-center text-stone-300">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <h2 className="text-sm font-serif font-semibold tracking-wide">Loading FolioCraft Studio...</h2>
        <p className="text-xs text-stone-500 mt-1">Initializing persistent IndexedDB storage</p>
      </div>
    );
  }

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-950 text-stone-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        book={book}
        totalWords={totalBookWords}
        chapterCount={chapters.length}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
        onOpenBookDetails={() => setShowBookDetails(true)}
        onOpenStyleModal={() => setShowStyleModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenRoadmap={() => setShowRoadmapModal(true)}
        onOpenCharacters={() => setShowCharacterModal(true)}
        onOpenCoverWrap={() => setShowCoverWrapModal(true)}
        onOpenPreflight={() => setShowPreflightModal(true)}
        onOpenWritingVelocity={() => setShowVelocityModal(true)}
        onOpenImportModal={() => handleOpenImport()}
        onOpenDocumentCleaner={() => setShowCleanerModal(true)}
      />

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Manuscript Tree & Character Bible Sidebar (Hidden in Focus Mode) */}
        {!focusMode && (
          <SidebarNav
            book={book}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            onSelectChapter={(id) => setSelectedChapterId(id)}
            onAddChapter={handleAddChapter}
            onAddPartDivider={handleAddPartDivider}
            onDeleteChapter={handleDeleteChapter}
            characters={characters}
            onOpenCharacterModal={() => setShowCharacterModal(true)}
            onImportManuscript={handleImportManuscript}
            onUpdateBookGoals={handleUpdateBookGoals}
            onUpdateChapterTarget={handleUpdateChapterTarget}
            onOpenWritingVelocity={() => setShowVelocityModal(true)}
            onOpenImportModal={(file) => handleOpenImport(file)}
          />
        )}

        {/* Center: Writing & Prose Editor */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {selectedChapter ? (
            <EditorPane
              chapter={selectedChapter}
              chapters={chapters}
              characters={characters}
              styleConfig={book.styleConfig}
              focusMode={focusMode}
              onUpdateChapter={handleUpdateChapter}
              onOpenCharacterModal={() => setShowCharacterModal(true)}
              onOpenDocumentCleaner={() => setShowCleanerModal(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-500 text-xs">
              No section selected. Choose a chapter from the sidebar.
            </div>
          )}
        </main>

        {/* Right: Real-time Device Preview Pane (Hidden in Focus Mode or when collapsed) */}
        {!focusMode && showPreviewPane && selectedChapter && (
          <PreviewPane book={book} chapter={selectedChapter} />
        )}
      </div>

      {/* Modals & Dialogs */}
      <BookDetailsModal
        isOpen={showBookDetails}
        onClose={() => setShowBookDetails(false)}
        book={book}
        onSave={handleSaveBookDetails}
      />

      <StyleModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        styleConfig={book.styleConfig}
        onUpdateStyle={handleUpdateStyle}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        book={book}
        chapters={chapters}
        onOpenCoverWrap={() => setShowCoverWrapModal(true)}
        onOpenPreflight={() => setShowPreflightModal(true)}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <RoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        onSelectAction={handleRoadmapAction}
      />

      <CharacterModal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        characters={characters}
        onSaveCharacter={handleSaveCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        bookId={book.id}
      />

      <CoverWrapModal
        isOpen={showCoverWrapModal}
        onClose={() => setShowCoverWrapModal(false)}
        book={book}
        chapters={chapters}
        onSaveCoverWrap={handleSaveCoverWrap}
      />

      <PreflightModal
        isOpen={showPreflightModal}
        onClose={() => setShowPreflightModal(false)}
        book={book}
        chapters={chapters}
        onOpenPrintDialog={() => openPrintDialog(book, chapters)}
        onOpenCoverWrap={() => setShowCoverWrapModal(true)}
        onToggleRectoOpenings={handleToggleRectoOpenings}
      />

      <WritingVelocityModal
        isOpen={showVelocityModal}
        onClose={() => setShowVelocityModal(false)}
        book={book}
        chapters={chapters}
        onOpenBookDetails={() => setShowBookDetails(true)}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onConfirmImport={handleConfirmImport}
        preloadedFile={preloadedImportFile}
      />

      <DocumentCleanerModal
        isOpen={showCleanerModal}
        onClose={() => setShowCleanerModal(false)}
        activeChapter={selectedChapter}
        chapters={chapters}
        onApplyCleaning={handleApplyCleaning}
      />
    </div>
  );
}

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

export default App;
