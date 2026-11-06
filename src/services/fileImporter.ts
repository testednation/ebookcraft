import JSZip from 'jszip';
import { Chapter, SectionType } from '../types/book';

export interface ImportResult {
  bookTitle?: string;
  chapters: Omit<Chapter, 'id' | 'bookId'>[];
  detectedWordCount: number;
}

export async function importManuscriptFile(file: File): Promise<ImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    return await importDocxFile(file);
  } else if (extension === 'txt' || extension === 'md') {
    return await importTextOrMarkdownFile(file);
  } else {
    throw new Error(`Unsupported file type: .${extension}. Please upload a .docx, .txt, or .md file.`);
  }
}

// DOCX parsing via JSZip
async function importDocxFile(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: word/document.xml not found.');
  }

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const pNodes = xmlDoc.getElementsByTagName('w:p');
  const paragraphs: { text: string; isHeading: boolean; isPart: boolean; headingText?: string }[] = [];

  for (let i = 0; i < pNodes.length; i++) {
    const p = pNodes[i];
    // Check style
    const pStyle = p.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
    const isHeading1 = /Heading1|Heading 1|Title|Part/i.test(pStyle);

    // Extract text runs
    const tNodes = p.getElementsByTagName('w:t');
    let pText = '';
    for (let j = 0; j < tNodes.length; j++) {
      pText += tNodes[j].textContent || '';
    }
    pText = pText.trim();
    if (!pText) continue;

    const isPartHeader = /^(PART|BOOK|ACT)\s+([IVXLCDM\d]+)/i.test(pText) || /PartDivider/i.test(pStyle);
    const isChapterHeader = isHeading1 || /^(CHAPTER|PROLOGUE|EPILOGUE)\s*(\d+|[IVXLCDM]+)?/i.test(pText);

    paragraphs.push({
      text: pText,
      isHeading: isChapterHeader || isPartHeader,
      isPart: isPartHeader,
      headingText: isChapterHeader || isPartHeader ? pText : undefined,
    });
  }

  return assembleChaptersFromParagraphs(paragraphs, file.name.replace(/\.docx$/i, ''));
}

// TXT / MD parsing
async function importTextOrMarkdownFile(file: File): Promise<ImportResult> {
  const rawText = await file.text();
  const lines = rawText.split(/\r?\n/);

  const paragraphs: { text: string; isHeading: boolean; isPart: boolean; headingText?: string }[] = [];
  let currentPara: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentPara.length > 0) {
        paragraphs.push({
          text: currentPara.join(' '),
          isHeading: false,
          isPart: false,
        });
        currentPara = [];
      }
      continue;
    }

    // Check if line is heading
    const isMarkdownHeading = /^#{1,3}\s+(.+)$/.test(trimmed);
    const isPartPattern = /^(PART|BOOK|ACT)\s+([IVXLCDM\d]+)(:\s*.+)?$/i.test(trimmed);
    const isChapterPattern = /^(CHAPTER|PROLOGUE|EPILOGUE)\s*(\d+|[IVXLCDM]+)?(:\s*.+)?$/i.test(trimmed);

    if (isMarkdownHeading || isPartPattern || isChapterPattern) {
      if (currentPara.length > 0) {
        paragraphs.push({
          text: currentPara.join(' '),
          isHeading: false,
          isPart: false,
        });
        currentPara = [];
      }
      const headingClean = trimmed.replace(/^#{1,3}\s+/, '');
      paragraphs.push({
        text: headingClean,
        isHeading: true,
        isPart: isPartPattern,
        headingText: headingClean,
      });
    } else {
      currentPara.push(trimmed);
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push({
      text: currentPara.join(' '),
      isHeading: false,
      isPart: false,
    });
  }

  return assembleChaptersFromParagraphs(paragraphs, file.name.replace(/\.(txt|md)$/i, ''));
}

function assembleChaptersFromParagraphs(
  paragraphs: { text: string; isHeading: boolean; isPart: boolean; headingText?: string }[],
  fallbackTitle: string
): ImportResult {
  const chapters: Omit<Chapter, 'id' | 'bookId'>[] = [];
  let currentTitle = 'Chapter 1';
  let currentType: SectionType = 'chapter';
  let currentPartNumber: number | undefined = undefined;
  let currentParas: string[] = [];
  let orderIndex = 0;
  let partCount = 0;
  let chapterCount = 0;
  let totalWordCount = 0;

  function flushChapter() {
    if (currentParas.length === 0 && currentType !== 'part') return;

    const htmlContent = currentParas.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
    const words = countWords(currentParas.join(' '));
    totalWordCount += words;

    chapters.push({
      title: currentTitle,
      type: currentType,
      group: 'body',
      partNumber: currentPartNumber,
      content: htmlContent || (currentType === 'part' ? '<p class="text-center italic text-stone-500">Part divider</p>' : '<p></p>'),
      order: orderIndex++,
      wordCount: words,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    });

    currentParas = [];
  }

  paragraphs.forEach((p) => {
    if (p.isPart) {
      flushChapter();
      partCount++;
      currentTitle = p.headingText || `Part ${partCount}`;
      currentType = 'part';
      currentPartNumber = partCount;
      flushChapter(); // Part is a divider section
      currentTitle = `Chapter ${++chapterCount}`;
      currentType = 'chapter';
      return;
    }

    if (p.isHeading) {
      flushChapter();
      currentTitle = p.headingText || `Chapter ${++chapterCount}`;
      currentType = determineSectionType(currentTitle);
      return;
    }

    currentParas.push(p.text);
  });

  flushChapter();

  // If no sections were detected, place entire text into single chapter
  if (chapters.length === 0 && paragraphs.length > 0) {
    const allHtml = paragraphs.map((p) => `<p>${escapeHtml(p.text)}</p>`).join('\n');
    const words = countWords(paragraphs.map((p) => p.text).join(' '));
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
  if (lower.includes('part') || lower.includes('book ')) return 'part';
  return 'chapter';
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
