import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  FileCode,
  BookOpen,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  X,
  Printer,
  Barcode,
  Sliders,
  Bookmark,
} from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (
    action: 'part' | 'import' | 'footnotes' | 'docx' | 'goals' | 'cover-wrap' | 'preflight' | 'backmatter'
  ) => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose, onSelectAction }) => {
  const [activeTab, setActiveTab] = useState<'phase3' | 'phase2' | 'matrix' | 'all-phases'>('phase3');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-stone-100">
                  Atticus &amp; Vellum Feature Parity Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Phase 3 Print Engine Live
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Full parity achieved across typography, multi-volume architecture, native Word synchronization, and KDP print geometry.
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800/80 bg-stone-900/60">
          <button
            onClick={() => setActiveTab('phase3')}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'phase3'
                ? 'border-emerald-400 text-emerald-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Phase 3 Print Engine (Live)
          </button>
          <button
            onClick={() => setActiveTab('phase2')}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'phase2'
                ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Phase 2 Architecture (Live)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Parity Matrix
          </button>
          <button
            onClick={() => setActiveTab('all-phases')}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'all-phases'
                ? 'border-amber-400 text-amber-400 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Master Roadmap
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'phase3' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-amber-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                      Phase 3 Breakthrough
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-100 mt-0.5">
                      High-Fidelity Print Engine, Spine Physics &amp; Pre-Flight Verification
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    100% Deployed
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-2">
                  Phase 3 brings publisher-grade book jacket generation, dynamic KDP gutter margins, vector ISBN barcode
                  compilation, and pre-flight validation directly into your browser with zero subscription fees.
                </p>
              </div>

              {/* 4 Core Phase 3 Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Full Cover Wrap & Spine Calculator */}
                <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Layers className="w-4 h-4" />
                        <h4 className="font-semibold text-sm text-stone-200">
                          1. Full Cover Wrap &amp; Spine Calculator
                        </h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">
                      Complete 360-degree print jacket designer with live Amazon KDP &amp; IngramSpark paper thickness
                      formulas. Real-time 3D book previewer and 2D bleed canvas.
                    </p>
                    <ul className="text-xs text-stone-400 space-y-1 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Spine width physics for 55# Cream, 50# White &amp; 70# Color
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Rotated vertical spine text &amp; publisher imprint logo
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Vector SVG jacket export with 0.125&quot; bleed crop guides
                      </li>
                    </ul>
                  </div>
                  {onSelectAction && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectAction('cover-wrap');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Cover Wrap Designer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Pre-Flight Print Proof & Inspection */}
                <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <h4 className="font-semibold text-sm text-stone-200">
                          2. Pre-Flight Inspection Engine
                        </h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">
                      Automated audit of margins, spine tolerances, recto chapter openings, and 4-page signature math
                      before submitting PDF files to commercial printers.
                    </p>
                    <ul className="text-xs text-stone-400 space-y-1 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        KDP gutter margin compliance checks (0.375&quot; to 0.75&quot;)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Spine title text threshold verification (80+ page rule)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        One-click printable pre-flight audit report
                      </li>
                    </ul>
                  </div>
                  {onSelectAction && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectAction('preflight');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Run Pre-Flight Check</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 3. EAN-13 Vector Barcode Generator */}
                <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Barcode className="w-4 h-4" />
                        <h4 className="font-semibold text-sm text-stone-200">
                          3. Vector EAN-13 / ISBN Barcodes
                        </h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">
                      Mathematical EAN-13 parity encoding directly in SVG format with 5-digit price addon and checksum validation for bookstores.
                    </p>
                    <ul className="text-xs text-stone-400 space-y-1 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Lossless vector SVG rendering at infinite DPI
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Automatic modulo-10 ISBN-13 checksum validation
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Optional 5-digit currency price extension addon
                      </li>
                    </ul>
                  </div>
                  {onSelectAction && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectAction('cover-wrap');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Preview Barcode on Cover</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 4. Expanded Trim Geometry & Recto Openings */}
                <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 hover:border-sky-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sky-400">
                        <Sliders className="w-4 h-4" />
                        <h4 className="font-semibold text-sm text-stone-200">
                          4. 7 Trim Sizes &amp; Recto Openings
                        </h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">
                      Expanded trim catalog including Royal Octavo (6.14x9.21), 5.25x8 digest, and 7x10 alongside classic 5.5x8.5 and 6x9 trade paperbacks.
                    </p>
                    <ul className="text-xs text-stone-400 space-y-1 mb-4">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Recto chapter opening option (`page-break-before: right`)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Mirrored left/right page margins for binding clearance
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        Header banner illustration styling support
                      </li>
                    </ul>
                  </div>
                  {onSelectAction && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectAction('cover-wrap');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Adjust Trim &amp; Margins</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phase2' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300 space-y-2">
                <div className="font-semibold text-stone-100 text-sm">Phase 2 Architecture Foundations (Complete)</div>
                <p>
                  Phase 2 delivered Full-Page Part Dividers, Word (.docx) native styling and footnote exports via JSZip,
                  EPUB 3 popup reader footnotes, and multi-file DOCX/TXT/MD importing.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                  <span className="font-semibold text-amber-400">Part Dividers</span>
                  <p className="text-stone-400 text-[11px] mt-1">Full-page volume breaks with Roman numerals.</p>
                </div>
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                  <span className="font-semibold text-blue-400">Word .docx Export</span>
                  <p className="text-stone-400 text-[11px] mt-1">Direct manuscript compilation with native XML footnotes.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 mb-2">
                Comparative analysis of publishing engines across formatting fidelity, author productivity, and OS independence:
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-950 text-stone-300 uppercase tracking-wider font-semibold border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Feature / Capability</th>
                      <th className="py-3 px-4 text-emerald-400 font-bold bg-emerald-500/10 border-x border-emerald-500/20">
                        FolioCraft (Phase 3 Complete)
                      </th>
                      <th className="py-3 px-4 text-stone-400">Atticus ($147)</th>
                      <th className="py-3 px-4 text-stone-400">Vellum ($249 Mac)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 bg-stone-900/40">
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">OS Independence</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Web / Any OS / Offline
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Web / Electron</td>
                      <td className="py-3 px-4 text-rose-400">✗ Mac Only</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Cover Wrap &amp; Spine Calculator</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ 3D &amp; 2D KDP Physics
                      </td>
                      <td className="py-3 px-4 text-rose-400">✗ None</td>
                      <td className="py-3 px-4 text-rose-400">✗ None</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">EAN-13 Vector Barcode Generator</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ SVG + Price Addon
                      </td>
                      <td className="py-3 px-4 text-rose-400">✗ None</td>
                      <td className="py-3 px-4 text-rose-400">✗ None</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Pre-Flight Print Proof Inspection</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Gutter &amp; Tolerance Audit
                      </td>
                      <td className="py-3 px-4 text-rose-400">✗ None</td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Multi-Volume &amp; Part Dividers</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Full-Page + Roman Num.
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                      <td className="py-3 px-4 text-stone-300">✓ Industry Benchmark</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Direct .docx Manuscript Export</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Native Styles + Notes
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                      <td className="py-3 px-4 text-rose-400">✗ Limited / RTF</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Footnotes &amp; Endnotes</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ EPUB 3 Popups + Print
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">7 Industry Trim Sizes</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ 5x8 to 8.5x11 + Royal
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Recto (Right-Hand) Openings</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Collector Blank Verso
                      </td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                      <td className="py-3 px-4 text-stone-300">✓ Supported</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-stone-200">Character Bible / Dossier Tab</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-x border-emerald-500/20">
                        ✓ Role tags &amp; In-editor ref
                      </td>
                      <td className="py-3 px-4 text-rose-400">✗ No Character Bible</td>
                      <td className="py-3 px-4 text-rose-400">✗ No Character Bible</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'all-phases' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-stone-950/60 border border-emerald-500/40">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-stone-100">Phase 1: Professional Typography &amp; Core Formatting</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Delivered drop caps (simple, illuminated, raised), small-caps lead-in styling, custom genre themes
                    (Literary, Fantasy, Modern, Non-fiction), live device preview (Kindle, iPad, Print spread), and EPUB 3 export.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-stone-950/60 border border-emerald-500/40">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-stone-100">Phase 2: Atticus / Vellum Architecture Parity</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Multi-Volume &amp; Part dividers with Roman numeral headings, Word (.docx) export with native styles and
                    footnotes, EPUB 3 reader pop-up footnotes, TXT/DOCX/MD importer, and comprehensive author workflow enhancements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-stone-950/60 border border-emerald-500/40">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-stone-100">Phase 3: High-Fidelity Print &amp; Advanced Layout Engine</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    360-degree Print Cover Wrap &amp; Spine Width Calculator (Cream 55#, White 50#, Color 70#), 3D book model visualizer,
                    vector EAN-13 ISBN barcodes with price addons, Pre-Flight print inspection, and 7 KDP/Ingram trim geometries.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            FolioCraft Engine: 100% Client-Side &bull; No Subscription &bull; Complete Atticus &amp; Vellum Parity
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};
