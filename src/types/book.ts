export type SectionType =
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'foreword'
  | 'toc'
  | 'part'
  | 'prologue'
  | 'chapter'
  | 'epilogue'
  | 'afterword'
  | 'acknowledgments'
  | 'about-author';

export type SectionGroup = 'front-matter' | 'body' | 'back-matter';

export interface FootnoteItem {
  id: string;
  number: number;
  text: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  subtitle?: string;
  number?: number;
  partNumber?: number; // Optional Part number if section is a 'part'
  type: SectionType;
  group: SectionGroup;
  content: string; // HTML content from rich editor
  order: number;
  wordCount: number;
  targetWordCount?: number; // Per-chapter goal (e.g. 2500 words)
  customOrnamentId?: string;
  headerImage?: string; // Optional custom chapter banner or header illustration (Phase 3)
  headerImagePlacement?: 'banner' | 'full-bleed' | 'ornament';
  includeInToc: boolean;
  pageBreakBefore: boolean;
  footnotes?: FootnoteItem[];
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

export type TrimSize =
  | '5x8'
  | '5.25x8'
  | '5.5x8.5'
  | '6x9'
  | '6.14x9.21'
  | '7x10'
  | '8.5x11';

export type PaperStock = 'cream-55' | 'white-50' | 'color-70';

export type BindingType = 'paperback' | 'hardcover';

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
  trimSize: TrimSize;
  paperStock?: PaperStock;
  rectoChapterOpening?: boolean; // Chapters begin on odd (right-hand) page
  hyphenation?: boolean;
  headerBannerStyle?: 'none' | 'botanical' | 'celestial' | 'geometric' | 'custom';
  headerBannerImage?: string;
}

export type AutoSaveFrequency = 'immediate' | '5s' | '15s' | '30s' | 'manual';

export interface CoverWrapConfig {
  frontTitle: string;
  frontSubtitle?: string;
  frontAuthor: string;
  frontCoverImage?: string;
  backBlurb: string;
  backAuthorBio?: string;
  authorPhoto?: string;
  spineTitle: string;
  spineAuthor: string;
  publisherImprint?: string;
  publisherLogo?: string;
  paperStock: PaperStock;
  binding: BindingType;
  includeBarcode: boolean;
  priceBarcodeAddon?: string; // e.g. "51999" ($19.99 USD)
  backgroundColor: string; // hex
  textColor: string; // hex
  accentColor: string; // hex
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  coverImage?: string; // Data URL or object URL
  coverWrap?: CoverWrapConfig; // Complete 360 wrap specs (Phase 3)
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
