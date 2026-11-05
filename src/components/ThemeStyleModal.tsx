import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { BookProject, NumberFormat } from '../types/book';
import { GENRE_THEMES, getThemeById } from '../services/themes';
import { ORNAMENTS, getOrnamentSvg } from '../services/ornaments';

interface ThemeStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookProject;
  onUpdateBook: (updated: BookProject) => void;
}

export const ThemeStyleModal: React.FC<ThemeStyleModalProps> = ({
  isOpen,
  onClose,
  book,
  onUpdateBook,
}) => {
  if (!isOpen) return null;

  const currentTheme = getThemeById(book.themeId);
  const ornamentSvg = getOrnamentSvg(book.ornamentKey || currentTheme.ornamentKey);

  const applyPreset = (themeId: string) => {
    const theme = getThemeById(themeId);
    onUpdateBook({
      ...book,
      themeId: theme.id,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      ornamentKey: theme.ornamentKey,
      dropCapStyle: theme.dropCapStyle,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Book Styling & Genre Themes</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Suites */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              1. Genre Style Presets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GENRE_THEMES.map((theme) => {
                const isSelected = book.themeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => applyPreset(theme.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm text-neutral-100">{theme.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">{theme.description}</p>
                    <div className="text-[11px] text-amber-400/90 font-mono">
                      {theme.headingFont.split(',')[0].replace(/['"]/g, '')} + {theme.bodyFont.split(',')[0].replace(/['"]/g, '')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Customizer */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
              2. Fine-Tuned Typography & Flourishes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Heading Font */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Chapter Heading Font</label>
                <select
                  value={book.headingFont}
                  onChange={(e) => onUpdateBook({ ...book, headingFont: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond (Literary)</option>
                  <option value="'Cinzel', serif">Cinzel (Fantasy / Ornate)</option>
                  <option value="'Playfair Display', Georgia, serif">Playfair Display (Editorial)</option>
                  <option value="'Plus Jakarta Sans', system-ui, sans-serif">Plus Jakarta Sans (Modern)</option>
                  <option value="'EB Garamond', Georgia, serif">EB Garamond (Traditional)</option>
                </select>
              </div>

              {/* Body Font */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Body Book Font</label>
                <select
                  value={book.bodyFont}
                  onChange={(e) => onUpdateBook({ ...book, bodyFont: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="'EB Garamond', Georgia, serif">EB Garamond (Classic Book Serif)</option>
                  <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond</option>
                  <option value="'Plus Jakarta Sans', system-ui, sans-serif">Plus Jakarta Sans (Modern Non-Fiction)</option>
                  <option value="Georgia, serif">Georgia (Universal Serif)</option>
                </select>
              </div>

              {/* Ornamental Flourish */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Ornamental Scene Break</label>
                <select
                  value={book.ornamentKey}
                  onChange={(e) => onUpdateBook({ ...book, ornamentKey: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  {ORNAMENTS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drop Cap & Number Format Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Drop Cap Style</label>
                <select
                  value={book.dropCapStyle}
                  onChange={(e) =>
                    onUpdateBook({
                      ...book,
                      dropCapStyle: e.target.value as 'classic' | 'modern' | 'ornate' | 'none',
                    })
                  }
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="classic">Classic Serif Drop Cap</option>
                  <option value="modern">Modern Colored Accent</option>
                  <option value="ornate">Ornate Cinzel Letter</option>
                  <option value="none">Disabled (No Drop Cap)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Chapter Numbering</label>
                <select
                  value={book.numberFormat}
                  onChange={(e) => onUpdateBook({ ...book, numberFormat: e.target.value as NumberFormat })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-md p-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Roman">Roman Numerals (Chapter I, II, III)</option>
                  <option value="Arabic">Arabic Numerals (Chapter 1, 2, 3)</option>
                  <option value="Word">Spelled Out (Chapter One, Two)</option>
                  <option value="None">None (Titles Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Body Font Size: <span className="font-mono text-amber-400">{book.baseFontSize}px</span>
                </label>
                <input
                  type="range"
                  min="13"
                  max="19"
                  step="0.5"
                  value={book.baseFontSize}
                  onChange={(e) => onUpdateBook({ ...book, baseFontSize: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Preview Chapter Header & Body
            </h3>
            <div className="p-6 rounded-lg bg-[#FAF7EE] text-[#1C1917] shadow-inner text-center">
              <h4
                className="text-xl font-bold uppercase tracking-wider"
                style={{ fontFamily: book.headingFont }}
              >
                Chapter IV
              </h4>
              <p className="text-xs italic text-neutral-600 mt-1">The Alchemist’s Gate</p>
              <div
                className="my-3 opacity-80 flex justify-center"
                dangerouslySetInnerHTML={{ __html: ornamentSvg }}
              />
              <p
                className={`text-sm text-justify max-w-md mx-auto leading-relaxed mt-4 ${
                  book.dropCapStyle === 'modern'
                    ? 'drop-cap-modern'
                    : book.dropCapStyle === 'ornate'
                    ? 'drop-cap-ornate'
                    : book.dropCapStyle === 'classic'
                    ? 'drop-cap-classic'
                    : ''
                }`}
                style={{ fontFamily: book.bodyFont, lineHeight: book.lineSpacing }}
              >
                In the shadow of the cathedral spire, old clocks ticked in unison, keeping time for a city that had long forgotten how to listen to the stars.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
          >
            Apply Styling
          </button>
        </div>
      </div>
    </div>
  );
};
