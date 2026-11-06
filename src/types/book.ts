export type SectionType =
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'toc'
  | 'prologue'
  | 'chapter'
  | 'epilogue'
  | 'afterword'
  | 'about-author';

export type SectionGroup = 'front-matter' | 'body' | 'back-matter';

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  subtitle?: string;
  number?: number;
  type: SectionType;
  group: SectionGroup;
  content: string; // HTML content from rich editor
  order: number;
  wordCount: number;
  targetWordCount?: number; // Per-chapter goal (e.g. 2500 words)
  customOrnamentId?: string;
  includeInToc: boolean;
  pageBreakBefore: boolean;
}

export type GenreThemeId = 'literary' | 'modern' | 'fantasy' | 'nonfiction';

export type FontChoice =
  | 'Cormorant Garamond'
  | 'EB Garamond'
  | 'Playfair Display'
  | 'Spectral'
  | 'Cinzel'
  | 'Inter'
  | 'system-ui';

export type DropCapStyle = 'none' | 'simple' | 'illuminated' | 'raised';

export interface StyleConfig {
  id: string;
  themeId: GenreThemeId;
  bodyFont: FontChoice;
  headingFont: FontChoice;
  fontSizePt: number; // 10, 11, 12, etc.
  lineSpacing: number; // 1.3, 1.4, 1.5, 1.6
  paragraphIndentEm: number; // 0, 1, 1.25, 1.5
  paragraphSpacingPt: number; // 0 for fiction, 6-12 for non-fiction
  dropCap: DropCapStyle;
  firstParagraphDropCap: boolean;
  firstParagraphSmallCaps: boolean;
  chapterOrnamentId: string; // 'none', 'fleuron', 'flourish-ivy', 'geometric-stars', 'dashes'
  sceneBreakOrnamentId: string;
  pageNumbering: 'bottom-center' | 'bottom-outer' | 'top-outer' | 'none';
  headerText: 'title-and-chapter' | 'author-and-title' | 'none';
  trimSize: '5x8' | '5.5x8.5' | '6x9';
}

export type AutoSaveFrequency = 'immediate' | '5s' | '15s' | '30s' | 'manual';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  coverImage?: string; // Data URL or object URL
  language: string;
  genre: string;
  styleConfig: StyleConfig;
  autoSaveFrequency: AutoSaveFrequency;
  targetWordCount?: number; // Total manuscript target (e.g. 60,000 words)
  dailyWordGoal?: number; // Daily writing target (e.g. 1,000 words)
  dailyBaselineWords?: number; // Starting word count at start of today's date
  dailyBaselineDate?: string; // YYYY-MM-DD for daily progress calculation
  createdAt: number;
  updatedAt: number;
}

export type DeviceType = 'kindle' | 'apple-books' | 'print-spread';

export type DeviceTheme = 'light' | 'sepia' | 'dark';

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';

export interface CharacterProfile {
  id: string;
  bookId: string;
  name: string;
  role: CharacterRole;
  aliases?: string;
  age?: string;
  occupation?: string;
  physicalTraits: string; // Key traits: eyes, height, build, distinctive attire
  bio: string; // Backstory, motive, history
  personalityTraits?: string; // Voice, demeanor, speech habits
  notes?: string; // Author secrets, arc notes
  color?: string; // Avatar accent color badge (hex)
  createdAt: number;
  updatedAt: number;
}
