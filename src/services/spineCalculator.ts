import { TrimSize, PaperStock, BindingType } from '../types/book';

export interface SpineSpecs {
  pageCount: number;
  spineWidthInches: number;
  spineWidthMm: number;
  trimWidthInches: number;
  trimHeightInches: number;
  bleedInches: number;
  totalWrapWidthInches: number;
  totalWrapHeightInches: number;
  gutterMarginInches: number;
  outsideMarginInches: number;
  topMarginInches: number;
  bottomMarginInches: number;
  hingeInches: number;
  turnInInches: number;
  isSpineTextSafe: boolean; // Needs at least 80 pages (~0.2" spine) for legible spine titling on KDP
}

export const TRIM_DIMENSIONS: Record<TrimSize, { width: number; height: number; label: string; commonGenre: string }> = {
  '5x8': { width: 5.0, height: 8.0, label: '5" × 8"', commonGenre: 'Poetry, Novella, Literary' },
  '5.25x8': { width: 5.25, height: 8.0, label: '5.25" × 8"', commonGenre: 'Standard Digest, Fiction' },
  '5.5x8.5': { width: 5.5, height: 8.5, label: '5.5" × 8.5"', commonGenre: 'Trade Paperback, General Fiction (Most Popular)' },
  '6x9': { width: 6.0, height: 9.0, label: '6" × 9"', commonGenre: 'Epic Fantasy, Non-Fiction, Memoir' },
  '6.14x9.21': { width: 6.14, height: 9.21, label: '6.14" × 9.21" (Royal Octavo)', commonGenre: 'UK Trade, Scholarly Editions' },
  '7x10': { width: 7.0, height: 10.0, label: '7" × 10"', commonGenre: 'Textbook, Manual, Art Book' },
  '8.5x11': { width: 8.5, height: 11.0, label: '8.5" × 11"', commonGenre: 'Workbook, Workbook, Children\'s' },
};

export const PAPER_STOCK_MULTIPLIERS: Record<PaperStock, { ppi: number; thicknessPerSheet: number; label: string }> = {
  'cream-55': { ppi: 400, thicknessPerSheet: 0.0025, label: '55# Warm Cream (Fiction Standard)' },
  'white-50': { ppi: 444, thicknessPerSheet: 0.002252, label: '50# Crisp White (Non-Fiction)' },
  'color-70': { ppi: 426, thicknessPerSheet: 0.002347, label: '70# Premium Color / Heavy White' },
};

export function estimatePageCountFromWords(totalWords: number, trimSize: TrimSize = '5.5x8.5'): number {
  // Approximate words per page by trim size
  const wordsPerPageMap: Record<TrimSize, number> = {
    '5x8': 240,
    '5.25x8': 255,
    '5.5x8.5': 280,
    '6x9': 320,
    '6.14x9.21': 340,
    '7x10': 420,
    '8.5x11': 550,
  };

  const wordsPerPage = wordsPerPageMap[trimSize] || 280;
  const bodyPages = Math.ceil(Math.max(1, totalWords) / wordsPerPage);
  // Add front matter & back matter buffer (title, copyright, TOC, part dividers)
  const totalEstimated = bodyPages + 8;
  // Round up to nearest even page (standard printer signature requirement)
  return totalEstimated % 2 === 0 ? totalEstimated : totalEstimated + 1;
}

export function calculateSpineAndWrap(
  pageCount: number,
  trimSize: TrimSize = '5.5x8.5',
  paperStock: PaperStock = 'cream-55',
  binding: BindingType = 'paperback'
): SpineSpecs {
  const trim = TRIM_DIMENSIONS[trimSize] || TRIM_DIMENSIONS['5.5x8.5'];
  const stock = PAPER_STOCK_MULTIPLIERS[paperStock] || PAPER_STOCK_MULTIPLIERS['cream-55'];

  const rawSpine = pageCount * stock.thicknessPerSheet;
  const spineWidthInches = Math.max(0.06, Math.round(rawSpine * 1000) / 1000);
  const spineWidthMm = Math.round(spineWidthInches * 25.4 * 10) / 10;

  const bleedInches = 0.125; // 1/8" industry standard bleed
  let hingeInches = 0;
  let turnInInches = 0;

  if (binding === 'hardcover') {
    hingeInches = 0.125; // 1/8" hinge gap next to spine
    turnInInches = 0.625; // 5/8" wrap around cardboard cover
  }

  // Wrap dimensions
  const totalWrapWidthInches =
    bleedInches +
    turnInInches +
    trim.width +
    hingeInches +
    spineWidthInches +
    hingeInches +
    trim.width +
    turnInInches +
    bleedInches;

  const totalWrapHeightInches =
    bleedInches + turnInInches + trim.height + turnInInches + bleedInches;

  // Gutter (inner inside margin) requirements for KDP/Ingram
  let gutterMarginInches = 0.375;
  if (pageCount >= 501) gutterMarginInches = 0.75;
  else if (pageCount >= 301) gutterMarginInches = 0.625;
  else if (pageCount >= 151) gutterMarginInches = 0.5;

  return {
    pageCount,
    spineWidthInches,
    spineWidthMm,
    trimWidthInches: trim.width,
    trimHeightInches: trim.height,
    bleedInches,
    totalWrapWidthInches: Math.round(totalWrapWidthInches * 1000) / 1000,
    totalWrapHeightInches: Math.round(totalWrapHeightInches * 1000) / 1000,
    gutterMarginInches,
    outsideMarginInches: 0.5,
    topMarginInches: 0.625,
    bottomMarginInches: 0.625,
    hingeInches,
    turnInInches,
    isSpineTextSafe: pageCount >= 80, // Minimum for text on spine in KDP
  };
}
