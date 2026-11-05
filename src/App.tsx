import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookProject, BookSection, SectionType, SectionSubtype } from './types/book';
import { 
  getAllBooks, 
  getSections, 
  saveBook, 
  saveSection, 
  saveSections, 
  deleteSection, 
  seedInitialDemoIfEmpty 
} from './services/storage';
import { parseTextOrMarkdownFile } from './services/fileImporter';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { EditorPane } from './components/EditorPane';
import { DevicePreviewer } from './components/DevicePreviewer';
import { ThemeStyleModal } from './components/ThemeStyleModal';
import { BookDetailsModal } from './components/BookDetailsModal';
import { ExportModal } from './components/ExportModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [allBooks, setAllBooks] = useState<BookProject[]>([]);
  const [currentBook, setCurrentBook] = useState<BookProject | null>(null);
  const [sections, setSections] = useState<BookSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Modals state
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const { book, sections: initialSections } = await seedInitialDemoIfEmpty();
        const books = await getAllBooks();
        setAllBooks(books);
        setCurrentBook(book);
        setSections(initialSections);
        if (initialSections.length > 0) {
          // Default to the first body chapter or first section
          const firstChapter = initialSections.find((s) => s.subtype === 'chapter') || initialSections[0];
          setActiveSectionId(firstChapter.id);
        }
      } catch (err) {
        console.error('Failed to initialize FolioCraft database:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Switch book
  const handleSelectBook = async (bookId: string) => {
    const selected = allBooks.find((b) => b.id === bookId);
    if (!selected) return;
    setCurrentBook(selected);
    const secs = await getSections(selected.id);
    setSections(secs);
    if (secs.length > 0) {
      setActiveSectionId(secs[0].id);
    }
  };

  // Create new book project
  const handleNewBook = async () => {
    const title = prompt('Enter the title of your new book:', 'Untitled Manuscript');
    if (!title) return;

    const newBookId = `book-${Date.now()}`;
    const newBook: BookProject = {
      id: newBookId,
      title,
      author: 'Author Name',
      language: 'en',
      copyrightYear: new Date().getFullYear().toString(),
      rightsStatement: 'All rights reserved.',
      themeId: 'theme-classic-literary',
      trimSize: '6x9',
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'EB Garamond', Georgia, serif",
      baseFontSize: 16,
      lineSpacing: 1.6,
      numberFormat: 'Roman',
      dropCapEnabled: true,
      dropCapStyle: 'classic',
      ornamentKey: 'fleuron',
      versoHeader: 'title',
      rectoHeader: 'chapter',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const initialChapter: BookSection = {
      id: `sec-${newBookId}-1`,
      bookId: newBookId,
      type: 'body',
      subtype: 'chapter',
      title: 'Chapter I',
      content: '<p>Start writing your story here...</p>',
      order: 0,
      includeInToc: true,
      dropCap: true,
      wordCount: 6,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveBook(newBook);
    await saveSection(initialChapter);

    setAllBooks((prev) => [...prev, newBook]);
    setCurrentBook(newBook);
    setSections([initialChapter]);
    setActiveSectionId(initialChapter.id);
  };

  // Update active book metadata
  const handleUpdateBook = async (updated: BookProject) => {
    setCurrentBook(updated);
    setAllBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    await saveBook(updated);
  };

  // Update active section
  const handleUpdateSection = async (updated: BookSection) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    await saveSection(updated);
  };

  // Add new section
  const handleAddSection = async (type: SectionType, subtype: SectionSubtype, title: string) => {
    if (!currentBook) return;

    const newSec: BookSection = {
      id: `sec-${currentBook.id}-${Date.now()}`,
      bookId: currentBook.id,
      type,
      subtype,
      title,
      content: `<p>New ${title.toLowerCase()} content...</p>`,
      order: sections.length,
      includeInToc: type === 'body',
      dropCap: type === 'body',
      wordCount: 4,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedSections = [...sections, newSec];
    setSections(updatedSections);
    setActiveSectionId(newSec.id);
    await saveSection(newSec);
  };

  // Delete section
  const handleDeleteSection = async (id: string) => {
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    if (activeSectionId === id && updated.length > 0) {
      setActiveSectionId(updated[0].id);
    }
    await deleteSection(id);
  };

  // Reorder section up / down
  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update orders
    const normalized = reordered.map((sec, idx) => ({ ...sec, order: idx }));
    setSections(normalized);
    await saveSections(normalized);
  };

  // Import text / markdown chapter
  const handleImportFile = async (file: File) => {
    if (!currentBook) return;
    try {
      const imported = await parseTextOrMarkdownFile(file, currentBook.id, sections.length);
      const updated = [...sections, imported];
      setSections(updated);
      setActiveSectionId(imported.id);
      await saveSection(imported);
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  // Total word count calculation
  const totalWordCount = useMemo(() => {
    return sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
  }, [sections]);

  // Current active section
  const activeSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0] || null;
  }, [sections, activeSectionId]);

  if (loading || !currentBook) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="text-sm font-medium">Opening FolioCraft Studio...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Bar Navigation */}
      <Header
        currentBook={currentBook}
        allBooks={allBooks}
        onSelectBook={handleSelectBook}
        onNewBook={handleNewBook}
        onOpenThemes={() => setIsThemesOpen(true)}
        onOpenDetails={() => setIsDetailsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        totalWordCount={totalWordCount}
      />

      {/* Main Studio Viewport (3-Pane Workspace) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Book Organizer & Matter */}
        <SidebarNav
          sections={sections}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onMoveSection={handleMoveSection}
          onImportFile={handleImportFile}
        />

        {/* Center Pane: Manuscript WYSIWYG Editor */}
        {activeSection ? (
          <EditorPane
            section={activeSection}
            book={currentBook}
            onChangeSection={handleUpdateSection}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
            Select or create a section to start writing.
          </div>
        )}

        {/* Right Pane: Live Device & Print Spread Previewer */}
        {activeSection && (
          <DevicePreviewer
            book={currentBook}
            section={activeSection}
            allSections={sections}
            onSelectSection={setActiveSectionId}
          />
        )}
      </main>

      {/* Themes & Styling Modal */}
      <ThemeStyleModal
        isOpen={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
        book={currentBook}
        onUpdateBook={handleUpdateBook}
      />

      {/* Book Details & Trim Size Modal */}
      <BookDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        book={currentBook}
        onUpdateBook={handleUpdateBook}
      />

      {/* Export & Publishing Center Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        book={currentBook}
        sections={sections}
        onProjectRestored={async (restored) => {
          const books = await getAllBooks();
          setAllBooks(books);
          setCurrentBook(restored);
          const secs = await getSections(restored.id);
          setSections(secs);
          if (secs.length > 0) setActiveSectionId(secs[0].id);
        }}
      />
    </div>
  );
}
