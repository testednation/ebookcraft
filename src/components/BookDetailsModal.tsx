import React, { useRef } from 'react';
import { X, Book, Image as ImageIcon, Trash2 } from 'lucide-react';
import { BookProject, TRIM_SIZES, TrimSizeId } from '../types/book';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookProject;
  onUpdateBook: (updated: BookProject) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  isOpen,
  onClose,
  book,
  onUpdateBook,
}) => {
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCoverUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onUpdateBook({
          ...book,
          coverImage: e.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Book Metadata & Print Trim</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Cover & Basic Info Row */}
          <div className="flex gap-6 items-start">
            {/* Cover Art Box */}
            <div className="w-36 shrink-0">
              <label className="block text-neutral-400 mb-1.5 font-medium">Cover Art (3:4)</label>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-36 h-48 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-950 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 overflow-hidden relative group"
              >
                {book.coverImage ? (
                  <>
                    <img src={book.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="text-[11px] text-white">Change Cover</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-neutral-500 group-hover:text-amber-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-[10px]">Upload Cover</span>
                  </div>
                )}
              </div>
              {book.coverImage && (
                <button
                  onClick={() => onUpdateBook({ ...book, coverImage: undefined })}
                  className="mt-1.5 w-full flex items-center justify-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 py-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Cover</span>
                </button>
              )}
            </div>

            {/* Title, Subtitle, Author */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Book Title</label>
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => onUpdateBook({ ...book, title: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Subtitle</label>
                <input
                  type="text"
                  value={book.subtitle || ''}
                  onChange={(e) => onUpdateBook({ ...book, subtitle: e.target.value })}
                  placeholder="e.g. A Chronicle of the Clockwork Guild"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Author Name</label>
                <input
                  type="text"
                  value={book.author}
                  onChange={(e) => onUpdateBook({ ...book, author: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Series & Publisher */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Series Name</label>
              <input
                type="text"
                value={book.seriesName || ''}
                onChange={(e) => onUpdateBook({ ...book, seriesName: e.target.value })}
                placeholder="e.g. The Aetherium Chronicles"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Volume / Number</label>
              <input
                type="text"
                value={book.seriesNumber || ''}
                onChange={(e) => onUpdateBook({ ...book, seriesNumber: e.target.value })}
                placeholder="e.g. Book 1"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Publisher / Imprint</label>
              <input
                type="text"
                value={book.publisher || ''}
                onChange={(e) => onUpdateBook({ ...book, publisher: e.target.value })}
                placeholder="e.g. Obsidian & Quill Press"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* ISBN & Print Trim Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Print Trim Size (KDP / Ingram)</label>
              <select
                value={book.trimSize}
                onChange={(e) => onUpdateBook({ ...book, trimSize: e.target.value as TrimSizeId })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              >
                {TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">eBook ISBN</label>
              <input
                type="text"
                value={book.isbnEpub || ''}
                onChange={(e) => onUpdateBook({ ...book, isbnEpub: e.target.value })}
                placeholder="978-..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Print Paperback ISBN</label>
              <input
                type="text"
                value={book.isbnPrint || ''}
                onChange={(e) => onUpdateBook({ ...book, isbnPrint: e.target.value })}
                placeholder="978-..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Copyright & Rights Statement */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Copyright Year</label>
              <input
                type="text"
                value={book.copyrightYear}
                onChange={(e) => onUpdateBook({ ...book, copyrightYear: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-neutral-400 mb-1 font-medium">Rights Statement</label>
              <input
                type="text"
                value={book.rightsStatement}
                onChange={(e) => onUpdateBook({ ...book, rightsStatement: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Blurb / Description */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-neutral-400 mb-1 font-medium">Book Blurb / Marketing Description</label>
            <textarea
              rows={3}
              value={book.description || ''}
              onChange={(e) => onUpdateBook({ ...book, description: e.target.value })}
              placeholder="Synopsis for retail stores, metadata, and back cover..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};
