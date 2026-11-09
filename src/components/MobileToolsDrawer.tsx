import React from 'react';
import { Book } from '../types/book';
import {
  X,
  BookMarked,
  Wand2,
  TrendingUp,
  ShieldCheck,
  Layers,
  Users,
  Sliders,
  Target,
  Upload,
  Download,
  Sparkles,
  Keyboard,
  Clock,
  BookOpen,
} from 'lucide-react';

interface MobileToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  totalWords: number;
  readingTimeMinutes: number;
  onOpenBackmatterModal: () => void;
  onOpenDocumentCleaner: () => void;
  onOpenWritingVelocity: () => void;
  onOpenPreflight: () => void;
  onOpenCoverWrap: () => void;
  onOpenCharacters: () => void;
  onOpenStyleModal: () => void;
  onOpenBookDetails: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onOpenRoadmap: () => void;
  onOpenShortcuts: () => void;
}

export const MobileToolsDrawer: React.FC<MobileToolsDrawerProps> = ({
  isOpen,
  onClose,
  book,
  totalWords,
  readingTimeMinutes,
  onOpenBackmatterModal,
  onOpenDocumentCleaner,
  onOpenWritingVelocity,
  onOpenPreflight,
  onOpenCoverWrap,
  onOpenCharacters,
  onOpenStyleModal,
  onOpenBookDetails,
  onOpenImportModal,
  onOpenExportModal,
  onOpenRoadmap,
  onOpenShortcuts,
}) => {
  if (!isOpen) return null;

  const triggerTool = (fn: () => void) => {
    onClose();
    setTimeout(() => {
      fn();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)]">
        {/* Grab handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-700/80" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold font-serif text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Publishing Studio Tools</span>
            </h3>
            <p className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>{totalWords.toLocaleString()} words</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3" />
                ~{readingTimeMinutes}m read
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            title="Close Tools"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Tools Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group 1: Book Essentials */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-1 mb-2">
              Editorial &amp; Manuscript
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {/* Backmatter Manager */}
              <button
                onClick={() => triggerTool(onOpenBackmatterModal)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Backmatter</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">About Author, Copyright, Newsletter</div>
                </div>
              </button>

              {/* Clean Document */}
              <button
                onClick={() => triggerTool(onOpenDocumentCleaner)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Clean Doc</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">Quotes, em-dashes &amp; dedup</div>
                </div>
              </button>

              {/* Characters Bible */}
              <button
                onClick={() => triggerTool(onOpenCharacters)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-indigo-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Cast Bible</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">Character profiles &amp; arcs</div>
                </div>
              </button>

              {/* Import Manuscript */}
              <button
                onClick={() => triggerTool(onOpenImportModal)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-emerald-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Import DOCX</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">Word, MD, TXT import</div>
                </div>
              </button>
            </div>
          </div>

          {/* Group 2: Print & Production */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-1 mb-2">
              Publishing &amp; Production
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {/* Cover Wrap Designer */}
              <button
                onClick={() => triggerTool(onOpenCoverWrap)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Cover Wrap</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">360° Spine &amp; Barcode</div>
                </div>
              </button>

              {/* Pre-Flight Proof */}
              <button
                onClick={() => triggerTool(onOpenPreflight)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-emerald-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Pre-Flight</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">KDP print proof audit</div>
                </div>
              </button>

              {/* Styling & Typography */}
              <button
                onClick={() => triggerTool(onOpenStyleModal)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Styling</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">Fonts, themes &amp; ornaments</div>
                </div>
              </button>

              {/* Book Details & Goals */}
              <button
                onClick={() => triggerTool(onOpenBookDetails)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Book Details</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">Title, author, ISBN &amp; goals</div>
                </div>
              </button>
            </div>
          </div>

          {/* Group 3: Writing Analytics & Export */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-1 mb-2">
              Writing Velocity &amp; Export
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {/* Writing Velocity */}
              <button
                onClick={() => triggerTool(onOpenWritingVelocity)}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 active:bg-stone-800 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Writing Velocity</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">30-day analytics &amp; charts</div>
                </div>
              </button>

              {/* Export Modal */}
              <button
                onClick={() => triggerTool(onOpenExportModal)}
                className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 active:bg-emerald-600 text-left flex items-start gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300">Export Studio</div>
                  <div className="text-[10px] text-emerald-400/80 line-clamp-1">EPUB 3, PDF &amp; Word</div>
                </div>
              </button>
            </div>
          </div>

          {/* Secondary Quick Links */}
          <div className="pt-2 flex items-center justify-between text-xs text-stone-400 border-t border-stone-800">
            <button
              onClick={() => triggerTool(onOpenRoadmap)}
              className="py-1 px-2 rounded-lg hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Parity Roadmap</span>
            </button>

            <button
              onClick={() => triggerTool(onOpenShortcuts)}
              className="py-1 px-2 rounded-lg hover:text-stone-200 flex items-center gap-1.5 transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
