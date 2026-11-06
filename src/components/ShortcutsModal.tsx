import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
}

const WORKFLOW_SHORTCUTS: ShortcutItem[] = [
  {
    keys: ['Ctrl / ⌘', 'S'],
    label: 'Save Manuscript & Metadata',
    description: 'Immediately flushes active chapter and book settings to offline IndexedDB storage.',
  },
  {
    keys: ['Ctrl / ⌘', 'N'],
    label: 'Add New Chapter Section',
    description: 'Creates a new numbered body chapter and focuses it in the editor.',
  },
  {
    keys: ['Ctrl / ⌘', 'P'],
    label: 'Cycle Editor & Device Preview',
    description: 'Cycles between Split View (Editor + Preview), Distraction-Free Editor, and Full Device Preview.',
  },
  {
    keys: ['Alt', '↑ / ↓'],
    label: 'Navigate Previous / Next Section',
    description: 'Moves selection up or down through Front Matter, Chapters, and Back Matter.',
  },
  {
    keys: ['Ctrl / ⌘', 'E'],
    label: 'Open Publish & Export Center',
    description: 'Opens the EPUB 3, Print-Ready PDF, HTML, Markdown, and JSON backup dialog.',
  },
  {
    keys: ['Ctrl / ⌘', ','],
    label: 'Open Formatting Studio',
    description: 'Opens Vellum/Atticus style presets, custom fonts, indentation, and TOC builder.',
  },
  {
    keys: ['Ctrl / ⌘', '/'],
    label: 'Keyboard Shortcuts Reference',
    description: 'Toggles this keyboard shortcut cheat sheet.',
  },
];

const EDITOR_SHORTCUTS: ShortcutItem[] = [
  {
    keys: ['Ctrl / ⌘', 'B'],
    label: 'Bold Text',
    description: 'Toggles bold weight on the selected manuscript text.',
  },
  {
    keys: ['Ctrl / ⌘', 'I'],
    label: 'Italic Text',
    description: 'Toggles italic emphasis on the selected manuscript text.',
  },
  {
    keys: ['Ctrl / ⌘', 'Enter'],
    label: 'Insert Explicit Page Break',
    description: 'Inserts a visual page-break marker that forces a new page in EPUB and Print PDF.',
  },
  {
    keys: ['Ctrl / ⌘', 'Shift', 'S'],
    label: 'Insert Ornamental Scene Break',
    description: 'Inserts your active theme fleuron divider at the cursor position.',
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const renderRow = (item: ShortcutItem) => (
    <div
      key={item.label}
      className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-800/70 last:border-b-0"
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-neutral-200">{item.label}</div>
        <div className="text-[11px] text-neutral-400 mt-0.5">{item.description}</div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {item.keys.map((k, idx) => (
          <React.Fragment key={k}>
            <kbd className="px-2 py-1 text-[11px] font-mono font-medium text-amber-300 bg-neutral-950 border border-neutral-700 rounded shadow-inner whitespace-nowrap">
              {k}
            </kbd>
            {idx < item.keys.length - 1 && (
              <span className="text-[10px] text-neutral-500">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Author Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-amber-400/90 mb-2">
              Studio & Workspace Navigation
            </h3>
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg px-4 py-1">
              {WORKFLOW_SHORTCUTS.map(renderRow)}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-400/90 mb-2">
              Manuscript Editor Formatting
            </h3>
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg px-4 py-1">
              {EDITOR_SHORTCUTS.map(renderRow)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Works with both Ctrl (Windows/Linux) and ⌘ Command (macOS).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
