import { BookTheme } from '../types/book';

export const GENRE_THEMES: BookTheme[] = [
  {
    id: 'theme-classic-literary',
    name: 'Classic Literary',
    preset: 'literary',
    description: 'Timeless traditional book setting inspired by Oxford & Folio Society classics.',
    headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'EB Garamond', Georgia, serif",
    ornamentKey: 'fleuron',
    dropCapStyle: 'classic',
    headerAlignment: 'center',
    chapterTitleTransform: 'uppercase',
    showRule: true,
  },
  {
    id: 'theme-modern-minimal',
    name: 'Modern Minimalist',
    preset: 'modern',
    description: 'Airy, contemporary pacing with crisp typography and subtle geometric accents.',
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyFont: "'EB Garamond', Georgia, serif",
    ornamentKey: 'diamonds',
    dropCapStyle: 'modern',
    headerAlignment: 'left',
    chapterTitleTransform: 'capitalize',
    showRule: false,
  },
  {
    id: 'theme-fantasy-romance',
    name: 'Fantasy & Romance',
    preset: 'fantasy',
    description: 'Evocative historical & epic fiction setting with ornate fleurons and majestic headers.',
    headingFont: "'Cinzel', serif",
    bodyFont: "'Cormorant Garamond', Georgia, serif",
    ornamentKey: 'scroll',
    dropCapStyle: 'ornate',
    headerAlignment: 'center',
    chapterTitleTransform: 'uppercase',
    showRule: true,
  },
  {
    id: 'theme-contemporary-nonfiction',
    name: 'Contemporary Non-Fiction',
    preset: 'nonfiction',
    description: 'Structured, highly readable layout optimized for business, memoir, and trade books.',
    headingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyFont: "'EB Garamond', Georgia, serif",
    ornamentKey: 'lines',
    dropCapStyle: 'none',
    headerAlignment: 'left',
    chapterTitleTransform: 'none',
    showRule: true,
  },
];

export function getThemeById(id: string): BookTheme {
  return GENRE_THEMES.find((t) => t.id === id) || GENRE_THEMES[0];
}
