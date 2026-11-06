import React, { useState, useMemo } from 'react';
import { Book, Chapter, CoverWrapConfig, TrimSize, PaperStock, BindingType } from '../types/book';
import {
  calculateSpineAndWrap,
  estimatePageCountFromWords,
  TRIM_DIMENSIONS,
  PAPER_STOCK_MULTIPLIERS,
} from '../services/spineCalculator';
import { generateEan13Svg } from '../services/barcodeGenerator';
import {
  X,
  BookOpen,
  Layers,
  Sparkles,
  Download,
  Barcode,
  Info,
  Maximize2,
  CheckCircle2,
  Eye,
  Sliders,
} from 'lucide-react';

interface CoverWrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapters: Chapter[];
  onSaveCoverWrap: (config: CoverWrapConfig) => void;
}

export const CoverWrapModal: React.FC<CoverWrapModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  onSaveCoverWrap,
}) => {
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const defaultTrim: TrimSize = book.styleConfig?.trimSize || '5.5x8.5';

  const [trimSize, setTrimSize] = useState<TrimSize>(defaultTrim);
  const [paperStock, setPaperStock] = useState<PaperStock>(
    book.coverWrap?.paperStock || 'cream-55'
  );
  const [binding, setBinding] = useState<BindingType>(
    book.coverWrap?.binding || 'paperback'
  );
  const [viewAngle, setViewAngle] = useState<'wrap' | '3d-front' | '3d-spine' | '3d-back'>('wrap');

  // Form Fields
  const [frontTitle, setFrontTitle] = useState(book.coverWrap?.frontTitle || book.title || '');
  const [frontSubtitle, setFrontSubtitle] = useState(book.coverWrap?.frontSubtitle || book.subtitle || '');
  const [frontAuthor, setFrontAuthor] = useState(book.coverWrap?.frontAuthor || book.author || '');
  const [backBlurb, setBackBlurb] = useState(
    book.coverWrap?.backBlurb ||
      book.description ||
      'In a world where mechanical skies dictate human destiny, an apprentice cartographer uncovers the dying pulse of forgotten celestial spheres. A sweeping tale of Victorian clockwork science and cosmological intrigue.'
  );
  const [backAuthorBio, setBackAuthorBio] = useState(
    book.coverWrap?.backAuthorBio ||
      `${book.author || 'The author'} is a speculative fiction writer and craftsman based in the Scottish Highlands.`
  );
  const [spineTitle, setSpineTitle] = useState(book.coverWrap?.spineTitle || book.title || '');
  const [spineAuthor, setSpineAuthor] = useState(book.coverWrap?.spineAuthor || book.author || '');
  const [publisherImprint, setPublisherImprint] = useState(
    book.coverWrap?.publisherImprint || book.publisher || 'Aetherial Press'
  );
  const [includeBarcode, setIncludeBarcode] = useState(book.coverWrap?.includeBarcode ?? true);
  const [priceAddon, setPriceAddon] = useState(book.coverWrap?.priceBarcodeAddon || '51899');
  const [bgColor, setBgColor] = useState(book.coverWrap?.backgroundColor || '#1c1917');
  const [textColor, setTextColor] = useState(book.coverWrap?.textColor || '#f5f5f4');
  const [accentColor, setAccentColor] = useState(book.coverWrap?.accentColor || '#f59e0b');
  const [frontCoverImage, setFrontCoverImage] = useState(book.coverWrap?.frontCoverImage || book.coverImage || '');

  // Calculate geometry specs
  const estimatedPages = useMemo(
    () => estimatePageCountFromWords(totalWords, trimSize),
    [totalWords, trimSize]
  );

  const specs = useMemo(
    () => calculateSpineAndWrap(estimatedPages, trimSize, paperStock, binding),
    [estimatedPages, trimSize, paperStock, binding]
  );

  // Generate live vector barcode SVG
  const barcodeSvg = useMemo(() => {
    return generateEan13Svg(book.isbn || '9781738910024', {
      addon5: priceAddon,
      width: 170,
      height: 85,
      bgColor: '#ffffff',
    });
  }, [book.isbn, priceAddon]);

  if (!isOpen) return null;

  const handleSave = () => {
    const config: CoverWrapConfig = {
      frontTitle,
      frontSubtitle,
      frontAuthor,
      frontCoverImage,
      backBlurb,
      backAuthorBio,
      spineTitle,
      spineAuthor,
      publisherImprint,
      paperStock,
      binding,
      includeBarcode,
      priceBarcodeAddon: priceAddon,
      backgroundColor: bgColor,
      textColor,
      accentColor,
    };
    onSaveCoverWrap(config);
    onClose();
  };

  const handleDownloadWrapSvg = () => {
    const wrapSvg = generateExportableWrapSvg();
    const blob = new Blob([wrapSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(book.title || 'book').replace(/[^a-zA-Z0-9_-]/g, '_')}_print_cover_wrap.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function generateExportableWrapSvg(): string {
    const w = specs.totalWrapWidthInches * 72; // Points
    const h = specs.totalWrapHeightInches * 72;
    const bleedPt = specs.bleedInches * 72;
    const trimWPt = specs.trimWidthInches * 72;
    const spineWPt = specs.spineWidthInches * 72;

    const backLeft = bleedPt;
    const spineLeft = backLeft + trimWPt;
    const frontLeft = spineLeft + spineWPt;

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}pt" height="${h}pt">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${bgColor}" />
  
  <!-- Back Cover Text -->
  <g transform="translate(${backLeft + 36}, ${bleedPt + 48})">
    <text font-family="Georgia, serif" font-size="12" fill="${textColor}" width="${trimWPt - 72}">
      ${escapeXml(backBlurb.slice(0, 300))}
    </text>
    <text y="180" font-family="Georgia, serif" font-size="10" font-style="italic" fill="${textColor}">
      ${escapeXml(backAuthorBio.slice(0, 160))}
    </text>
  </g>

  <!-- Spine Text (Vertical) -->
  <g transform="translate(${spineLeft + spineWPt / 2}, ${h / 2}) rotate(90)">
    <text text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="bold" fill="${accentColor}">
      ${escapeXml(spineTitle)} — ${escapeXml(spineAuthor)}
    </text>
  </g>

  <!-- Front Cover Title & Author -->
  <g transform="translate(${frontLeft + trimWPt / 2}, ${bleedPt + 100})">
    <text text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="${textColor}">
      ${escapeXml(frontTitle)}
    </text>
    ${frontSubtitle ? `<text y="30" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic" fill="${textColor}">${escapeXml(frontSubtitle)}</text>` : ''}
    <text y="${h - 200}" text-anchor="middle" font-family="Georgia, serif" font-size="16" letter-spacing="1" fill="${accentColor}">
      ${escapeXml(frontAuthor)}
    </text>
  </g>

  <!-- Fold and Bleed Crop Marks -->
  <line x1="${backLeft}" y1="0" x2="${backLeft}" y2="${h}" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="4,4" />
  <line x1="${spineLeft}" y1="0" x2="${spineLeft}" y2="${h}" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="4,4" />
  <line x1="${frontLeft}" y1="0" x2="${frontLeft}" y2="${h}" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="4,4" />
  <line x1="${frontLeft + trimWPt}" y1="0" x2="${frontLeft + trimWPt}" y2="${h}" stroke="#ef4444" stroke-width="0.5" stroke-dasharray="4,4" />
</svg>`.trim();
  }

  function escapeXml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Full Cover Wrap &amp; Spine Calculator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Phase 3 Standard
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Exact KDP and IngramSpark compliant cover jacket generation with live spine thickness physics.
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

        {/* Workspace: 2-Columns (Controls & Specs on Left, Live Canvas on Right) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Settings & Metadata Left Column */}
          <div className="w-full lg:w-96 border-r border-stone-800 bg-stone-950/60 overflow-y-auto p-4 space-y-4">
            {/* Live Specifications Pill Box */}
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  KDP / Ingram Geometry
                </span>
                <span className="text-xs font-mono font-bold text-stone-200">
                  {estimatedPages} pages
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-stone-950 border border-stone-800/60">
                  <div className="text-[10px] text-stone-500">Spine Width</div>
                  <div className="font-mono font-bold text-amber-300">
                    {specs.spineWidthInches}&quot; ({specs.spineWidthMm}mm)
                  </div>
                </div>
                <div className="p-2 rounded bg-stone-950 border border-stone-800/60">
                  <div className="text-[10px] text-stone-500">Wrap Canvas</div>
                  <div className="font-mono font-bold text-stone-300">
                    {specs.totalWrapWidthInches}&quot; × {specs.totalWrapHeightInches}&quot;
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 flex items-center justify-between">
                <span>Gutter Safe Margin: <strong>{specs.gutterMarginInches}&quot;</strong></span>
                <span>Bleed: <strong>0.125&quot;</strong></span>
              </div>
              {!specs.isSpineTextSafe && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[10px] flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>Spine under 80 pages is too narrow for horizontal title text on Amazon KDP.</span>
                </div>
              )}
            </div>

            {/* Print Material Selectors */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Print Trim Size</label>
                <select
                  value={trimSize}
                  onChange={(e) => setTrimSize(e.target.value as TrimSize)}
                  className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  {Object.entries(TRIM_DIMENSIONS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} &mdash; {val.commonGenre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Paper Stock</label>
                  <select
                    value={paperStock}
                    onChange={(e) => setPaperStock(e.target.value as PaperStock)}
                    className="w-full px-2 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="cream-55">55# Cream (Fiction)</option>
                    <option value="white-50">50# White (Non-Fiction)</option>
                    <option value="color-70">70# Heavy Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Binding Style</label>
                  <select
                    value={binding}
                    onChange={(e) => setBinding(e.target.value as BindingType)}
                    className="w-full px-2 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="paperback">Trade Paperback</option>
                    <option value="hardcover">Case Hardcover (+turn-in)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Typography & Cover Text Configuration */}
            <div className="space-y-3 border-t border-stone-800/80 pt-3">
              <span className="text-xs font-semibold text-stone-300 block">Jacket Copy</span>
              <div>
                <label className="block text-[11px] text-stone-400 mb-0.5">Spine Title</label>
                <input
                  type="text"
                  value={spineTitle}
                  onChange={(e) => setSpineTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-0.5">Back Cover Blurb / Synopsis</label>
                <textarea
                  rows={3}
                  value={backBlurb}
                  onChange={(e) => setBackBlurb(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-0.5">Author Bio (Back Cover)</label>
                <textarea
                  rows={2}
                  value={backAuthorBio}
                  onChange={(e) => setBackAuthorBio(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-0.5">Publisher Imprint</label>
                  <input
                    type="text"
                    value={publisherImprint}
                    onChange={(e) => setPublisherImprint(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-0.5">Price Extension</label>
                  <input
                    type="text"
                    value={priceAddon}
                    onChange={(e) => setPriceAddon(e.target.value)}
                    placeholder="51999 ($19.99)"
                    className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div className="flex items-center gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-stone-400 mb-1">Cover Tone</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-700 bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 mb-1">Accent Gold</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-700 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                    <input
                      type="checkbox"
                      checked={includeBarcode}
                      onChange={(e) => setIncludeBarcode(e.target.checked)}
                      className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>EAN-13 Barcode</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Right Column */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            {/* View Mode Toolbar */}
            <div className="px-6 py-2.5 border-b border-stone-800 bg-stone-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewAngle('wrap')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewAngle === 'wrap'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200 bg-stone-900'
                  }`}
                >
                  2D Print Wrap Layout
                </button>
                <button
                  onClick={() => setViewAngle('3d-front')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    viewAngle === '3d-front'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200 bg-stone-900'
                  }`}
                >
                  3D Book Perspective
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-500 font-mono">
                  Scale: 100% vector
                </span>
                <button
                  onClick={handleDownloadWrapSvg}
                  className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Download vector SVG wrap ready for print"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Print Wrap</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Stage */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#100f0e] select-none">
              {viewAngle === 'wrap' ? (
                /* Full 2D Wrap View */
                <div
                  className="relative rounded shadow-2xl border-2 border-stone-700 flex transition-all duration-300"
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    width: '780px',
                    height: '520px',
                  }}
                >
                  {/* Left: Back Cover */}
                  <div className="w-[45%] h-full p-8 flex flex-col justify-between border-r border-blue-500/40 border-dashed relative">
                    <div className="space-y-4">
                      <div className="font-serif text-[11px] leading-relaxed opacity-90 line-clamp-6">
                        {backBlurb}
                      </div>
                      <div className="pt-3 border-t border-stone-700/60 font-serif italic text-[10px] opacity-75 line-clamp-3">
                        {backAuthorBio}
                      </div>
                    </div>

                    {/* Barcode & Imprint Bottom */}
                    <div className="flex items-end justify-between pt-4">
                      <div className="text-[10px] font-serif uppercase tracking-widest opacity-60">
                        {publisherImprint}
                      </div>
                      {includeBarcode && (
                        <div
                          className="bg-white p-1 rounded shadow-md border border-stone-300"
                          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Center: Spine */}
                  <div
                    className="h-full flex flex-col items-center justify-between py-6 border-r border-blue-500/40 border-dashed relative bg-black/10"
                    style={{ width: `${Math.max(38, specs.spineWidthInches * 70)}px` }}
                  >
                    <div className="text-[9px] font-serif tracking-widest uppercase opacity-70">
                      ❖
                    </div>
                    {/* Rotated Vertical Spine Title */}
                    <div className="rotate-90 whitespace-nowrap font-serif font-bold text-xs tracking-wider flex items-center gap-3">
                      <span style={{ color: accentColor }}>{spineTitle}</span>
                      <span className="opacity-60 text-[10px]">{spineAuthor}</span>
                    </div>
                    <div className="text-[8px] font-mono uppercase tracking-widest opacity-60">
                      {publisherImprint ? publisherImprint.slice(0, 3).toUpperCase() : 'FOL'}
                    </div>
                  </div>

                  {/* Right: Front Cover */}
                  <div className="flex-1 h-full p-8 flex flex-col justify-between text-center relative">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-serif mb-2">
                        A Novel By
                      </div>
                      <h1
                        className="text-2xl sm:text-3xl font-serif font-bold tracking-wide uppercase"
                        style={{ color: textColor }}
                      >
                        {frontTitle}
                      </h1>
                      {frontSubtitle && (
                        <p className="text-xs italic font-serif opacity-75 mt-1">{frontSubtitle}</p>
                      )}
                    </div>

                    <div className="py-6 flex justify-center opacity-60">
                      <div className="w-12 h-px bg-current" />
                    </div>

                    <div>
                      <div
                        className="text-sm font-serif font-semibold tracking-widest uppercase"
                        style={{ color: accentColor }}
                      >
                        {frontAuthor}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest opacity-40 font-mono mt-1">
                        {publisherImprint}
                      </div>
                    </div>
                  </div>

                  {/* Bleed Safety Overlay Guide Lines */}
                  <div className="absolute inset-1.5 border border-red-500/30 pointer-events-none rounded">
                    <span className="absolute top-1 left-2 text-[8px] font-mono text-red-400 opacity-60 uppercase">
                      0.125&quot; Bleed Safe Zone
                    </span>
                  </div>
                </div>
              ) : (
                /* 3D Realistic Hardcover / Paperback Perspective */
                <div className="perspective-1000 flex items-center justify-center p-8">
                  <div
                    className="relative w-72 h-[420px] rounded-r-xl shadow-2xl transition-transform duration-500 hover:rotate-y-[-10deg] flex flex-col justify-between p-8 text-center border-l-8 border-stone-800"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      boxShadow: '15px 20px 40px rgba(0,0,0,0.8), -4px 0 10px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-serif mb-3">
                        FolioCraft Deluxe Edition
                      </div>
                      <h2 className="text-2xl font-serif font-bold tracking-wide uppercase leading-tight">
                        {frontTitle}
                      </h2>
                      {frontSubtitle && (
                        <p className="text-xs italic font-serif opacity-75 mt-1.5">{frontSubtitle}</p>
                      )}
                    </div>

                    <div className="text-2xl opacity-40">❦</div>

                    <div>
                      <p
                        className="text-sm font-serif font-bold tracking-widest uppercase"
                        style={{ color: accentColor }}
                      >
                        {frontAuthor}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest opacity-40 font-mono mt-1">
                        {publisherImprint} &bull; {trimSize}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Calculated for <strong>{estimatedPages} pages</strong> on <strong>{specs.trimWidthInches}&quot; × {specs.trimHeightInches}&quot;</strong> ({paperStock})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors"
            >
              Apply Cover Wrap Specs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
