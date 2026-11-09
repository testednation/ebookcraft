import JSZip from 'jszip';
import { Chapter, SectionType } from '../types/book';
import {
  detectDuplicatesAcrossChapters,
  DuplicateReport,
  stripHtml,
} from './duplicateDetector';

export interface ImportResult {
  bookTitle?: string;
  chapters: Omit<Chapter, 'id' | 'bookId'>[];
  detectedWordCount: number;
  duplicateReport: DuplicateReport;
  fileName: string;
  fileSize: number;
}

interface ParsedParagraph {
  text: string;
  html: string;
  isHeading: boolean;
  isPart: boolean;
  headingText?: string;
  isSceneBreak?: boolean;
}

export async function importManuscriptFile(file: File): Promise<ImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let result: Omit<ImportResult, 'duplicateReport' | 'fileName' | 'fileSize'>;

  if (extension === 'docx') {
    result = await importDocxFile(file);
  } else if (extension === 'txt' || extension === 'md') {
    result = await importTextOrMarkdownFile(file);
  } else {
    throw new Error(`Unsupported file type: .${extension}. Please upload a .docx, .txt, or .md file.`);
  }

  // Convert chapters to dummy format to run duplicate detector across imported chapters
  const dummyChapters: Chapter[] = result.chapters.map((ch, idx) => ({
    ...ch,
    id: `temp_import_${idx}`,
    bookId: 'temp_import_book',
  }));

  const duplicateReport = detectDuplicatesAcrossChapters(dummyChapters);

  return {
    ...result,
    duplicateReport,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Advanced DOCX parser with XML run parsing, formatting preservation (bold, italic, underline),
 * heading hierarchy detection, and scene break recognition.
 */
async function importDocxFile(
  file: File
): Promise<Omit<ImportResult, 'duplicateReport' | 'fileName' | 'fileSize'>> {
  const zip = await JSZip.loadAsync(file);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: word/document.xml not found.');
  }

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const pNodes = xmlDoc.getElementsByTagName('w:p');
  const parsedParas: ParsedParagraph[] = [];

  for (let i = 0; i < pNodes.length; i++) {
    const p = pNodes[i];

    // Check style
    const pStyleNode = p.getElementsByTagName('w:pStyle')[0];
    const pStyle = pStyleNode?.getAttribute('w:val') || '';

    // Check heading styles
    const isHeading1 = /Heading\s*1|Title/i.test(pStyle);
    const isHeading2 = /Heading\s*2|Subtitle/i.test(pStyle);
    const isHeading3 = /Heading\s*3/i.test(pStyle);
    const isPartStyle = /Part|Book|Act/i.test(pStyle);

    // Parse runs within this paragraph to preserve bold, italic, and underline
    const rNodes = p.getElementsByTagName('w:r');
    let plainText = '';
    let htmlContent = '';

    for (let j = 0; j < rNodes.length; j++) {
      const r = rNodes[j];
      const rPr = r.getElementsByTagName('w:rPr')[0];

      let isBold = false;
      let isItalic = false;
      let isUnderline = false;
      let isStrike = false;

      if (rPr) {
        if (rPr.getElementsByTagName('w:b').length > 0 || rPr.getElementsByTagName('w:bCs').length > 0) {
          isBold = true;
        }
        if (rPr.getElementsByTagName('w:i').length > 0 || rPr.getElementsByTagName('w:iCs').length > 0) {
          isItalic = true;
        }
        if (rPr.getElementsByTagName('w:u').length > 0) {
          isUnderline = true;
        }
        if (rPr.getElementsByTagName('w:strike').length > 0) {
          isStrike = true;
        }
      }

      // Collect text nodes in run
      const tNodes = r.getElementsByTagName('w:t');
      let runText = '';
      for (let k = 0; k < tNodes.length; k++) {
        runText += tNodes[k].textContent || '';
      }

      if (!runText) continue;

      plainText += runText;

      let runHtml = escapeHtml(runText);
      if (isBold) runHtml = `<strong>${runHtml}</strong>`;
      if (isItalic) runHtml = `<em>${runHtml}</em>`;
      if (isUnderline) runHtml = `<u>${runHtml}</u>`;
      if (isStrike) runHtml = `<s>${runHtml}</s>`;

      htmlContent += runHtml;
    }

    plainText = plainText.trim();
    if (!plainText) continue;

    // Check scene break patterns
    const isSceneBreak =
      /^(\*|\* \* \*|\*\*\*|❦|❖|✦|---|~~\~|•\s*•\s*•|\. \. \.)$/.test(plainText) ||
      plainText === '❦  •  ❦';

    // Check chapter / part patterns
    const isPartHeader =
      isPartStyle ||
      /^(PART|BOOK|ACT)\s+([IVXLCDM\d]+)(:.*)?$/i.test(plainText);

    const isChapterHeader =
      isHeading1 ||
      isHeading2 ||
      isHeading3 ||
      /^(CHAPTER|PROLOGUE|EPILOGUE|PREFACE|FOREWORD|INTRODUCTION|AFTERWORD|ACKNOWLEDGMENTS)\s*(\d+|[IVXLCDM]+)?(:.*)?$/i.test(
        plainText
      );

    parsedParas.push({
      text: plainText,
      html: isSceneBreak
        ? '<p class="scene-break text-center my-6">❦  •  ❦</p>'
        : `<p>${htmlContent}</p>`,
      isHeading: (isChapterHeader || isPartHeader) && !isSceneBreak,
      isPart: isPartHeader && !isSceneBreak,
      headingText: isChapterHeader || isPartHeader ? plainText : undefined,
      isSceneBreak,
    });
  }

  const fallbackTitle = file.name.replace(/\.docx$/i, '');
  return assembleChaptersFromParsed(parsedParas, fallbackTitle);
}

/**
 * TXT and Markdown parser with markdown heading (#, ##) and regex support.
 */
async function importTextOrMarkdownFile(
  file: File
): Promise<Omit<ImportResult, 'duplicateReport' | 'fileName' | 'fileSize'>> {
  const rawText = await file.text();
  const lines = rawText.split(/\r?\n/);

  const parsedParas: ParsedParagraph[] = [];
  let currentPara: string[] = [];

  const flushCurrent = () => {
    if (currentPara.length === 0) return;
    const fullText = currentPara.join(' ').trim();
    if (!fullText) {
      currentPara = [];
      return;
    }

    const isSceneBreak =
      /^(\*|\* \* \*|\*\*\*|❦|❖|✦|---|~~\~|•\s*•\s*•|\. \. \.)$/.test(fullText) ||
      fullText === '❦  •  ❦';

    parsedParas.push({
      text: fullText,
      html: isSceneBreak
        ? '<p class="scene-break text-center my-6">❦  •  ❦</p>'
        : `<p>${formatMarkdownInline(fullText)}</p>`,
      isHeading: false,
      isPart: false,
      isSceneBreak,
    });
    currentPara = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushCurrent();
      continue;
    }

    // Check markdown or section headings
    const isMarkdownHeading = /^#{1,3}\s+(.+)$/.test(trimmed);
    const isPartPattern = /^(PART|BOOK|ACT)\s+([IVXLCDM\d]+)(:\s*.+)?$/i.test(trimmed);
    const isChapterPattern =
      /^(CHAPTER|PROLOGUE|EPILOGUE|PREFACE|FOREWORD|INTRODUCTION|AFTERWORD|ACKNOWLEDGMENTS)\s*(\d+|[IVXLCDM]+)?(:\s*.+)?$/i.test(
        trimmed
      );

    if (isMarkdownHeading || isPartPattern || isChapterPattern) {
      flushCurrent();
      const headingClean = trimmed.replace(/^#{1,3}\s+/, '').trim();
      parsedParas.push({
        text: headingClean,
        html: `<p><strong>${escapeHtml(headingClean)}</strong></p>`,
        isHeading: true,
        isPart: isPartPattern,
        headingText: headingClean,
      });
    } else {
      currentPara.push(trimmed);
    }
  }

  flushCurrent();

  const fallbackTitle = file.name.replace(/\.(txt|md)$/i, '');
  return assembleChaptersFromParsed(parsedParas, fallbackTitle);
}

/**
 * Organizes parsed paragraphs into Atticus/Vellum style Chapter structures.
 */
function assembleChaptersFromParsed(
  paragraphs: ParsedParagraph[],
  fallbackTitle: string
): Omit<ImportResult, 'duplicateReport' | 'fileName' | 'fileSize'> {
  const chapters: Omit<Chapter, 'id' | 'bookId'>[] = [];
  let currentTitle = 'Chapter 1';
  let currentType: SectionType = 'chapter';
  let currentPartNumber: number | undefined = undefined;
  let currentHtmlBlocks: string[] = [];
  let currentPlainText: string[] = [];
  let orderIndex = 0;
  let partCount = 0;
  let chapterCount = 0;
  let totalWordCount = 0;

  function flushChapter() {
    if (currentHtmlBlocks.length === 0 && currentType !== 'part') return;

    const words = countWords(currentPlainText.join(' '));
    totalWordCount += words;

    const contentHtml =
      currentHtmlBlocks.join('\n') ||
      (currentType === 'part'
        ? '<p class="text-center italic opacity-75">"Across the threshold of the new realm..."</p>'
        : '<p></p>');

    chapters.push({
      title: currentTitle,
      type: currentType,
      group: determineSectionGroup(currentType),
      partNumber: currentPartNumber,
      content: contentHtml,
      order: orderIndex++,
      wordCount: words,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    });

    currentHtmlBlocks = [];
    currentPlainText = [];
  }

  paragraphs.forEach((p) => {
    if (p.isPart) {
      flushChapter();
      partCount++;
      currentTitle = p.headingText || `Part ${partCount}`;
      currentType = 'part';
      currentPartNumber = partCount;
      flushChapter(); // Full page part divider
      currentTitle = `Chapter ${++chapterCount}`;
      currentType = 'chapter';
      currentPartNumber = undefined;
      return;
    }

    if (p.isHeading) {
      flushChapter();
      currentTitle = p.headingText || `Chapter ${++chapterCount}`;
      currentType = determineSectionType(currentTitle);
      return;
    }

    currentHtmlBlocks.push(p.html);
    currentPlainText.push(p.text);
  });

  flushChapter();

  // If no headings found, package all into Chapter 1
  if (chapters.length === 0 && paragraphs.length > 0) {
    const allHtml = paragraphs.map((p) => p.html).join('\n');
    const allText = paragraphs.map((p) => p.text).join(' ');
    const words = countWords(allText);

    chapters.push({
      title: 'Chapter 1',
      type: 'chapter',
      group: 'body',
      content: allHtml,
      order: 0,
      wordCount: words,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    });
    totalWordCount = words;
  }

  return {
    bookTitle: fallbackTitle,
    chapters,
    detectedWordCount: totalWordCount,
  };
}

function determineSectionType(title: string): SectionType {
  const lower = title.toLowerCase();
  if (lower.includes('prologue')) return 'prologue';
  if (lower.includes('epilogue')) return 'epilogue';
  if (lower.includes('foreword')) return 'foreword';
  if (lower.includes('acknowledgment')) return 'acknowledgments';
  if (lower.includes('afterword')) return 'afterword';
  if (lower.includes('about the author') || lower.includes('about author')) return 'about-author';
  if (lower.includes('newsletter') || lower.includes('mailing list')) return 'newsletter';
  if (lower.includes('also by') || lower.includes('other books by')) return 'also-by';
  if (lower.includes('review') || lower.includes('note to reader') || lower.includes('dear reader')) return 'review-request';
  if (lower.includes('dedication')) return 'dedication';
  if (lower.includes('epigraph')) return 'epigraph';
  if (lower.includes('part') || lower.includes('book ')) return 'part';
  return 'chapter';
}

function determineSectionGroup(type: SectionType): 'front-matter' | 'body' | 'back-matter' {
  if (['title-page', 'copyright', 'dedication', 'epigraph', 'foreword', 'toc', 'prologue'].includes(type)) {
    return 'front-matter';
  }
  if (['epilogue', 'afterword', 'acknowledgments', 'about-author', 'newsletter', 'also-by', 'review-request'].includes(type)) {
    return 'back-matter';
  }
  return 'body';
}

function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMarkdownInline(text: string): string {
  let res = escapeHtml(text);
  // Bold **word**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *word*
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Strikethrough ~~word~~
  res = res.replace(/~~(.*?)~~/g, '<s>$1</s>');
  return res;
}
