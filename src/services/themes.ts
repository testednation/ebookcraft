import { StyleConfig, GenreThemeId } from '../types/book';

export interface ThemePreset {
  id: GenreThemeId;
  name: string;
  description: string;
  tag: string;
  config: Partial<StyleConfig>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'literary',
    name: 'Classic Literary',
    description: 'Timeless elegance with Cormorant Garamond, drop caps, and delicate fleurons. Ideal for fiction, memoir, and drama.',
    tag: 'Atticus Classic',
    config: {
      themeId: 'literary',
      bodyFont: 'Cormorant Garamond',
      headingFont: 'Playfair Display',
      fontSizePt: 11,
      lineSpacing: 1.45,
      paragraphIndentEm: 1.25,
      paragraphSpacingPt: 0,
      dropCap: 'simple',
      firstParagraphDropCap: true,
      firstParagraphSmallCaps: true,
      chapterOrnamentId: 'fleuron',
      sceneBreakOrnamentId: 'fleuron',
      pageNumbering: 'bottom-center',
      headerText: 'title-and-chapter',
    },
  },
  {
    id: 'fantasy',
    name: 'Mythic Fantasy & Romance',
    description: 'Regal Cinzel titling, ornate ivy flourishes, and illuminated drop caps tailored for epic sagas and dark academia.',
    tag: 'Vellum Flourish',
    config: {
      themeId: 'fantasy',
      bodyFont: 'Spectral',
      headingFont: 'Cinzel',
      fontSizePt: 11.5,
      lineSpacing: 1.5,
      paragraphIndentEm: 1.35,
      paragraphSpacingPt: 0,
      dropCap: 'illuminated',
      firstParagraphDropCap: true,
      firstParagraphSmallCaps: true,
      chapterOrnamentId: 'flourish-ivy',
      sceneBreakOrnamentId: 'geometric-stars',
      pageNumbering: 'bottom-outer',
      headerText: 'author-and-title',
    },
  },
  {
    id: 'modern',
    name: 'Modern Contemporary',
    description: 'Crisp editorial aesthetic with clean lines, geometric chapter headings, and refined minimalist dividers.',
    tag: 'Clean Minimal',
    config: {
      themeId: 'modern',
      bodyFont: 'EB Garamond',
      headingFont: 'Inter',
      fontSizePt: 11,
      lineSpacing: 1.4,
      paragraphIndentEm: 1.0,
      paragraphSpacingPt: 0,
      dropCap: 'none',
      firstParagraphDropCap: false,
      firstParagraphSmallCaps: true,
      chapterOrnamentId: 'dashes',
      sceneBreakOrnamentId: 'dashes',
      pageNumbering: 'bottom-center',
      headerText: 'title-and-chapter',
    },
  },
  {
    id: 'nonfiction',
    name: 'Executive Non-Fiction',
    description: 'Block paragraphs with subtle spacing, modern sans headings, and no indent. Perfect for business, manuals, and essays.',
    tag: 'Handbook / Essay',
    config: {
      themeId: 'nonfiction',
      bodyFont: 'Inter',
      headingFont: 'Inter',
      fontSizePt: 10.5,
      lineSpacing: 1.5,
      paragraphIndentEm: 0,
      paragraphSpacingPt: 8,
      dropCap: 'none',
      firstParagraphDropCap: false,
      firstParagraphSmallCaps: false,
      chapterOrnamentId: 'minimal-dots',
      sceneBreakOrnamentId: 'minimal-dots',
      pageNumbering: 'bottom-center',
      headerText: 'title-and-chapter',
    },
  },
];

export const getDefaultStyleConfig = (themeId: GenreThemeId = 'literary'): StyleConfig => {
  const preset = THEME_PRESETS.find((p) => p.id === themeId) || THEME_PRESETS[0];
  return {
    id: 'default-style',
    themeId,
    bodyFont: 'Cormorant Garamond',
    headingFont: 'Playfair Display',
    fontSizePt: 11,
    lineSpacing: 1.45,
    paragraphIndentEm: 1.25,
    paragraphSpacingPt: 0,
    dropCap: 'simple',
    firstParagraphDropCap: true,
    firstParagraphSmallCaps: true,
    chapterOrnamentId: 'fleuron',
    sceneBreakOrnamentId: 'fleuron',
    pageNumbering: 'bottom-center',
    headerText: 'title-and-chapter',
    trimSize: '5.5x8.5',
    ...preset.config,
  };
};
