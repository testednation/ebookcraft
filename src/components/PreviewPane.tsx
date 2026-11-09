import React, { useState } from 'react';
import { Book, Chapter, DeviceType, DeviceTheme, FootnoteItem } from '../types/book';
import { getDefaultStyleConfig } from '../services/themes';
import { getOrnamentSvg } from '../services/ornaments';
import { formatChapterContentHtml } from '../services/formattingEngine';
import {
  Smartphone,
  Tablet,
  BookOpen,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  Sparkles,
  Info,
} from 'lucide-react';

interface PreviewPaneProps {
  book: Book;
  chapter: Chapter;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ book, chapter }) => {
  const [device, setDevice] = useState<DeviceType>('apple-books');
  const [theme, setTheme] = useState<DeviceTheme>('sepia');
  const [activeFootnotePopup, setActiveFootnotePopup] = useState<FootnoteItem | null>(null);

  // Safe style config merge to eliminate any undefined errors
  const defaultStyles = getDefaultStyleConfig('literary');
  const safeStyles = {
    ...defaultStyles,
    ...(book?.styleConfig || {}),
  };

  const isPartDivider = chapter?.type === 'part';
  const isRtl = book?.direction === 'rtl' || safeStyles.direction === 'rtl' || chapter?.direction === 'rtl';

  // Theme styles for the reader container
  const THEME_CLASSES: Record<DeviceTheme, { bg: string; text: string; pageBg: string; border: string }> = {
    light: {
      bg: 'bg-stone-200',
      pageBg: 'bg-white',
      text: 'text-stone-900',
      border: 'border-stone-300',
    },
    sepia: {
      bg: 'bg-[#ebe4d6]',
      pageBg: 'bg-[#faf6ee]',
      text: 'text-[#2e261f]',
      border: 'border-[#dfd7c5]',
    },
    dark: {
      bg: 'bg-[#18181b]',
      pageBg: 'bg-[#202024]',
      text: 'text-[#e4e4e7]',
      border: 'border-[#2d2d34]',
    },
  };

  const currentTheme = THEME_CLASSES[theme];

  // Device container dimensions
  const DEVICE_STYLES: Record<DeviceType, string> = {
    kindle: 'w-full max-w-[430px] aspect-[9/14] rounded-2xl shadow-2xl border-4 sm:border-8 border-stone-800 p-4 sm:p-6',
    'apple-books': 'w-full max-w-[560px] aspect-[3/4] rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-[12px] border-stone-850 p-4 sm:p-8',
    'print-spread': 'w-full max-w-[620px] aspect-[5.5/8.5] rounded-lg shadow-2xl border-2 sm:border-4 border-stone-300 p-5 sm:p-10',
  };

  // Format chapter content through our typography engine
  const renderedHtml = formatChapterContentHtml(chapter?.content || '', safeStyles);

  const ornamentSvg = getOrnamentSvg(safeStyles.chapterOrnamentId || 'fleuron');

  return (
    <aside className="w-full lg:w-[45%] bg-stone-950 border-l border-stone-800 flex flex-col h-full overflow-hidden select-none">
      {/* Reader Controls Toolbar */}
      <div className="h-11 px-4 border-b border-stone-800 bg-stone-900/40 flex items-center justify-between shrink-0 text-xs">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            onClick={() => setDevice('kindle')}
            className={`p-1.5 rounded transition-colors ${
              device === 'kindle' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Kindle E-Reader Mode"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('apple-books')}
            className={`p-1.5 rounded transition-colors ${
              device === 'apple-books' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="iPad / Apple Books Retina Mode"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('print-spread')}
            className={`p-1.5 rounded transition-colors ${
              device === 'print-spread' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Print Spread Paperback Mode"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Paper Theme Switcher */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded transition-colors ${
              theme === 'light' ? 'bg-stone-700 text-stone-100' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="White paper"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('sepia')}
            className={`p-1.5 rounded transition-colors ${
              theme === 'sepia' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Warm cream paper"
          >
            <Coffee className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded transition-colors ${
              theme === 'dark' ? 'bg-stone-700 text-stone-100' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Night reader"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reader Screen Stage */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center ${currentTheme.bg}`}>
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`w-full ${DEVICE_STYLES[device]} ${currentTheme.pageBg} ${currentTheme.text} transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}
          style={{
            fontFamily: safeStyles.bodyFont || 'Georgia, serif',
            fontSize: `${safeStyles.fontSizePt || 11.5}pt`,
            lineHeight: safeStyles.lineSpacing || 1.5,
            direction: isRtl ? 'rtl' : 'ltr',
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          {/* Running Header (for print & iPad) */}
          <div className="text-[10px] uppercase tracking-widest text-center opacity-40 font-serif border-b border-black/5 pb-2 mb-4 shrink-0">
            {isPartDivider ? book.title : `${book.title} \u2022 ${chapter?.title || ''}`}
          </div>

          {/* Reader Body */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isPartDivider ? (
              /* Full-Page Part Divider Preview (Phase 2) */
              <div className="h-full flex flex-col justify-center items-center text-center py-12 px-4 space-y-4">
                <div className="text-xs uppercase tracking-[0.3em] opacity-60 font-serif">
                  PART {chapter.partNumber ? toRoman(chapter.partNumber) : 'I'}
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-serif font-bold tracking-wide"
                  style={{ fontFamily: safeStyles.headingFont || 'Cinzel, serif' }}
                >
                  {chapter.title || 'Untitled Part'}
                </h1>
                {chapter.subtitle && (
                  <p className="text-xs italic opacity-75 max-w-xs">{chapter.subtitle}</p>
                )}
                <div className="py-2 opacity-50 flex justify-center">
                  <div
                    className="w-8 h-4 fill-current text-current"
                    dangerouslySetInnerHTML={{ __html: ornamentSvg }}
                  />
                </div>
                {chapter.content && (
                  <div className="text-xs italic opacity-70 max-w-sm pt-2 leading-relaxed">
                    {chapter.content.replace(/<[^>]+>/g, '')}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Chapter Page Preview */
              <div>
                {/* Chapter Title & Header Ornament */}
                <div className="text-center mb-6">
                  {chapter.type === 'chapter' && (
                    <div className="text-[11px] uppercase tracking-[0.25em] opacity-60 mb-1 font-serif">
                      Chapter {chapter.number || 1}
                    </div>
                  )}
                  <h1
                    className="text-xl sm:text-2xl font-serif font-normal tracking-wide"
                    style={{ fontFamily: safeStyles.headingFont || 'Georgia, serif' }}
                  >
                    {chapter.title || 'Chapter Title'}
                  </h1>
                  {chapter.subtitle && (
                    <div className="text-xs italic opacity-60 mt-1 font-serif">
                      {chapter.subtitle}
                    </div>
                  )}
                  {safeStyles.chapterOrnamentId && safeStyles.chapterOrnamentId !== 'none' && (
                    <div className="mt-2 flex justify-center opacity-60">
                      <div
                        className="w-8 h-4 fill-current text-current"
                        dangerouslySetInnerHTML={{ __html: ornamentSvg }}
                      />
                    </div>
                  )}
                </div>

                {/* Formatted Story Prose with Drop Caps */}
                <div
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`prose-reader leading-relaxed space-y-3 ${isRtl ? 'text-right' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />

                {/* Footnotes Section at Bottom */}
                {chapter.footnotes && chapter.footnotes.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-black/10 text-[10px] space-y-1.5 opacity-80 font-serif">
                    <div className="font-semibold uppercase tracking-wider text-[9px] opacity-60">
                      Notes &amp; Citations
                    </div>
                    {chapter.footnotes.map((fn) => (
                      <div
                        key={fn.id}
                        onClick={() => setActiveFootnotePopup(fn)}
                        className="cursor-pointer hover:underline flex items-start gap-1"
                      >
                        <sup className="font-bold text-amber-700 dark:text-amber-400">[{fn.number}]</sup>
                        <span>{fn.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Running Page Number Footer */}
          <div className="text-[10px] font-serif text-center opacity-40 pt-2 shrink-0">
            &bull; {chapter?.order !== undefined ? chapter.order + 1 : 1} &bull;
          </div>

          {/* Interactive EPUB 3 Footnote Popup Simulation */}
          {activeFootnotePopup && (
            <div className="absolute inset-x-4 bottom-10 p-3 rounded-xl bg-stone-900 text-stone-100 shadow-2xl border border-amber-500/40 text-xs animate-fade-in z-20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Footnote {activeFootnotePopup.number} (EPUB 3 Popup)</span>
                </span>
                <button
                  onClick={() => setActiveFootnotePopup(null)}
                  className="text-stone-400 hover:text-stone-200 text-xs"
                >
                  &times;
                </button>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">{activeFootnotePopup.text}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
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
