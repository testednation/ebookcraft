import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + S / ⌘ + S', desc: 'Save chapter and manuscript changes immediately' },
  { key: 'Ctrl + N / ⌘ + N', desc: 'Add a new chapter to the current manuscript' },
  { key: 'Ctrl + P / ⌘ + P', desc: 'Toggle between Editor and Live Device Preview' },
  { key: 'Ctrl + Shift + F / ⌘ + Shift + F', desc: 'Toggle Distraction-Free Typewriter Focus Mode (also Ctrl+F)' },
  { key: 'Ctrl + B / ⌘ + B', desc: 'Bold selected prose text' },
  { key: 'Ctrl + I / ⌘ + I', desc: 'Italicize selected prose text' },
  { key: 'Ctrl + K / ⌘ + K', desc: 'Open Keyboard Shortcuts cheat sheet' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92dvh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">Keyboard Shortcuts</h2>
              <p className="text-xs text-stone-400">Streamline your authoring and review flow.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-2.5">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/70 text-xs"
            >
              <span className="text-stone-300 font-normal">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-[11px] text-amber-400 font-semibold shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
