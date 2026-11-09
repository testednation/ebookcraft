import React, { useState } from 'react';
import { CharacterProfile, CharacterRole } from '../types/book';
import { X, Plus, Trash2, Edit3, User, Sparkles, BookOpen } from 'lucide-react';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterProfile[];
  onSaveCharacter: (character: CharacterProfile) => void;
  onDeleteCharacter: (characterId: string) => void;
  bookId: string;
}

const ROLE_COLORS: Record<CharacterRole, { bg: string; text: string; border: string; label: string }> = {
  protagonist: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Protagonist' },
  antagonist: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Antagonist' },
  supporting: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', label: 'Supporting' },
  minor: { bg: 'bg-stone-500/10', text: 'text-stone-400', border: 'border-stone-500/30', label: 'Minor Character' },
};

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  characters,
  onSaveCharacter,
  onDeleteCharacter,
  bookId,
}) => {
  const [editingChar, setEditingChar] = useState<CharacterProfile | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    const newChar: CharacterProfile = {
      id: 'char_' + Date.now(),
      bookId,
      name: '',
      role: 'supporting',
      physicalTraits: '',
      bio: '',
      personalityTraits: '',
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingChar(newChar);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar || !editingChar.name.trim()) return;
    onSaveCharacter({
      ...editingChar,
      updatedAt: Date.now(),
    });
    setEditingChar(null);
  };

  const filteredCharacters = characters.filter((c) =>
    filterRole === 'all' ? true : c.role === filterRole
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-100">Character Bible &amp; Dossiers</h2>
              <p className="text-xs text-stone-400">
                Track traits, backstories, and voice markers to keep your cast consistent across all chapters.
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

        {/* Body Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Character List Column */}
          <div className="w-full md:w-80 border-r border-stone-800/80 bg-stone-950/40 flex flex-col">
            <div className="p-3 border-b border-stone-800/60 flex items-center justify-between gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-stone-800 text-xs text-stone-300 rounded-lg px-2.5 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-500 flex-1"
              >
                <option value="all">All Roles ({characters.length})</option>
                <option value="protagonist">Protagonists</option>
                <option value="antagonist">Antagonists</option>
                <option value="supporting">Supporting</option>
                <option value="minor">Minor</option>
              </select>
              <button
                onClick={handleStartCreate}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredCharacters.length === 0 ? (
                <div className="text-center py-8 px-4 text-stone-500 text-xs">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No characters found. Click &quot;New&quot; to build your first character profile.
                </div>
              ) : (
                filteredCharacters.map((c) => {
                  const roleStyle = ROLE_COLORS[c.role] || ROLE_COLORS.minor;
                  const isSelected = editingChar?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setEditingChar(c)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-stone-800/80 border-amber-500/50 shadow-sm'
                          : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-xs text-stone-200 truncate">{c.name || 'Untitled'}</span>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border} shrink-0`}
                        >
                          {roleStyle.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-1">{c.physicalTraits || c.bio || 'No details yet'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Form / Detail Column */}
          <div className="flex-1 overflow-y-auto p-6 bg-stone-900/40">
            {editingChar ? (
              <form onSubmit={handleSave} className="space-y-4 max-w-xl mx-auto">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    {editingChar.id.startsWith('char_') && !characters.some((c) => c.id === editingChar.id)
                      ? 'Create Character Profile'
                      : 'Edit Character Profile'}
                  </h3>
                  {characters.some((c) => c.id === editingChar.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCharacter(editingChar.id);
                        setEditingChar(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Profile</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Character Name *</label>
                    <input
                      type="text"
                      required
                      value={editingChar.name}
                      onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                      placeholder="e.g. Captain Lyra Vance"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Story Role</label>
                    <select
                      value={editingChar.role}
                      onChange={(e) =>
                        setEditingChar({ ...editingChar, role: e.target.value as CharacterRole })
                      }
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting Character</option>
                      <option value="minor">Minor Character</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Age / Demeanor</label>
                    <input
                      type="text"
                      value={editingChar.age || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, age: e.target.value })}
                      placeholder="e.g. 34, brooding, observant"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Occupation / Title</label>
                    <input
                      type="text"
                      value={editingChar.occupation || ''}
                      onChange={(e) => setEditingChar({ ...editingChar, occupation: e.target.value })}
                      placeholder="e.g. Chief Navigator, Arcane Guild"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">
                    Physical Traits &amp; Visual Anchors
                  </label>
                  <textarea
                    rows={2}
                    value={editingChar.physicalTraits}
                    onChange={(e) => setEditingChar({ ...editingChar, physicalTraits: e.target.value })}
                    placeholder="e.g. Amber eyes, scar across left cheek, tailored navy coat with silver brass buttons."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">
                    Backstory, Motivation &amp; Arc
                  </label>
                  <textarea
                    rows={3}
                    value={editingChar.bio}
                    onChange={(e) => setEditingChar({ ...editingChar, bio: e.target.value })}
                    placeholder="e.g. Exiled from the High Citadel after uncovering the clockwork conspiracy. Driven to reclaim her family crest."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">
                    Author Notes &amp; Voice Quirks (Secret)
                  </label>
                  <textarea
                    rows={2}
                    value={editingChar.notes || ''}
                    onChange={(e) => setEditingChar({ ...editingChar, notes: e.target.value })}
                    placeholder="e.g. Speaks in short, clipped nautical metaphors. Never mentions her brother until Act III."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingChar(null)}
                    className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors"
                  >
                    Save Character
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-500">
                <BookOpen className="w-12 h-12 mb-3 text-stone-600" />
                <h4 className="text-sm font-semibold text-stone-300 mb-1">Select or Create a Character</h4>
                <p className="text-xs text-stone-500 max-w-sm mb-4">
                  Keep character details handy so you never mix up eye colors, speech patterns, or character arcs mid-sentence.
                </p>
                <button
                  onClick={handleStartCreate}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Character Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
