import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Book, Chapter, DeviceType, DeviceTheme } from '../types/book';
import { formatChapterHtml } from '../services/formattingEngine';
import { getOrnamentById } from '../services/ornaments';
import { getDefaultStyleConfig } from '../services/themes';

interface PreviewPaneProps {
  book: Book;
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onClose: () => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  book,
  chapters,
  activeChapterId,
  onSelectChapter,
  onClose,
}) => {
  const [device, setDevice] = useState<DeviceType>('kindle');
  const [theme, setTheme] = useState<DeviceTheme>('light');
  const [zoom, setZoom] = useState<number>(100);

  const currentIndex = chapters.findIndex((c) => c.id === activeChapterId);
  const currentChapter = chapters[currentIndex] || chapters[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectChapter(chapters[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) {
      onSelectChapter(chapters[currentIndex + 1].id);
    }
  };

  const style = {
    ...getDefaultStyleConfig('literary'),
    ...(book?.styleConfig || {}),
  };
  const formattedHtml = currentChapter
    ? formatChapterHtml(currentChapter.content, style, currentChapter.customOrnamentId)
    : '';

  const chapterOrnamentDef = getOrnamentById(style?.chapterOrnamentId || 'fleuron');

  // Theme color maps
  const themeClasses: Record<DeviceTheme, { bg: string; text: string; headerText: string; bezel: string }> = {
    light: {
      bg: 'bg-white',
      text: 'text-neutral-900',
      headerText: 'text-neutral-500',
      bezel: 'bg-neutral-800',
    },
    sepia: {
      bg: 'bg-[#f6f1e7]',
      text: 'text-[#443729]',
      headerText: 'text-[#85735f]',
      bezel: 'bg-neutral-800',
    },
    dark: {
      bg: 'bg-neutral-900',
      text: 'text-neutral-200',
      headerText: 'text-neutral-500',
      bezel: 'bg-neutral-950 border border-neutral-800',
    },
  };

  const currentThemeStyle = themeClasses[theme];

  return (
    <aside className="w-[480px] lg:w-[560px] xl:w-[640px] bg-neutral-900 border-l border-neutral-800 flex flex-col h-full select-none shrink-0 z-10 transition-all">
      {/* Top Preview Controls */}
      <div className="h-11 border-b border-neutral-800 bg-neutral-950/70 px-3 flex items-center justify-between text-xs text-neutral-300 shrink-0">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => setDevice('kindle')}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
              device === 'kindle' ? 'bg-neutral-800 text-amber-300' : 'text-neutral-400 hover:text-white'
            }`}
            title="Kindle Paperwhite (6.8-inch)"
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden sm:inline">Kindle</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('apple-books')}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
              device === 'apple-books'
                ? 'bg-neutral-800 text-amber-300'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Apple Books (iPad & iPhone)"
          >
            <Tablet className="w-3 h-3" />
            <span className="hidden sm:inline">Apple Books</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('print-spread')}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
              device === 'print-spread'
                ? 'bg-neutral-800 text-amber-300'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Two-Page Hardcover Print Spread"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Print Spread</span>
          </button>
        </div>

        {/* Color Theme & Zoom */}
        <div className="flex items-center gap-2">
          {/* Theme toggles */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-md border border-neutral-800">
            <button
              onClick={() => setTheme('light')}
              className={`p-1 rounded ${theme === 'light' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500'}`}
              title="Light Paper"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1 rounded ${theme === 'sepia' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500'}`}
              title="Warm Sepia"
            >
              <Coffee className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1 rounded ${theme === 'dark' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500'}`}
              title="Dark Night"
            >
              <Moon className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 ml-1"
            title="Close Preview (Ctrl+P)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Simulator Viewport */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start bg-neutral-950/80">
        {/* Device Frame */}
        {device === 'kindle' && (
          <div className="w-[360px] sm:w-[410px] rounded-[24px] bg-neutral-900 p-4 border border-neutral-800 shadow-2xl relative my-auto">
            {/* Kindle Bezel Header */}
            <div className="text-[10px] text-neutral-500 flex justify-between items-center px-4 pt-1 pb-2">
              <span className="font-sans font-medium">Kindle</span>
              <span className="font-mono">10:42 AM &bull; 94%</span>
            </div>

            {/* Screen */}
            <div
              className={`rounded-lg ${currentThemeStyle.bg} ${currentThemeStyle.text} p-6 h-[560px] overflow-y-auto shadow-inner`}
              style={{
                fontFamily: style.bodyFont,
                fontSize: `${style.fontSizePt}pt`,
                lineHeight: style.lineSpacing,
              }}
            >
              {/* Running Header */}
              <div className="text-center text-[10px] uppercase tracking-wider text-neutral-400 pb-4 mb-2 border-b border-neutral-300/40">
                {book.title}
              </div>

              {/* Chapter Header */}
              {currentChapter && (
                <div className="text-center my-6">
                  <h1
                    className="text-xl uppercase tracking-wider font-semibold"
                    style={{ fontFamily: style.headingFont }}
                  >
                    {currentChapter.title}
                  </h1>
                  {currentChapter.subtitle && (
                    <p className="text-xs italic text-neutral-500 mt-1">
                      {currentChapter.subtitle}
                    </p>
                  )}
                  {chapterOrnamentDef.svg && (
                    <div
                      className="my-3 text-neutral-600 dark:text-neutral-400"
                      dangerouslySetInnerHTML={{ __html: chapterOrnamentDef.svg }}
                    />
                  )}
                </div>
              )}

              {/* Formatted Content */}
              <div
                className="preview-prose leading-relaxed space-y-3"
                style={{
                  textIndent: `${style.paragraphIndentEm}em`,
                }}
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
              />

              {/* Running Footer */}
              <div className="text-center text-[9px] text-neutral-400 pt-8 pb-2">
                Page {currentIndex + 1} of {chapters.length} &bull; 24 mins left in book
              </div>
            </div>

            {/* Kindle Bottom Logo */}
            <div className="text-center py-2 text-[11px] font-sans text-neutral-600 uppercase tracking-widest font-semibold">
              kindle
            </div>
          </div>
        )}

        {device === 'apple-books' && (
          <div className="w-[380px] sm:w-[440px] rounded-[32px] bg-neutral-900 p-5 border border-neutral-700/60 shadow-2xl relative my-auto">
            {/* iPad Camera Notch */}
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 mx-auto mb-2 border border-neutral-800" />

            {/* Screen */}
            <div
              className={`rounded-[18px] ${currentThemeStyle.bg} ${currentThemeStyle.text} p-7 h-[580px] overflow-y-auto shadow-inner`}
              style={{
                fontFamily: style.bodyFont,
                fontSize: `${style.fontSizePt}pt`,
                lineHeight: style.lineSpacing,
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-6 font-sans">
                <span>{book.author}</span>
                <span>{currentChapter?.title}</span>
              </div>

              {/* Chapter Header */}
              {currentChapter && (
                <div className="text-center my-6">
                  <h1
                    className="text-2xl uppercase tracking-wider font-semibold"
                    style={{ fontFamily: style.headingFont }}
                  >
                    {currentChapter.title}
                  </h1>
                  {currentChapter.subtitle && (
                    <p className="text-sm italic text-neutral-500 mt-1">
                      {currentChapter.subtitle}
                    </p>
                  )}
                  {chapterOrnamentDef.svg && (
                    <div
                      className="my-3 text-neutral-600"
                      dangerouslySetInnerHTML={{ __html: chapterOrnamentDef.svg }}
                    />
                  )}
                </div>
              )}

              {/* Formatted Content */}
              <div
                className="preview-prose leading-relaxed space-y-3"
                style={{
                  textIndent: `${style.paragraphIndentEm}em`,
                }}
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
              />

              <div className="text-center text-[10px] text-neutral-400 pt-8 pb-1">
                {currentIndex + 1}
              </div>
            </div>
          </div>
        )}

        {device === 'print-spread' && (
          <div className="w-full max-w-[580px] bg-neutral-900 p-3 rounded-xl border border-neutral-800 shadow-2xl my-auto">
            <div className="text-center text-[10px] text-neutral-400 uppercase tracking-widest pb-2 font-mono">
              Print Spread ({style.trimSize} Trim)
            </div>

            <div className="flex bg-[#fcfaf7] text-neutral-900 rounded-lg overflow-hidden shadow-lg border border-neutral-300/80 h-[520px]">
              {/* Left Page (Verso) */}
              <div
                className="flex-1 p-5 border-r border-neutral-300/80 flex flex-col justify-between overflow-hidden"
                style={{
                  fontFamily: style.bodyFont,
                  fontSize: `${style.fontSizePt - 1}pt`,
                  lineHeight: style.lineSpacing,
                }}
              >
                <div className="text-center text-[9px] uppercase tracking-wider text-neutral-400">
                  {book.author}
                </div>
                <div className="flex-1 py-4 text-xs italic text-neutral-500 flex items-center justify-center text-center">
                  <span>[Previous Page Facing Spread]</span>
                </div>
                <div className="text-center text-[9px] text-neutral-500 font-mono">
                  {currentIndex * 2 + 1}
                </div>
              </div>

              {/* Right Page (Recto) */}
              <div
                className="flex-1 p-5 flex flex-col justify-between overflow-y-auto"
                style={{
                  fontFamily: style.bodyFont,
                  fontSize: `${style.fontSizePt - 1}pt`,
                  lineHeight: style.lineSpacing,
                }}
              >
                <div className="text-center text-[9px] uppercase tracking-wider text-neutral-400">
                  {currentChapter?.title}
                </div>

                <div className="flex-1 py-2">
                  <div className="text-center my-3">
                    <h2
                      className="text-base uppercase tracking-wider font-semibold"
                      style={{ fontFamily: style.headingFont }}
                    >
                      {currentChapter?.title}
                    </h2>
                    {chapterOrnamentDef.svg && (
                      <div
                        className="my-2 transform scale-75 origin-center"
                        dangerouslySetInnerHTML={{ __html: chapterOrnamentDef.svg }}
                      />
                    )}
                  </div>
                  <div
                    className="preview-prose leading-relaxed space-y-2 text-justify"
                    style={{ textIndent: `${style.paragraphIndentEm}em` }}
                    dangerouslySetInnerHTML={{ __html: formattedHtml }}
                  />
                </div>

                <div className="text-center text-[9px] text-neutral-500 font-mono">
                  {currentIndex * 2 + 2}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Navigation Footer */}
      <div className="h-12 border-t border-neutral-800 bg-neutral-950/80 px-4 flex items-center justify-between text-xs text-neutral-400 select-none shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="text-[11px] font-medium text-neutral-300 truncate max-w-[200px]">
          {currentChapter?.title || 'No Chapter'}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex >= chapters.length - 1}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
