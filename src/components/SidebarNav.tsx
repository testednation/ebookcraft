import React, { useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Upload, 
  Bookmark, 
  Award, 
  User, 
  AlignLeft,
  BookMarked
} from 'lucide-react';
import { BookSection, SectionType, SectionSubtype } from '../types/book';

interface SidebarNavProps {
  sections: BookSection[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  onAddSection: (type: SectionType, subtype: SectionSubtype, title: string) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onImportFile: (file: File) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onImportFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const frontMatter = sections.filter((s) => s.type === 'front');
  const bodyMatter = sections.filter((s) => s.type === 'body');
  const backMatter = sections.filter((s) => s.type === 'back');

  const getSubtypeIcon = (subtype: SectionSubtype) => {
    switch (subtype) {
      case 'title-page':
      case 'copyright':
      case 'dedication':
      case 'epigraph':
        return <Bookmark className="w-3.5 h-3.5 opacity-70" />;
      case 'acknowledgments':
        return <Award className="w-3.5 h-3.5 opacity-70" />;
      case 'about-author':
      case 'also-by':
        return <User className="w-3.5 h-3.5 opacity-70" />;
      default:
        return <FileText className="w-3.5 h-3.5 opacity-70" />;
    }
  };

  const renderSectionItem = (sec: BookSection, index: number, total: number) => {
    const isActive = sec.id === activeSectionId;

    return (
      <div
        key={sec.id}
        onClick={() => onSelectSection(sec.id)}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors ${
          isActive
            ? 'bg-neutral-800 text-amber-300 font-medium border-l-2 border-amber-500'
            : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {getSubtypeIcon(sec.subtype)}
          <span className="truncate">{sec.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-mono tabular-nums text-neutral-400 group-hover:hidden">
            {sec.wordCount > 0 ? `${sec.wordCount}w` : ''}
          </span>

          <div className="hidden group-hover:flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveSection(sec.id, 'up');
              }}
              disabled={index === 0}
              className="p-1 hover:text-white text-neutral-400 disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Move up"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveSection(sec.id, 'down');
              }}
              disabled={index === total - 1}
              className="p-1 hover:text-white text-neutral-400 disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Move down"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            {sections.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${sec.title}"?`)) {
                    onDeleteSection(sec.id);
                  }
                }}
                className="p-1 hover:text-rose-400 text-neutral-400"
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

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800/80 flex flex-col h-full shrink-0 select-none">
      <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Book Structure
        </span>
        <button
          onClick={() => {
            const chapterNum = bodyMatter.length + 1;
            onAddSection('body', 'chapter', `Chapter ${chapterNum}`);
          }}
          className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition"
          title="Add New Chapter"
        >
          <Plus className="w-3 h-3" />
          <span>Chapter</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Front Matter */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Front Matter</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddSection('front', 'dedication', 'Dedication')}
                className="hover:text-neutral-200"
                title="Add Dedication"
              >
                + Dedication
              </button>
            </div>
          </div>
          <div className="space-y-0.5 mt-1">
            {frontMatter.map((sec, idx) => renderSectionItem(sec, idx, frontMatter.length))}
          </div>
        </div>

        {/* Body Matter */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Body & Chapters</span>
            <button
              onClick={() => onAddSection('body', 'prologue', 'Prologue')}
              className="hover:text-neutral-200"
              title="Add Prologue"
            >
              + Prologue
            </button>
          </div>
          <div className="space-y-0.5 mt-1">
            {bodyMatter.map((sec, idx) => renderSectionItem(sec, idx, bodyMatter.length))}
          </div>
        </div>

        {/* Back Matter */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            <span>Back Matter</span>
            <button
              onClick={() => onAddSection('back', 'epilogue', 'Epilogue')}
              className="hover:text-neutral-200"
              title="Add Epilogue"
            >
              + Epilogue
            </button>
          </div>
          <div className="space-y-0.5 mt-1">
            {backMatter.map((sec, idx) => renderSectionItem(sec, idx, backMatter.length))}
          </div>
        </div>
      </div>

      {/* Quick Add & Import Section */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40 space-y-2">
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.md,.markdown"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onImportFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-md transition"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-400" />
          <span>Import Text / Markdown</span>
        </button>

        <div className="grid grid-cols-2 gap-1 text-[11px]">
          <button
            onClick={() => onAddSection('back', 'acknowledgments', 'Acknowledgments')}
            className="py-1 px-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded text-left truncate"
          >
            + Ack.
          </button>
          <button
            onClick={() => onAddSection('back', 'about-author', 'About the Author')}
            className="py-1 px-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded text-left truncate"
          >
            + About Author
          </button>
        </div>
      </div>
    </aside>
  );
};
