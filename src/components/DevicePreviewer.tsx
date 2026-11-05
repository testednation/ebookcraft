import React, { useState } from 'react';
import { 
  Tablet, 
  Book, 
  Smartphone, 
  Sun, 
  Moon, 
  Coffee, 
  Type, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BookProject, BookSection, TRIM_SIZES } from '../types/book';
import { getThemeById } from '../services/themes';
import { getOrnamentSvg } from '../services/ornaments';

interface DevicePreviewerProps {
  book: BookProject;
  section: BookSection;
  allSections: BookSection[];
  onSelectSection: (id: string) => void;
}

type DeviceMode = 'kindle' | 'tablet' | 'print';
type ColorScheme = 'cream' | 'white' | 'sepia' | 'dark';

export const DevicePreviewer: React.FC<DevicePreviewerProps> = ({
  book,
  section,
  allSections,
  onSelectSection,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('kindle');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('cream');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const theme = getThemeById(book.themeId);
  const trim = TRIM_SIZES.find((t) => t.id === book.trimSize) || TRIM_SIZES[2];
  const ornamentSvg = getOrnamentSvg(book.ornamentKey || theme.ornamentKey);

  const currentIndex = allSections.findIndex((s) => s.id === section.id);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  const getColorStyles = () => {
    switch (colorScheme) {
      case 'white':
        return { bg: '#FFFFFF', text: '#111827', subtext: '#4B5563', border: '#E5E7EB' };
      case 'sepia':
        return { bg: '#F4ECD8', text: '#433422', subtext: '#7A6246', border: '#E3D7BE' };
      case 'dark':
        return { bg: '#18181B', text: '#E4E4E7', subtext: '#A1A1AA', border: '#27272A' };
      case 'cream':
      default:
        return { bg: '#FAF7EE', text: '#1C1917', subtext: '#57534E', border: '#E7E2D5' };
    }
  };

  const scheme = getColorStyles();

  return (
    <aside className="w-[480px] bg-neutral-950 border-l border-neutral-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Device Toolbar */}
      <div className="h-11 bg-neutral-950 border-b border-neutral-800/80 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => setDeviceMode('kindle')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              deviceMode === 'kindle'
                ? 'bg-neutral-800 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Kindle Paperwhite (E-ink E-Reader)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Kindle</span>
          </button>

          <button
            onClick={() => setDeviceMode('tablet')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              deviceMode === 'tablet'
                ? 'bg-neutral-800 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Apple Books (iPad & iPhone)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Apple Books</span>
          </button>

          <button
            onClick={() => setDeviceMode('print')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
              deviceMode === 'print'
                ? 'bg-neutral-800 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Print Book Spread (KDP / IngramSpark)"
          >
            <Book className="w-3.5 h-3.5" />
            <span>Print Spread</span>
          </button>
        </div>

        {/* Color & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {deviceMode !== 'kindle' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setColorScheme('cream')}
                className={`w-4 h-4 rounded-full border ${colorScheme === 'cream' ? 'ring-2 ring-amber-500' : 'border-neutral-600'}`}
                style={{ backgroundColor: '#FAF7EE' }}
                title="Cream Paper"
              />
              <button
                onClick={() => setColorScheme('white')}
                className={`w-4 h-4 rounded-full border ${colorScheme === 'white' ? 'ring-2 ring-amber-500' : 'border-neutral-600'}`}
                style={{ backgroundColor: '#FFFFFF' }}
                title="White Paper"
              />
              <button
                onClick={() => setColorScheme('sepia')}
                className={`w-4 h-4 rounded-full border ${colorScheme === 'sepia' ? 'ring-2 ring-amber-500' : 'border-neutral-600'}`}
                style={{ backgroundColor: '#F4ECD8' }}
                title="Sepia"
              />
              <button
                onClick={() => setColorScheme('dark')}
                className={`w-4 h-4 rounded-full border ${colorScheme === 'dark' ? 'ring-2 ring-amber-500' : 'border-neutral-600'}`}
                style={{ backgroundColor: '#18181B' }}
                title="Night Mode"
              />
            </div>
          )}

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
            className="p-1 text-neutral-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-neutral-400">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
            className="p-1 text-neutral-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Device Viewport Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-900/60">
        {deviceMode === 'kindle' && (
          /* Kindle Paperwhite Simulator */
          <div
            className="relative rounded-2xl bg-[#1c1b18] p-5 shadow-2xl border border-neutral-700/80 transition-transform origin-center"
            style={{ width: `${340 * (zoomLevel / 100)}px`, height: `${490 * (zoomLevel / 100)}px` }}
          >
            {/* Kindle Screen */}
            <div
              className="w-full h-full rounded bg-[#e8e4d8] text-[#1c1917] p-6 overflow-y-auto flex flex-col justify-between shadow-inner"
              style={{
                fontFamily: book.bodyFont || "'EB Garamond', serif",
                fontSize: `${(book.baseFontSize - 1) * (zoomLevel / 100)}px`,
                lineHeight: book.lineSpacing,
              }}
            >
              {/* Kindle Header */}
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex justify-between border-b border-neutral-400/40 pb-1 mb-4 select-none">
                <span className="truncate max-w-[140px]">{book.title}</span>
                <span>{section.title}</span>
              </div>

              {/* Manuscript text */}
              <div className="flex-1">
                {section.subtype !== 'title-page' && (
                  <div className="text-center mb-6">
                    <h2 className="text-base font-bold font-serif uppercase tracking-widest">{section.title}</h2>
                    {section.subtitle && <p className="text-xs italic text-neutral-600 mt-1">{section.subtitle}</p>}
                    <div className="my-3 opacity-60 flex justify-center" dangerouslySetInnerHTML={{ __html: ornamentSvg }} />
                  </div>
                )}
                <div
                  className={`leading-relaxed text-justify ${section.dropCap ? 'drop-cap-classic' : ''}`}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>

              {/* Kindle Footer */}
              <div className="text-[9px] text-neutral-500 flex justify-between border-t border-neutral-400/40 pt-1 mt-4 select-none">
                <span>Loc {currentIndex + 1} of {allSections.length}</span>
                <span>Kindle Paperwhite</span>
                <span>{Math.round(((currentIndex + 1) / allSections.length) * 100)}%</span>
              </div>
            </div>

            {/* Subtle Kindle Logo Bezel */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] uppercase text-neutral-500 font-sans font-bold">
              kindle
            </div>
          </div>
        )}

        {deviceMode === 'tablet' && (
          /* Apple Books / iPad Simulator */
          <div
            className="rounded-3xl bg-neutral-800 p-4 shadow-2xl border border-neutral-700 transition-transform origin-center"
            style={{ width: `${360 * (zoomLevel / 100)}px`, height: `${510 * (zoomLevel / 100)}px` }}
          >
            <div
              className="w-full h-full rounded-2xl p-6 overflow-y-auto flex flex-col justify-between transition-colors shadow-inner"
              style={{
                backgroundColor: scheme.bg,
                color: scheme.text,
                fontFamily: book.bodyFont || "'EB Garamond', serif",
                fontSize: `${book.baseFontSize * (zoomLevel / 100)}px`,
                lineHeight: book.lineSpacing,
              }}
            >
              {/* Apple Books Header */}
              <div className="text-[10px] text-center opacity-50 pb-2 mb-3 border-b border-black/10 dark:border-white/10 select-none">
                {book.author} — {section.title}
              </div>

              <div className="flex-1">
                {section.subtype !== 'title-page' && (
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-serif font-bold uppercase tracking-wider">{section.title}</h2>
                    {section.subtitle && <p className="text-xs italic opacity-75 mt-1">{section.subtitle}</p>}
                    <div className="my-3 opacity-60 flex justify-center" dangerouslySetInnerHTML={{ __html: ornamentSvg }} />
                  </div>
                )}
                <div
                  className={`leading-relaxed text-justify ${section.dropCap ? 'drop-cap-classic' : ''}`}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>

              {/* Apple Books Bottom Page Indicator */}
              <div className="text-[10px] text-center opacity-50 pt-2 mt-4 select-none">
                Page {currentIndex + 1}
              </div>
            </div>
          </div>
        )}

        {deviceMode === 'print' && (
          /* Physical Print Book Two-Page Spread */
          <div
            className="flex items-center shadow-2xl transition-transform origin-center"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Verso (Left Page) */}
            <div
              className="w-[190px] h-[280px] bg-white text-neutral-900 p-4 border-r border-neutral-300 rounded-l shadow-md flex flex-col justify-between overflow-hidden"
              style={{ fontFamily: book.bodyFont, fontSize: '9px', lineHeight: 1.5 }}
            >
              <div className="text-[7px] uppercase tracking-widest text-center text-neutral-400 select-none">
                {book.title}
              </div>
              <div className="flex-1 py-2 text-justify opacity-80 overflow-hidden">
                <p className="indent-2">
                  {prevSection
                    ? prevSection.content.replace(/<[^>]*>/g, '').slice(0, 320) + '...'
                    : 'The ancient stone halls echoed with the ticking of unnumbered gears. Dust drifted through shafts of cold amber sunlight...'}
                </p>
              </div>
              <div className="text-[7px] text-center text-neutral-500 select-none">
                {Math.max(1, (currentIndex + 1) * 2 - 1)}
              </div>
            </div>

            {/* Spine Shadow */}
            <div className="w-1.5 h-[280px] bg-gradient-to-r from-neutral-400/80 via-neutral-600 to-neutral-400/80 shrink-0" />

            {/* Recto (Right Page) */}
            <div
              className="w-[190px] h-[280px] bg-white text-neutral-900 p-4 rounded-r shadow-md flex flex-col justify-between overflow-hidden"
              style={{ fontFamily: book.bodyFont, fontSize: '9px', lineHeight: 1.5 }}
            >
              <div className="text-[7px] uppercase tracking-widest text-center text-neutral-400 select-none">
                {section.title}
              </div>
              <div className="flex-1 py-1 overflow-hidden">
                {section.subtype !== 'title-page' && (
                  <div className="text-center my-1">
                    <div className="text-[9px] font-bold uppercase tracking-wider">{section.title}</div>
                    <div className="my-1 scale-75 opacity-70 flex justify-center" dangerouslySetInnerHTML={{ __html: ornamentSvg }} />
                  </div>
                )}
                <div
                  className={`text-justify leading-tight ${section.dropCap ? 'drop-cap-classic' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: section.content.replace(/<div class="folio-scene-break".*?<\/div>/g, '<hr style="margin: 4px 0; border: none; border-top: 1px solid #ccc;"/>'),
                  }}
                />
              </div>
              <div className="text-[7px] text-center text-neutral-500 select-none">
                {(currentIndex + 1) * 2}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Bottom Chapter Pagination */}
      <div className="h-10 bg-neutral-950 border-t border-neutral-800/80 px-3 flex items-center justify-between text-xs text-neutral-400">
        <button
          onClick={() => prevSection && onSelectSection(prevSection.id)}
          disabled={!prevSection}
          className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="truncate max-w-[180px] font-medium text-neutral-300">
          {section.title} ({currentIndex + 1}/{allSections.length})
        </span>

        <button
          onClick={() => nextSection && onSelectSection(nextSection.id)}
          disabled={!nextSection}
          className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
