export interface OrnamentDefinition {
  id: string;
  name: string;
  genre: 'all' | 'literary' | 'fantasy' | 'modern' | 'nonfiction';
  svg: string; // inline SVG string
}

export const ORNAMENTS: OrnamentDefinition[] = [
  {
    id: 'none',
    name: 'None / Plain',
    genre: 'all',
    svg: '',
  },
  {
    id: 'fleuron',
    name: 'Classic Fleuron',
    genre: 'literary',
    svg: `<svg viewBox="0 0 100 24" fill="currentColor" class="w-20 h-5 mx-auto opacity-70"><path d="M50 2 C44 8 40 14 30 14 C36 14 42 16 46 22 C48 18 52 18 54 22 C58 16 64 14 70 14 C60 14 56 8 50 2 Z M20 12 C25 12 28 14 30 17 C28 15 25 15 20 15 C15 15 12 17 10 19 C12 16 15 12 20 12 Z M80 12 C75 12 72 14 70 17 C72 15 75 15 80 15 C85 15 88 17 90 19 C88 16 85 12 80 12 Z"/></svg>`,
  },
  {
    id: 'flourish-ivy',
    name: 'Fantasy Ivy Flourish',
    genre: 'fantasy',
    svg: `<svg viewBox="0 0 120 20" fill="currentColor" class="w-28 h-5 mx-auto opacity-75"><path d="M60 4 C50 1 40 12 30 10 C34 7 36 3 32 1 C28 -1 25 4 22 7 C18 10 12 9 6 10 C12 12 20 13 24 11 C28 9 32 15 42 15 C52 15 56 6 60 4 Z M60 4 C70 1 80 12 90 10 C86 7 84 3 88 1 C92 -1 95 4 98 7 C102 10 108 9 114 10 C108 12 100 13 96 11 C92 9 88 15 78 15 C68 15 64 6 60 4 Z"/></svg>`,
  },
  {
    id: 'geometric-stars',
    name: 'Celestial Diamond Stars',
    genre: 'fantasy',
    svg: `<svg viewBox="0 0 100 20" fill="currentColor" class="w-24 h-5 mx-auto opacity-75"><polygon points="50,2 53,8 59,10 53,12 50,18 47,12 41,10 47,8" /><polygon points="30,5 32,9 36,10 32,11 30,15 28,11 24,10 28,9" /><polygon points="70,5 72,9 76,10 72,11 70,15 68,11 64,10 68,9" /></svg>`,
  },
  {
    id: 'dashes',
    name: 'Modern Rule & Diamond',
    genre: 'modern',
    svg: `<svg viewBox="0 0 120 16" fill="currentColor" class="w-24 h-4 mx-auto opacity-60"><rect x="10" y="7.5" width="40" height="1" /><polygon points="60,3 65,8 60,13 55,8" /><rect x="70" y="7.5" width="40" height="1" /></svg>`,
  },
  {
    id: 'minimal-dots',
    name: 'Minimal Asterisks',
    genre: 'nonfiction',
    svg: `<svg viewBox="0 0 80 16" fill="currentColor" class="w-16 h-4 mx-auto opacity-50"><circle cx="20" cy="8" r="2"/><circle cx="40" cy="8" r="2.5"/><circle cx="60" cy="8" r="2"/></svg>`,
  },
];

export const ORNAMENT_COLLECTION = ORNAMENTS;

export const getOrnamentById = (id?: string): OrnamentDefinition => {
  return ORNAMENTS.find((o) => o.id === id) || ORNAMENTS[0];
};

export const getOrnamentSvg = (id?: string): string => {
  const ornament = getOrnamentById(id);
  return ornament ? ornament.svg : '';
};
