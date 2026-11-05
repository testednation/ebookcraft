import React, { useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Quote, 
  Sparkles, 
  AlignLeft, 
  AlignCenter, 
  Strikethrough,
  RemoveFormatting,
  Type
} from 'lucide-react';
import { BookSection, BookProject } from '../types/book';
import { createSceneBreakHtml, getOrnamentSvg } from '../services/ornaments';

interface EditorPaneProps {
  section: BookSection;
  book: BookProject;
  onChangeSection: (updated: BookSection) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  section,
  book,
  onChangeSection,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromPropRef = useRef(false);

  // Sync content into editable div only when section ID changes or external update
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== section.content) {
      isUpdatingFromPropRef.current = true;
      contentRef.current.innerHTML = section.content;
      isUpdatingFromPropRef.current = false;
    }
  }, [section.id]);

  const handleInput = () => {
    if (isUpdatingFromPropRef.current) return;
    if (contentRef.current) {
      onChangeSection({
        ...section,
        content: contentRef.current.innerHTML,
      });
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      onChangeSection({
        ...section,
        content: contentRef.current.innerHTML,
      });
    }
  };

  const insertSceneBreak = () => {
    const html = createSceneBreakHtml(book.ornamentKey || 'fleuron');
    document.execCommand('insertHTML', false, html + '<p><br/></p>');
    if (contentRef.current) {
      onChangeSection({
        ...section,
        content: contentRef.current.innerHTML,
      });
    }
  };

  const insertPoetryVerse = () => {
    const verseHtml = `<blockquote class="folio-verse" style="margin: 1.5rem 2rem; font-style: italic; border-left: 2px solid #52525b; padding-left: 1rem;"><p>Line of poetry...<br/>Second line of verse...</p></blockquote><p><br/></p>`;
    document.execCommand('insertHTML', false, verseHtml);
    if (contentRef.current) {
      onChangeSection({
        ...section,
        content: contentRef.current.innerHTML,
      });
    }
  };

  const currentOrnamentSvg = getOrnamentSvg(book.ornamentKey || 'fleuron');

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 border-r border-neutral-800/80 overflow-hidden">
      {/* Editor Top Toolbar */}
      <div className="h-11 bg-neutral-950 border-b border-neutral-800/80 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => executeCommand('bold')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('italic')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Paragraph"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={insertPoetryVerse}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition text-xs"
            title="Poetry / Verse Block"
          >
            <span className="font-serif italic font-bold">V</span>
          </button>

          <button
            onClick={insertSceneBreak}
            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 rounded border border-amber-800/40 transition"
            title="Insert Ornamental Scene Break"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">Scene Break</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={() => executeCommand('removeFormat')}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Options & Toggles */}
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={section.dropCap}
              onChange={(e) => onChangeSection({ ...section, dropCap: e.target.checked })}
              className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
            />
            <span>Drop Cap</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={section.includeInToc}
              onChange={(e) => onChangeSection({ ...section, includeInToc: e.target.checked })}
              className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
            />
            <span>In TOC</span>
          </label>
        </div>
      </div>

      {/* Editor Content Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Chapter Header Controls */}
          <div className="mb-8 pb-6 border-b border-neutral-800/80 space-y-3">
            <input
              type="text"
              value={section.title}
              onChange={(e) => onChangeSection({ ...section, title: e.target.value })}
              placeholder="Chapter Title..."
              className="w-full text-2xl font-serif font-bold text-neutral-100 bg-transparent border-0 border-b border-transparent focus:border-amber-500/80 focus:outline-none pb-1 placeholder:text-neutral-600"
            />

            <input
              type="text"
              value={section.subtitle || ''}
              onChange={(e) => onChangeSection({ ...section, subtitle: e.target.value })}
              placeholder="Chapter Subtitle (optional)..."
              className="w-full text-sm italic font-serif text-neutral-400 bg-transparent border-0 border-b border-transparent focus:border-neutral-700 focus:outline-none pb-1 placeholder:text-neutral-600"
            />

            {section.type === 'body' && (
              <input
                type="text"
                value={section.epigraph || ''}
                onChange={(e) => onChangeSection({ ...section, epigraph: e.target.value })}
                placeholder="Chapter Epigraph or Opening Quote (optional)..."
                className="w-full text-xs italic text-neutral-400 bg-transparent border-0 border-b border-transparent focus:border-neutral-700 focus:outline-none pb-1 placeholder:text-neutral-600"
              />
            )}

            {/* Ornamental Flourish Preview */}
            <div 
              className="py-2 text-neutral-400 opacity-60 flex justify-center cursor-pointer hover:opacity-100 transition"
              title="Chapter Ornamental Divider"
              dangerouslySetInnerHTML={{ __html: currentOrnamentSvg }}
            />
          </div>

          {/* Editable Manuscript Body */}
          <div
            ref={contentRef}
            contentEditable
            onInput={handleInput}
            spellCheck="true"
            className={`prose prose-invert max-w-none focus:outline-none min-h-[450px] text-[15px] leading-relaxed text-neutral-200 font-serif ${
              section.dropCap ? 'drop-cap-classic' : ''
            }`}
            style={{
              fontFamily: book.bodyFont || "'EB Garamond', Georgia, serif",
              lineHeight: book.lineSpacing || 1.6,
            }}
          />
        </div>
      </div>
    </div>
  );
};
