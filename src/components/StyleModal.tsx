import React from 'react';
import { StyleConfig, GenreThemeId, FontChoice, DropCapStyle } from '../types/book';
import { GENRE_THEMES, THEME_PRESETS, ThemePreset } from '../services/themes';
import { ORNAMENT_COLLECTION, OrnamentDefinition } from '../services/ornaments';
import { X, Palette, Type, BookOpen, Sliders } from 'lucide-react';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleConfig: StyleConfig;
  onUpdateStyle: (updated: Partial<StyleConfig>) => void;
}

const FONTS: { id: FontChoice; label: string; sample: string }[] = [
  { id: 'Cormorant Garamond', label: 'Cormorant Garamond', sample: 'Classic literary prestige' },
  { id: 'EB Garamond', label: 'EB Garamond', sample: 'Timeless humanist serif' },
  { id: 'Playfair Display', label: 'Playfair Display', sample: 'High-contrast editorial' },
  { id: 'Spectral', label: 'Spectral', sample: 'Crisp & readable novel serif' },
  { id: 'Cinzel', label: 'Cinzel', sample: 'Imperial fantasy capital' },
  { id: 'Inter', label: 'Inter', sample: 'Clean modern sans-serif' },
];

export const StyleModal: React.FC<StyleModalProps> = ({
  isOpen,
  onClose,
  styleConfig,
  onUpdateStyle,
}) => {
  if (!isOpen) return null;

  const handleSelectTheme = (themeId: GenreThemeId) => {
    const preset = THEME_PRESETS.find((p) => p.id === themeId);
    if (preset) {
      onUpdateStyle({
        ...preset.config,
        themeId,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">Book Styling &amp; Typography</h2>
              <p className="text-xs text-stone-400">
                Match the gold standard of Vellum with curated genre presets, drop caps, and fleurons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Theme Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Genre Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GENRE_THEMES.map((theme: ThemePreset) => {
                const isSelected = styleConfig.themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-stone-200">{theme.name}</div>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Body Typeface</span>
              </label>
              <select
                value={styleConfig.bodyFont}
                onChange={(e) => onUpdateStyle({ bodyFont: e.target.value as FontChoice })}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.sample})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chapter &amp; Heading Typeface</span>
              </label>
              <select
                value={styleConfig.headingFont}
                onChange={(e) => onUpdateStyle({ headingFont: e.target.value as FontChoice })}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Cap & Lead-in */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Drop Caps &amp; Opening Styling</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'none', label: 'None', desc: 'Plain opening' },
                  { id: 'simple', label: 'Simple Serif', desc: 'Clean drop cap' },
                  { id: 'illuminated', label: 'Illuminated', desc: 'Gold background' },
                  { id: 'raised', label: 'Raised', desc: 'Top aligned' },
                ] as const
              ).map((dc) => (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => onUpdateStyle({ dropCap: dc.id as DropCapStyle })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    styleConfig.dropCap === dc.id
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-medium">{dc.label}</div>
                  <div className="text-[10px] text-stone-500">{dc.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={styleConfig.firstParagraphDropCap}
                  onChange={(e) => onUpdateStyle({ firstParagraphDropCap: e.target.checked })}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                />
                Apply Drop Cap to Chapter Openings
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={styleConfig.firstParagraphSmallCaps}
                  onChange={(e) => onUpdateStyle({ firstParagraphSmallCaps: e.target.checked })}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                />
                Lead-in Small-Caps (First 4 words)
              </label>
            </div>
          </div>

          {/* Ornaments Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                Chapter Header Flourish
              </label>
              <select
                value={styleConfig.chapterOrnamentId || 'fleuron'}
                onChange={(e) => onUpdateStyle({ chapterOrnamentId: e.target.value })}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {ORNAMENT_COLLECTION.map((o: OrnamentDefinition) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                Scene Break Fleuron (***)
              </label>
              <select
                value={styleConfig.sceneBreakOrnamentId || 'fleuron'}
                onChange={(e) => onUpdateStyle({ sceneBreakOrnamentId: e.target.value })}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {ORNAMENT_COLLECTION.map((o: OrnamentDefinition) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Print Layout & Sizing (Phase 3 Expanded) */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Trim Size &amp; Paper Geometry</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: '5x8', label: '5" × 8"', desc: 'Standard Paperback' },
                { id: '5.25x8', label: '5.25" × 8"', desc: 'Digest Fiction' },
                { id: '5.5x8.5', label: '5.5" × 8.5"', desc: 'Trade (Most Popular)' },
                { id: '6x9', label: '6" × 9"', desc: 'Epic / Hardcover' },
                { id: '6.14x9.21', label: '6.14" × 9.21"', desc: 'Royal Octavo (UK)' },
                { id: '7x10', label: '7" × 10"', desc: 'Manual / Memoir' },
                { id: '8.5x11', label: '8.5" × 11"', desc: 'Large Workbook' },
              ].map((ts) => (
                <button
                  key={ts.id}
                  type="button"
                  onClick={() => onUpdateStyle({ trimSize: ts.id as StyleConfig['trimSize'] })}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    styleConfig.trimSize === ts.id
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{ts.label}</div>
                  <div className="text-[9px] text-stone-500 truncate">{ts.desc}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Print Paper Stock</label>
                <select
                  value={styleConfig.paperStock || 'cream-55'}
                  onChange={(e) => onUpdateStyle({ paperStock: e.target.value as StyleConfig['paperStock'] })}
                  className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="cream-55">55# Warm Cream (Fiction Standard)</option>
                  <option value="white-50">50# Crisp White (Non-Fiction)</option>
                  <option value="color-70">70# Premium Heavy White</option>
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                  <input
                    type="checkbox"
                    checked={!!styleConfig.rectoChapterOpening}
                    onChange={(e) => onUpdateStyle({ rectoChapterOpening: e.target.checked })}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Recto Chapter Openings (Right-hand page)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                  <input
                    type="checkbox"
                    checked={styleConfig.hyphenation !== false}
                    onChange={(e) => onUpdateStyle({ hyphenation: e.target.checked })}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Automatic Typographic Hyphenation</span>
                </label>
              </div>
            </div>

            {/* Reading Direction (RTL vs LTR) */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Reading Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ direction: 'ltr' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    (styleConfig.direction || 'ltr') === 'ltr'
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200">LTR (Left-to-Right)</div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    English, Spanish, French, German, Latin scripts
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ direction: 'rtl' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    styleConfig.direction === 'rtl'
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200">RTL (Right-to-Left)</div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Hebrew, Arabic, Persian (Farsi), Urdu scripts
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors"
          >
            Apply Styling
          </button>
        </div>
      </div>
    </div>
  );
};
