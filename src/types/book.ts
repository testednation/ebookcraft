export type SectionType = 'front' | 'body' | 'back';

export type SectionSubtype = 
  | 'title-page'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'toc'
  | 'part'
  | 'chapter'
  | 'prologue'
  | 'epilogue'
  | 'acknowledgments'
  | 'about-author'
  | 'also-by'
  | 'custom';

export interface BookSection {
  id: string;
  bookId: string;
  type: SectionType;
  subtype: SectionSubtype;
  title: string;
  subtitle?: string;
  epigraph?: string;
  content: string; // HTML content
  order: number;
  includeInToc: boolean;
  dropCap: boolean;
  customOrnament?: string;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export type TrimSizeId = '5x8' | '5.5x8.5' | '6x9' | '7x10' | '8.5x11';

export interface TrimSizeOption {
  id: TrimSizeId;
  name: string;
  widthInches: number;
  heightInches: number;
  description: string;
}

export const TRIM_SIZES: TrimSizeOption[] = [
  { id: '5x8', name: '5 × 8 in', widthInches: 5, heightInches: 8, description: 'Popular for fiction & poetry paperbacks' },
  { id: '5.5x8.5', name: '5.5 × 8.5 in', widthInches: 5.5, heightInches: 8.5, description: 'Digest size, great for memoirs & non-fiction' },
  { id: '6x9', name: '6 × 9 in (US Trade)', widthInches: 6, heightInches: 9, description: 'Standard US Trade size for novels & hardcovers' },
  { id: '7x10', name: '7 × 10 in', widthInches: 7, heightInches: 10, description: 'Textbooks, manuals & graphic-heavy layouts' },
  { id: '8.5x11', name: '8.5 × 11 in', widthInches: 8.5, heightInches: 11, description: 'Workbooks, standard letter size' },
];

export type NumberFormat = 'Roman' | 'Arabic' | 'Word' | 'None';

export type GenrePreset = 'literary' | 'modern' | 'fantasy' | 'nonfiction';

export interface BookTheme {
  id: string;
  name: string;
  preset: GenrePreset;
  description: string;
  headingFont: string;
  bodyFont: string;
  ornamentKey: string;
  dropCapStyle: 'classic' | 'modern' | 'ornate' | 'none';
  headerAlignment: 'center' | 'left';
  chapterTitleTransform: 'uppercase' | 'capitalize' | 'none';
  showRule: boolean;
}

export interface BookProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  edition?: string;
  seriesName?: string;
  seriesNumber?: string;
  isbnEpub?: string;
  isbnPrint?: string;
  language: string;
  description?: string;
  copyrightYear: string;
  rightsStatement: string;
  coverImage?: string; // Base64 data URL
  
  // Formatting preferences matching Atticus/Vellum
  themeId: string;
  trimSize: TrimSizeId;
  headingFont: string;
  bodyFont: string;
  baseFontSize: number; // 14 to 20
  lineSpacing: number; // 1.3 to 2.0
  numberFormat: NumberFormat;
  dropCapEnabled: boolean;
  dropCapStyle: 'classic' | 'modern' | 'ornate' | 'none';
  ornamentKey: string;
  versoHeader: 'title' | 'author' | 'none';
  rectoHeader: 'chapter' | 'title' | 'none';

  createdAt: number;
  updatedAt: number;
}
