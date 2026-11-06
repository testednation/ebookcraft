import React, { useState, useEffect } from 'react';
import { X, User, Sparkles, Check } from 'lucide-react';
import { CharacterProfile, CharacterRole } from '../types/book';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterProfile | null;
  bookId: string;
  onSave: (character: CharacterProfile) => void;
}

const COLOR_OPTIONS = [
  { label: 'Amber', value: '#f59e0b', ring: 'ring-amber-500' },
  { label: 'Emerald', value: '#10b981', ring: 'ring-emerald-500' },
  { label: 'Blue', value: '#3b82f6', ring: 'ring-blue-500' },
  { label: 'Indigo', value: '#6366f1', ring: 'ring-indigo-500' },
  { label: 'Purple', value: '#a855f7', ring: 'ring-purple-500' },
  { label: 'Rose', value: '#f43f5e', ring: 'ring-rose-500' },
  { label: 'Crimson', value: '#e11d48', ring: 'ring-rose-600' },
  { label: 'Teal', value: '#14b8a6', ring: 'ring-teal-500' },
  { label: 'Slate', value: '#64748b', ring: 'ring-slate-500' },
];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  character,
  bookId,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('supporting');
  const [aliases, setAliases] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [physicalTraits, setPhysicalTraits] = useState('');
  const [bio, setBio] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#f59e0b');

  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setRole(character.role || 'supporting');
      setAliases(character.aliases || '');
      setAge(character.age || '');
      setOccupation(character.occupation || '');
      setPhysicalTraits(character.physicalTraits || '');
      setBio(character.bio || '');
      setPersonalityTraits(character.personalityTraits || '');
      setNotes(character.notes || '');
      setColor(character.color || '#f59e0b');
    } else {
      setName('');
      setRole('supporting');
      setAliases('');
      setAge('');
      setOccupation('');
      setPhysicalTraits('');
      setBio('');
      setPersonalityTraits('');
      setNotes('');
      setColor('#f59e0b');
    }
  }, [character, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const updated: CharacterProfile = {
      id: character?.id || `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookId,
      name: trimmedName,
      role,
      aliases: aliases.trim() || undefined,
      age: age.trim() || undefined,
      occupation: occupation.trim() || undefined,
      physicalTraits: physicalTraits.trim(),
      bio: bio.trim(),
      personalityTraits: personalityTraits.trim() || undefined,
      notes: notes.trim() || undefined,
      color,
      createdAt: character?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              {character ? 'Edit Character Profile' : 'New Character Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-neutral-300 font-medium mb-1">
                Character Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nicholas Drake"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Narrative Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CharacterRole)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="protagonist">Protagonist</option>
                <option value="antagonist">Antagonist</option>
                <option value="supporting">Supporting</option>
                <option value="minor">Minor / Cameo</option>
              </select>
            </div>
          </div>

          {/* Aliases, Age, Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Aliases / Monikers</label>
              <input
                type="text"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="e.g. Nick, The Apprentice"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Age</label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 22 or Mid-40s"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Occupation / Title</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Astrolabe Builder"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Accent Color Badge */}
          <div>
            <label className="block text-neutral-400 mb-1.5 font-medium">Character Accent Color</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Physical Traits & Appearance */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-neutral-300 mb-1 font-medium">
              Physical Traits & Appearance
            </label>
            <textarea
              rows={3}
              value={physicalTraits}
              onChange={(e) => setPhysicalTraits(e.target.value)}
              placeholder="Height, build, eye color, hair, facial features, scars, clothing style, distinctive gestures..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-neutral-600"
            />
          </div>

          {/* Biography & Backstory */}
          <div>
            <label className="block text-neutral-300 mb-1 font-medium">
              Biography & Backstory
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Origins, history, motivations, core relationships, internal conflicts..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-neutral-600"
            />
          </div>

          {/* Personality, Demeanor & Voice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Personality & Voice</label>
              <textarea
                rows={2}
                value={personalityTraits}
                onChange={(e) => setPersonalityTraits(e.target.value)}
                placeholder="Speech quirks, temperament, moral boundaries, habits..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Private Author Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Secrets, future reveals, character arc notes..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Submit Actions */}
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
              Save Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
