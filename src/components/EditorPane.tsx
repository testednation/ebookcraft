import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Divide,
  Scissors,
  Users,
  X,
  Send,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Clock,
  Type,
} from 'lucide-react';
import { Chapter, CharacterProfile, SectionType } from '../types/book';

interface EditorPaneProps {
  chapter: Chapter | null;
  onUpdateChapter: (updates: Partial<Chapter>) => void;
  characters: CharacterProfile[];
  onOpenCharacterModal: (character?: CharacterProfile) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  chapter,
  onUpdateChapter,
  characters,
  onOpenCharacterModal,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCharDrawerOpen, setIsCharDrawerOpen] = useState(false);
  const [charSearchTerm, setCharSearchTerm] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(2500);

  // Synchronize content only when switching chapters
  useEffect(() => {
    if (contentRef.current && chapter) {
      if (contentRef.current.innerHTML !== chapter.content) {
        contentRef.current.innerHTML = chapter.content;
      }
    }
  }, [chapter?.id]);

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 text-sm">
        Select or create a chapter from the manuscript navigation to begin writing.
      </div>
    );
  }

  // Handle rich formatting commands
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleContentInput();
  };

  const handleContentInput = () => {
    if (!contentRef.current) return;
    const newHtml = contentRef.current.innerHTML;
    const text = contentRef.current.innerText || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    onUpdateChapter({
      content: newHtml,
      wordCount,
    });
  };

  // Insert Scene Break ornament
  const insertSceneBreak = () => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    document.execCommand('insertHorizontalRule', false);
    handleContentInput();
  };

  // Insert Page Break marker
  const insertPageBreak = () => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    const breakHtml = `<div class="folio-page-break my-6 py-2 border-t-2 border-dashed border-amber-500/40 text-center text-[10px] uppercase tracking-wider text-amber-500/70 select-none">--- Page Break ---</div><p><br></p>`;
    document.execCommand('insertHTML', false, breakHtml);
    handleContentInput();
  };

  // Insert character name directly into editor
  const insertTextAtCursor = (textToInsert: string) => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    document.execCommand('insertText', false, textToInsert);
    handleContentInput();
  };

  // Reading time estimate (200 wpm)
  const readingTimeMin = Math.max(1, Math.ceil((chapter.wordCount || 0) / 200));

  // Filtered characters for drawer
  const filteredChars = characters.filter((c) =>
    c.name.toLowerCase().includes(charSearchTerm.toLowerCase()) ||
    c.physicalTraits.toLowerCase().includes(charSearchTerm.toLowerCase()) ||
    (c.aliases && c.aliases.toLowerCase().includes(charSearchTerm.toLowerCase()))
  );

  return (
    <main className="flex-1 flex flex-col h-full bg-neutral-950 relative overflow-hidden text-neutral-100">
      {/* Formatting Toolbar */}
      <div className="h-11 border-b border-neutral-800 bg-neutral-900/80 px-4 flex items-center justify-between gap-2 overflow-x-auto select-none shrink-0 text-xs">
        {/* Basic formatting */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-neutral-800 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Normal Paragraph"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-neutral-800 mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
            title="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-neutral-800 mx-1" />

          {/* Book Layout Special Features: Atticus/Vellum Scene Break & Page Break */}
          <button
            type="button"
            onClick={insertSceneBreak}
            className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-amber-300 hover:bg-neutral-800 rounded transition"
            title="Insert Ornamental Scene Break (HR)"
          >
            <Divide className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-[11px]">Scene Break</span>
          </button>

          <button
            type="button"
            onClick={insertPageBreak}
            className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-amber-300 hover:bg-neutral-800 rounded transition"
            title="Insert Hard Page Break (Ctrl+Enter)"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-[11px]">Page Break</span>
          </button>
        </div>

        {/* Right side: Character Reference quick drawer trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCharDrawerOpen(!isCharDrawerOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              isCharDrawerOpen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
            title="Toggle Character Profiles Quick Reference"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Character Cards</span>
            <span className="text-[10px] bg-neutral-700 px-1.5 py-0.2 rounded-full font-mono text-neutral-300">
              {characters.length}
            </span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas & Character Reference Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Writing Paper Canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex justify-center">
          <div className="w-full max-w-2xl bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-8 sm:p-12 shadow-xl min-h-[85vh] flex flex-col">
            {/* Chapter Header Inputs */}
            <div className="border-b border-neutral-800/80 pb-6 mb-6">
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => onUpdateChapter({ title: e.target.value })}
                placeholder="Chapter Title..."
                className="w-full bg-transparent text-2xl sm:text-3xl font-serif font-bold text-white placeholder:text-neutral-600 focus:outline-none mb-2"
              />

              <input
                type="text"
                value={chapter.subtitle || ''}
                onChange={(e) => onUpdateChapter({ subtitle: e.target.value })}
                placeholder="Subtitle or Epigraph (optional)..."
                className="w-full bg-transparent text-sm italic text-neutral-400 placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            {/* WYSIWYG Content Area */}
            <div
              ref={contentRef}
              contentEditable
              onInput={handleContentInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  insertPageBreak();
                }
              }}
              className="flex-1 text-base sm:text-lg leading-relaxed font-serif text-neutral-200 focus:outline-none min-h-[300px] selection:bg-amber-500/30 selection:text-amber-100 space-y-4"
              data-placeholder="Start drafting your chapter..."
            />
          </div>
        </div>

        {/* Slide-out Character Quick Reference Drawer */}
        {isCharDrawerOpen && (
          <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full z-20 shrink-0 shadow-2xl">
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">Character Quick Reference</span>
              </div>
              <button
                onClick={() => setIsCharDrawerOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 border-b border-neutral-800">
              <input
                type="text"
                value={charSearchTerm}
                onChange={(e) => setCharSearchTerm(e.target.value)}
                placeholder="Filter character traits..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredChars.map((char) => (
                <div
                  key={char.id}
                  className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-2.5 text-xs space-y-2 hover:border-neutral-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: char.color || '#f59e0b' }}
                        />
                        <span className="font-semibold text-neutral-200">{char.name}</span>
                      </div>
                      {char.occupation && (
                        <span className="text-[10px] text-neutral-500 block">{char.occupation}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => insertTextAtCursor(char.name)}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-medium flex items-center gap-1"
                      title="Insert name at cursor"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>Insert</span>
                    </button>
                  </div>

                  {char.physicalTraits && (
                    <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/60 text-[11px] leading-relaxed text-neutral-300">
                      <span className="font-medium text-amber-400/90 text-[10px] uppercase block mb-0.5">
                        Physical Traits:
                      </span>
                      {char.physicalTraits}
                    </div>
                  )}

                  {char.personalityTraits && (
                    <div className="text-[10.5px] text-neutral-400 leading-tight">
                      <span className="text-neutral-500 font-medium">Voice: </span>
                      {char.personalityTraits}
                    </div>
                  )}

                  {char.notes && (
                    <div className="text-[10px] text-neutral-500 italic border-t border-neutral-900 pt-1">
                      Notes: {char.notes}
                    </div>
                  )}
                </div>
              ))}

              {filteredChars.length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-xs">
                  No matching characters found.
                </div>
              )}
            </div>

            <div className="p-2 border-t border-neutral-800 bg-neutral-950/60 flex justify-between items-center text-[10px] text-neutral-400">
              <span>Click 'Insert' to add name to editor</span>
              <button
                onClick={() => onOpenCharacterModal()}
                className="text-amber-400 hover:underline"
              >
                + New Profile
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Editor Bottom Bar */}
      <footer className="h-9 border-t border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between text-xs text-neutral-400 select-none shrink-0">
        <div className="flex items-center gap-4">
          {/* Chapter Word Count & Goal */}
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-200 font-medium">{chapter.wordCount || 0}</span>
            <span className="text-neutral-600">/</span>
            {isEditingGoal ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="100"
                  min="100"
                  autoFocus
                  value={goalInput}
                  onChange={(e) => setGoalInput(parseInt(e.target.value, 10) || 500)}
                  onBlur={() => {
                    onUpdateChapter({ targetWordCount: goalInput });
                    setIsEditingGoal(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateChapter({ targetWordCount: goalInput });
                      setIsEditingGoal(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingGoal(false);
                    }
                  }}
                  className="w-16 bg-neutral-950 border border-amber-500 rounded px-1 py-0.5 text-[11px] text-white font-mono focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500">w</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setGoalInput(chapter.targetWordCount || (chapter.group === 'body' ? 2500 : 500));
                  setIsEditingGoal(true);
                }}
                className="hover:text-amber-300 transition flex items-center gap-1 group"
                title="Click to edit chapter word goal"
              >
                <span className="font-mono text-neutral-400 group-hover:text-amber-300">
                  {chapter.targetWordCount || (chapter.group === 'body' ? 2500 : 500)}w
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    Math.round(
                      ((chapter.wordCount || 0) /
                        (chapter.targetWordCount || (chapter.group === 'body' ? 2500 : 500))) *
                        100
                    ) >= 100
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {Math.min(
                    100,
                    Math.round(
                      ((chapter.wordCount || 0) /
                        (chapter.targetWordCount || (chapter.group === 'body' ? 2500 : 500))) *
                        100
                    )
                  )}
                  %
                </span>
              </button>
            )}
          </div>

          <span className="flex items-center gap-1.5 hidden sm:flex">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            ~{readingTimeMin} min read
          </span>
        </div>

        {/* Chapter Section Settings */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span>Include in TOC:</span>
            <input
              type="checkbox"
              checked={chapter.includeInToc}
              onChange={(e) => onUpdateChapter({ includeInToc: e.target.checked })}
              className="accent-amber-500 rounded"
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span>Page Break Before:</span>
            <input
              type="checkbox"
              checked={chapter.pageBreakBefore}
              onChange={(e) => onUpdateChapter({ pageBreakBefore: e.target.checked })}
              className="accent-amber-500 rounded"
            />
          </label>
        </div>
      </footer>
    </main>
  );
};
