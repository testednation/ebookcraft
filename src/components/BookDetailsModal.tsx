import React, { useState } from 'react';
import { Book, AutoSaveFrequency } from '../types/book';
import { X, BookCheck, Clock, Target, Info } from 'lucide-react';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onSave: (updated: Partial<Book>) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({ isOpen, onClose, book, onSave }) => {
  const [title, setTitle] = useState(book.title || '');
  const [subtitle, setSubtitle] = useState(book.subtitle || '');
  const [author, setAuthor] = useState(book.author || '');
  const [publisher, setPublisher] = useState(book.publisher || '');
  const [isbn, setIsbn] = useState(book.isbn || '');
  const [description, setDescription] = useState(book.description || '');
  const [language, setLanguage] = useState(book.language || 'en');
  const [genre, setGenre] = useState(book.genre || 'Fiction');
  const [autoSaveFrequency, setAutoSaveFrequency] = useState<AutoSaveFrequency>(
    book.autoSaveFrequency || '5s'
  );
  const [targetWordCount, setTargetWordCount] = useState<number>(book.targetWordCount || 50000);
  const [dailyWordGoal, setDailyWordGoal] = useState<number>(book.dailyWordGoal || 1000);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      subtitle,
      author,
      publisher,
      isbn,
      description,
      language,
      genre,
      autoSaveFrequency,
      targetWordCount: Number(targetWordCount) || 50000,
      dailyWordGoal: Number(dailyWordGoal) || 1000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">Book Details &amp; Workflow</h2>
              <p className="text-xs text-stone-400">Manage manuscript metadata, writing targets, and auto-save cadences.</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional subtitle"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Author Name *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. High Fantasy, Historical Fiction"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Publisher / Imprint</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. Copper Quill Press"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">ISBN-13</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Book Description / Blurb</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Back-cover synopsis or metadata description"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Auto-Save Frequency Section */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-stone-200">Auto-Save Frequency Setting</h4>
            </div>
            <p className="text-[11px] text-stone-400">
              Configure how often edits are synchronized to persistent offline IndexedDB storage.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'immediate', label: 'Real-time', desc: 'Instant' },
                  { id: '5s', label: 'Every 5s', desc: 'Default' },
                  { id: '15s', label: 'Every 15s', desc: 'Balanced' },
                  { id: '30s', label: 'Every 30s', desc: 'Delayed' },
                  { id: 'manual', label: 'Manual Only', desc: 'Ctrl+S' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAutoSaveFrequency(opt.id)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    autoSaveFrequency === opt.id
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[10px] text-stone-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Targets */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Target className="w-4 h-4" />
              <h4 className="text-xs font-semibold text-stone-200">Manuscript Word Goals</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Manuscript Total Target (words)
                </label>
                <input
                  type="number"
                  step="500"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-500">e.g. 50,000 for standard novel</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Daily Word Goal (words/day)
                </label>
                <input
                  type="number"
                  step="100"
                  value={dailyWordGoal}
                  onChange={(e) => setDailyWordGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-500">e.g. 1,000 words daily output</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
