import React, { useState, useEffect } from 'react';
import { X, Book, HardDrive, Clock, Target } from 'lucide-react';
import { Book as BookType, AutoSaveFrequency } from '../types/book';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookType;
  onSaveBook: (updated: BookType) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  isOpen,
  onClose,
  book,
  onSaveBook,
}) => {
  const [title, setTitle] = useState(book.title || '');
  const [subtitle, setSubtitle] = useState(book.subtitle || '');
  const [author, setAuthor] = useState(book.author || '');
  const [publisher, setPublisher] = useState(book.publisher || '');
  const [isbn, setIsbn] = useState(book.isbn || '');
  const [genre, setGenre] = useState(book.genre || '');
  const [language, setLanguage] = useState(book.language || 'en');
  const [description, setDescription] = useState(book.description || '');
  const [autoSaveFreq, setAutoSaveFreq] = useState<AutoSaveFrequency>(
    book.autoSaveFrequency || '5s'
  );
  const [targetWordCount, setTargetWordCount] = useState<number>(book.targetWordCount || 60000);
  const [dailyWordGoal, setDailyWordGoal] = useState<number>(book.dailyWordGoal || 1000);

  useEffect(() => {
    if (isOpen) {
      setTitle(book.title || '');
      setSubtitle(book.subtitle || '');
      setAuthor(book.author || '');
      setPublisher(book.publisher || '');
      setIsbn(book.isbn || '');
      setGenre(book.genre || '');
      setLanguage(book.language || 'en');
      setDescription(book.description || '');
      setAutoSaveFreq(book.autoSaveFrequency || '5s');
      setTargetWordCount(book.targetWordCount || 60000);
      setDailyWordGoal(book.dailyWordGoal || 1000);
    }
  }, [isOpen, book]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBook({
      ...book,
      title: title.trim() || 'Untitled Book',
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Unknown Author',
      publisher: publisher.trim() || undefined,
      isbn: isbn.trim() || undefined,
      genre: genre.trim() || 'Fiction',
      language: language.trim() || 'en',
      description: description.trim() || undefined,
      autoSaveFrequency: autoSaveFreq,
      targetWordCount: Math.max(100, targetWordCount),
      dailyWordGoal: Math.max(10, dailyWordGoal),
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Book Metadata &amp; Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Title & Subtitle */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Book Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Author & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Author Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Publisher / Imprint</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. Aetherial Press"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* ISBN & Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">ISBN / ASIN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Genre / Category</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Fantasy, Romance, etc."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Language Code</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en, fr, es"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Word Count Targets & Goals */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-neutral-300 font-semibold text-[11px] uppercase tracking-wider">
                Writing Goals &amp; Output Targets
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Total Manuscript Goal (Words)
                </label>
                <input
                  type="number"
                  min="500"
                  step="1000"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value, 10) || 50000)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">
                  Daily Word Output Goal
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={dailyWordGoal}
                  onChange={(e) => setDailyWordGoal(parseInt(e.target.value, 10) || 1000)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Auto-Save Frequency Setting */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-neutral-300 font-semibold text-[11px] uppercase tracking-wider">
                Auto-Save Frequency (Offline IndexedDB)
              </label>
            </div>
            <select
              value={autoSaveFreq}
              onChange={(e) => setAutoSaveFreq(e.target.value as AutoSaveFrequency)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="immediate">Real-time (Save on every keystroke)</option>
              <option value="5s">Every 5 seconds (Recommended)</option>
              <option value="15s">Every 15 seconds</option>
              <option value="30s">Every 30 seconds</option>
              <option value="manual">Manual only (Use Ctrl+S or Save button)</option>
            </select>
            <p className="text-[10px] text-neutral-500 mt-1">
              Your manuscript and character profiles are stored directly in your browser's private offline IndexedDB storage.
            </p>
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-neutral-400 mb-1 font-medium">Book Synopsis / Blurb</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
