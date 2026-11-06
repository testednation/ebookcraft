import React from 'react';
import { X, Sliders, Check, Sparkles, BookOpen } from 'lucide-react';
import { StyleConfig, GenreThemeId, FontChoice, DropCapStyle } from '../types/book';
import { THEME_PRESETS, getDefaultStyleConfig } from '../services/themes';
import { ORNAMENTS } from '../services/ornaments';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleConfig: StyleConfig;
  onSaveStyle: (newConfig: StyleConfig) => void;
}

const BODY_FONTS: FontChoice[] = [
  'Cormorant Garamond',
  'EB Garamond',
  'Playfair Display',
  'Spectral',
  'Inter',
  'system-ui',
];

const HEADING_FONTS: FontChoice[] = [
  'Playfair Display',
  'Cinzel',
  'Cormorant Garamond',
  'EB Garamond',
  'Inter',
];

export const StyleModal: React.FC<StyleModalProps> = ({
  isOpen,
  onClose,
  styleConfig,
  onSaveStyle,
}) => {
  if (!isOpen) return null;

  const currentConfig = {
    ...getDefaultStyleConfig('literary'),
    ...(styleConfig || {}),
  };

  const handleApplyPreset = (presetThemeId: GenreThemeId) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetThemeId);
    if (!preset) return;
    onSaveStyle({
      ...currentConfig,
      ...preset.config,
    });
  };

  const updateField = <K extends keyof StyleConfig>(key: K, value: StyleConfig[K]) => {
    onSaveStyle({
      ...currentConfig,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Book Styling &amp; Typography</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Genre Themes Presets */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-2 uppercase tracking-wider text-[11px]">
              Atticus / Vellum Genre Themes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {THEME_PRESETS.map((p) => {
                const isSelected = currentConfig.themeId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id)}
                    className={`text-left p-3 rounded-lg border transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">{p.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                    <span className="mt-2 text-[9px] font-mono text-amber-400/80 bg-neutral-900 px-1.5 py-0.5 rounded w-fit border border-neutral-800">
                      {p.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Fonts & Sizes */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Typography &amp; Fonts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 mb-1">Body Typeface</label>
                <select
                  value={currentConfig.bodyFont}
                  onChange={(e) => updateField('bodyFont', e.target.value as FontChoice)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {BODY_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Heading / Titling Typeface</label>
                <select
                  value={currentConfig.headingFont}
                  onChange={(e) => updateField('headingFont', e.target.value as FontChoice)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {HEADING_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sliders: Font Size & Line Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Body Font Size</span>
                  <span className="font-mono text-white">{currentConfig.fontSizePt} pt</span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="14"
                  step="0.5"
                  value={currentConfig.fontSizePt}
                  onChange={(e) => updateField('fontSizePt', parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Line Spacing</span>
                  <span className="font-mono text-white">{currentConfig.lineSpacing}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="1.8"
                  step="0.05"
                  value={currentConfig.lineSpacing}
                  onChange={(e) => updateField('lineSpacing', parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Paragraph Indents & Spacing */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Paragraph Indentation &amp; Spacing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>First-Line Indent</span>
                  <span className="font-mono text-white">{currentConfig.paragraphIndentEm} em</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.25"
                  value={currentConfig.paragraphIndentEm}
                  onChange={(e) => updateField('paragraphIndentEm', parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Standard fiction uses 1.0 – 1.5 em. Non-fiction usually uses 0 em.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Space Between Paragraphs</span>
                  <span className="font-mono text-white">{currentConfig.paragraphSpacingPt} pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={currentConfig.paragraphSpacingPt}
                  onChange={(e) => updateField('paragraphSpacingPt', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Standard fiction uses 0 pt (indented). Non-fiction uses 6–10 pt.
                </p>
              </div>
            </div>
          </div>

          {/* Chapter Opening: Drop Caps & Small Caps */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Chapter Opening &amp; Drop Caps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Drop Cap Treatment</label>
                <select
                  value={currentConfig.dropCap}
                  onChange={(e) => updateField('dropCap', e.target.value as DropCapStyle)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="none">None (Plain)</option>
                  <option value="simple">Simple 3-Line Drop Cap</option>
                  <option value="illuminated">Illuminated / Ornamental Box</option>
                  <option value="raised">Raised Initial</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-md cursor-pointer hover:border-neutral-700">
                  <input
                    type="checkbox"
                    checked={currentConfig.firstParagraphDropCap}
                    onChange={(e) => updateField('firstParagraphDropCap', e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-neutral-300">Apply to 1st Paragraph</span>
                </label>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-md cursor-pointer hover:border-neutral-700">
                  <input
                    type="checkbox"
                    checked={currentConfig.firstParagraphSmallCaps}
                    onChange={(e) => updateField('firstParagraphSmallCaps', e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-neutral-300">Small Caps Opening Words</span>
                </label>
              </div>
            </div>
          </div>

          {/* Fleurons, Flourishes & Ornaments */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Flourishes &amp; Scene Break Ornaments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 mb-1">Chapter Header Ornament</label>
                <select
                  value={currentConfig.chapterOrnamentId}
                  onChange={(e) => updateField('chapterOrnamentId', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {ORNAMENTS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Scene Divider (HR) Ornament</label>
                <select
                  value={currentConfig.sceneBreakOrnamentId}
                  onChange={(e) => updateField('sceneBreakOrnamentId', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {ORNAMENTS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Print Trim Size & Layout */}
          <div className="pt-4 border-t border-neutral-800/80">
            <h3 className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px] mb-3">
              Print Book Trim Size
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {(['5x8', '5.5x8.5', '6x9'] as const).map((trim) => (
                <button
                  key={trim}
                  type="button"
                  onClick={() => updateField('trimSize', trim)}
                  className={`p-2.5 rounded-lg border text-center transition ${
                    currentConfig.trimSize === trim
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-mono text-sm">{trim} in</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {trim === '5x8'
                      ? 'Pocket Novel'
                      : trim === '5.5x8.5'
                      ? 'Standard US Trade'
                      : 'Royal / Hardcover'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
