import React from 'react';
import { Edit3, BookOpen, Eye, Sparkles } from 'lucide-react';

export type MobileTab = 'editor' | 'chapters' | 'preview' | 'tools';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  chapterCount: number;
  wordCount: number;
  targetWordCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  chapterCount,
  wordCount,
  targetWordCount = 60000,
}) => {
  const progressPercent = Math.min(100, Math.round((wordCount / Math.max(1, targetWordCount)) * 100));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 pb-[env(safe-area-inset-bottom,0px)] select-none">
      {/* Top tiny progress indicator bar */}
      <div className="w-full h-1 bg-stone-900 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${Math.max(2, progressPercent)}%` }}
        />
      </div>

      <div className="grid grid-cols-4 h-14 items-center px-1">
        {/* Editor Tab */}
        <button
          onClick={() => onTabChange('editor')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'editor'
              ? 'text-amber-400 font-semibold scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Writing Editor"
        >
          <div className="relative">
            <Edit3 className="w-5 h-5" />
            {activeTab === 'editor' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Write</span>
        </button>

        {/* Chapters / Manuscript Tab */}
        <button
          onClick={() => onTabChange('chapters')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'chapters'
              ? 'text-amber-400 font-semibold scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Manuscript Chapters"
        >
          <div className="relative">
            <BookOpen className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold px-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
              {chapterCount}
            </span>
            {activeTab === 'chapters' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Chapters</span>
        </button>

        {/* Live Preview Tab */}
        <button
          onClick={() => onTabChange('preview')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'preview'
              ? 'text-amber-400 font-semibold scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Device Preview (Kindle & Print)"
        >
          <div className="relative">
            <Eye className="w-5 h-5" />
            {activeTab === 'preview' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Preview</span>
        </button>

        {/* Studio Tools Tab */}
        <button
          onClick={() => onTabChange('tools')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeTab === 'tools'
              ? 'text-amber-400 font-semibold scale-105'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Publishing Studio Tools"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {activeTab === 'tools' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Tools</span>
        </button>
      </div>
    </nav>
  );
};
