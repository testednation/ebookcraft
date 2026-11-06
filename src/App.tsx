import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, Chapter, CharacterProfile, SectionGroup, SectionType, StyleConfig } from './types/book';
import {
  seedInitialDemoIfEmpty,
  saveBook,
  saveChapter,
  saveChapters,
  deleteChapter,
  saveCharacter,
  deleteCharacter,
} from './services/storage';
import { getDefaultStyleConfig } from './services/themes';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { StyleModal } from './components/StyleModal';
import { BookDetailsModal } from './components/BookDetailsModal';
import { ExportModal } from './components/ExportModal';
import { CharacterModal } from './components/CharacterModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Persistence & Auto-save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pane & Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(true);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [isBookDetailsModalOpen, setIsBookDetailsModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Character Modal state
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);
  const [selectedCharacterForModal, setSelectedCharacterForModal] = useState<CharacterProfile | null>(null);

  // Active Chapter reference
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0] || null;

  // Total word count calculation
  const totalWordCount = chapters.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);

  // Initialize DB on mount
  useEffect(() => {
    async function init() {
      try {
        const demo = await seedInitialDemoIfEmpty();
        setBook(demo.book);
        setChapters(demo.chapters);
        setCharacters(demo.characters || []);
        if (demo.chapters.length > 0) {
          // Default to prologue or first chapter if available
          const firstBody = demo.chapters.find((c) => c.group === 'body') || demo.chapters[0];
          setActiveChapterId(firstBody.id);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Manual save handler
  const handleSaveAll = useCallback(async () => {
    if (!book) return;
    setSaveStatus('saving');
    try {
      await saveBook(book);
      if (chapters.length > 0) {
        await saveChapters(chapters);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save book to IndexedDB:', err);
      setSaveStatus('unsaved');
    }
  }, [book, chapters]);

  // Trigger auto-save based on book.autoSaveFrequency
  const triggerAutoSave = useCallback(() => {
    if (!book) return;
    const freq = book.autoSaveFrequency || '5s';

    if (freq === 'manual') {
      setSaveStatus('unsaved');
      return;
    }

    if (freq === 'immediate') {
      handleSaveAll();
      return;
    }

    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    const delayMs = freq === '5s' ? 5000 : freq === '15s' ? 15000 : 30000;
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveAll();
    }, delayMs);
  }, [book, handleSaveAll]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+N, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      // Ctrl + S (Save)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSaveAll();
      }

      // Ctrl + P (Toggle Device Preview)
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPreviewOpen((prev) => !prev);
      }

      // Ctrl + N (Add New Body Chapter)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAddChapter('body', 'chapter');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAll]);

  // Update active chapter contents
  const handleUpdateChapter = (updates: Partial<Chapter>) => {
    if (!activeChapterId) return;

    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === activeChapterId) {
          const updated = { ...ch, ...updates };
          // Save single chapter in background
          saveChapter(updated).catch(console.error);
          return updated;
        }
        return ch;
      })
    );

    triggerAutoSave();
  };

  // Add chapter or front/back matter section
  const handleAddChapter = async (group: SectionGroup, type?: SectionType) => {
    if (!book) return;

    const groupChapters = chapters.filter((c) => c.group === group);
    const newNumber = group === 'body' ? groupChapters.length + 1 : undefined;
    const defaultTitle =
      group === 'body'
        ? `Chapter ${newNumber || chapters.length + 1}`
        : group === 'front-matter'
        ? 'Preface'
        : 'Afterword';

    const newChapter: Chapter = {
      id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookId: book.id,
      title: defaultTitle,
      type: type || (group === 'body' ? 'chapter' : group === 'front-matter' ? 'prologue' : 'afterword'),
      group,
      number: newNumber,
      order: chapters.length + 1,
      wordCount: 0,
      includeInToc: true,
      pageBreakBefore: true,
      content: '<p></p>',
    };

    const updated = [...chapters, newChapter];
    setChapters(updated);
    setActiveChapterId(newChapter.id);
    await saveChapter(newChapter);
    triggerAutoSave();
  };

  // Delete chapter
  const handleDeleteChapter = async (id: string) => {
    if (chapters.length <= 1) return;
    const remaining = chapters.filter((c) => c.id !== id);
    setChapters(remaining);

    if (activeChapterId === id) {
      setActiveChapterId(remaining[0].id);
    }

    await deleteChapter(id);
    triggerAutoSave();
  };

  // Reorder chapters up or down
  const handleReorderChapter = async (id: string, direction: 'up' | 'down') => {
    const index = chapters.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...chapters];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Resequence order index
    const reordered = updated.map((ch, idx) => ({ ...ch, order: idx + 1 }));
    setChapters(reordered);
    await saveChapters(reordered);
    triggerAutoSave();
  };

  // Character Profiles CRUD
  const handleOpenCharacterModal = (char?: CharacterProfile) => {
    setSelectedCharacterForModal(char || null);
    setIsCharacterModalOpen(true);
  };

  const handleSaveCharacter = async (char: CharacterProfile) => {
    const existingIndex = characters.findIndex((c) => c.id === char.id);
    let updatedChars: CharacterProfile[];
    if (existingIndex >= 0) {
      updatedChars = [...characters];
      updatedChars[existingIndex] = char;
    } else {
      updatedChars = [...characters, char];
    }
    setCharacters(updatedChars);
    await saveCharacter(char);
    triggerAutoSave();
  };

  const handleDeleteCharacter = async (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    setCharacters(updated);
    await deleteCharacter(id);
    triggerAutoSave();
  };

  // Insert character name into editor
  const handleInsertCharacterName = (name: string) => {
    // Dispatch a custom event or directly trigger text insertion
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (editor) {
      editor.focus();
      document.execCommand('insertText', false, ` ${name} `);
      const text = editor.innerText || '';
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      handleUpdateChapter({
        content: editor.innerHTML,
        wordCount,
      });
    }
  };

  // Update Style Config
  const handleSaveStyle = async (newConfig: StyleConfig) => {
    if (!book) return;
    const updatedBook: Book = {
      ...book,
      styleConfig: newConfig,
      updatedAt: Date.now(),
    };
    setBook(updatedBook);
    await saveBook(updatedBook);
    triggerAutoSave();
  };

  // Update Book Metadata
  const handleSaveBookDetails = async (updatedBook: Book) => {
    setBook(updatedBook);
    await saveBook(updatedBook);
    triggerAutoSave();
  };

  // Update Book Targets & Daily Word Goal
  const handleUpdateBookGoals = async (goals: {
    targetWordCount: number;
    dailyWordGoal: number;
    resetTodayBaseline?: boolean;
  }) => {
    if (!book) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const updatedBook: Book = {
      ...book,
      targetWordCount: goals.targetWordCount,
      dailyWordGoal: goals.dailyWordGoal,
      ...(goals.resetTodayBaseline
        ? { dailyBaselineWords: totalWordCount, dailyBaselineDate: todayStr }
        : {}),
      updatedAt: Date.now(),
    };
    setBook(updatedBook);
    await saveBook(updatedBook);
    triggerAutoSave();
  };

  // Update specific Chapter Target Word Count
  const handleUpdateChapterTarget = async (chapterId: string, target: number) => {
    const updatedChapters = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, targetWordCount: target } : ch
    );
    setChapters(updatedChapters);
    const changed = updatedChapters.find((c) => c.id === chapterId);
    if (changed) {
      await saveChapter(changed);
    }
    triggerAutoSave();
  };

  // Import Backup
  const handleImportBackup = (restored: { book: Book; chapters: Chapter[]; characters: CharacterProfile[] }) => {
    setBook(restored.book);
    setChapters(restored.chapters);
    setCharacters(restored.characters || []);
    if (restored.chapters.length > 0) {
      setActiveChapterId(restored.chapters[0].id);
    }
    setSaveStatus('saved');
  };

  // Import Chapters from text/markdown
  const handleImportChapters = async (newChapters: Chapter[]) => {
    const combined = [...chapters, ...newChapters];
    setChapters(combined);
    await saveChapters(combined);
    if (newChapters.length > 0) {
      setActiveChapterId(newChapters[0].id);
    }
    triggerAutoSave();
  };

  if (isLoading || !book) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-300 gap-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="font-serif text-lg tracking-wide text-neutral-200">
          Loading FolioCraft Studio...
        </span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Studio Header */}
      <Header
        book={book}
        saveStatus={saveStatus}
        isPreviewOpen={isPreviewOpen}
        onTogglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
        onOpenStyleModal={() => setIsStyleModalOpen(true)}
        onOpenBookDetailsModal={() => setIsBookDetailsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSaveManual={handleSaveAll}
        totalWordCount={totalWordCount}
      />

      {/* Main 3-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar Navigation (Manuscript & Characters tabs) */}
        <SidebarNav
          chapters={chapters}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onReorderChapter={handleReorderChapter}
          characters={characters}
          onOpenCharacterModal={handleOpenCharacterModal}
          onDeleteCharacter={handleDeleteCharacter}
          onInsertCharacterName={handleInsertCharacterName}
          book={book}
          onUpdateBookGoals={handleUpdateBookGoals}
          onUpdateChapterTarget={handleUpdateChapterTarget}
        />

        {/* Center: Rich WYSIWYG Editor Pane */}
        <EditorPane
          chapter={activeChapter}
          onUpdateChapter={handleUpdateChapter}
          characters={characters}
          onOpenCharacterModal={handleOpenCharacterModal}
        />

        {/* Right: Device Preview Simulator Pane */}
        {isPreviewOpen && (
          <PreviewPane
            book={book}
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={setActiveChapterId}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </div>

      {/* Modals */}
      <StyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        styleConfig={book.styleConfig || getDefaultStyleConfig('literary')}
        onSaveStyle={handleSaveStyle}
      />

      <BookDetailsModal
        isOpen={isBookDetailsModalOpen}
        onClose={() => setIsBookDetailsModalOpen(false)}
        book={book}
        onSaveBook={handleSaveBookDetails}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        book={book}
        chapters={chapters}
        characters={characters}
        onImportBackup={handleImportBackup}
        onImportChapters={handleImportChapters}
      />

      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        character={selectedCharacterForModal}
        bookId={book.id}
        onSave={handleSaveCharacter}
      />
    </div>
  );
}
