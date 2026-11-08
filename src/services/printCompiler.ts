import { Book, Chapter, TrimSize } from '../types/book';
import { formatChapterHtml } from './formattingEngine';
import { getDefaultStyleConfig } from './themes';

export function compilePrintReadyHtml(book: Book, chapters: Chapter[]): string {
  const style = {
    ...getDefaultStyleConfig('literary'),
    ...(book?.styleConfig || {}),
  };

  const trimDimensions: Record<string, string> = {
    '5x8': '5in 8in',
    '5.25x8': '5.25in 8in',
    '5.5x8.5': '5.5in 8.5in',
    '6x9': '6in 9in',
    '6.14x9.21': '6.14in 9.21in',
    '7x10': '7in 10in',
    '8.5x11': '8.5in 11in',
  };
  const chosenTrim = trimDimensions[style.trimSize as string] || '5.5in 8.5in';

  // Dynamic KDP/Ingram gutter based on estimated page count
  const totalWords = chapters.reduce((s, c) => s + (c.wordCount || 0), 0);
  const estimatedPages = Math.ceil(totalWords / 280) + 8;
  let gutterMargin = '0.375in';
  if (estimatedPages >= 501) gutterMargin = '0.75in';
  else if (estimatedPages >= 301) gutterMargin = '0.625in';
  else if (estimatedPages >= 151) gutterMargin = '0.5in';

  const formattedChaptersHtml = chapters
    .map((ch, idx) => {
      // Part Divider Full Page
      if (ch.type === 'part') {
        return `
          <article class="print-chapter print-part-page break-right" id="chapter-${idx}">
            <div class="part-page-inner">
              <h1 class="part-page-title">${ch.title}</h1>
              ${ch.subtitle ? `<h2 class="part-page-subtitle">${ch.subtitle}</h2>` : ''}
              <div class="folio-scene-break" style="margin-top: 1in;">❖ &nbsp; ❖ &nbsp; ❖</div>
              ${ch.content ? `<div class="part-page-epigraph">${ch.content}</div>` : ''}
            </div>
          </article>
        `;
      }

      const formattedContent = formatChapterHtml(ch.content, style, ch.customOrnamentId);

      let footnotesHtml = '';
      if (ch.footnotes && ch.footnotes.length > 0) {
        const rows = ch.footnotes
          .map(
            (fn) => `
          <div class="print-footnote-row">
            <strong>[${fn.number}]</strong> ${fn.text}
          </div>
        `
          )
          .join('\n');
        footnotesHtml = `<footer class="print-footnotes-section"><div style="font-weight: bold; margin-bottom: 4pt; text-transform: uppercase; letter-spacing: 0.05em;">Notes</div>${rows}</footer>`;
      }

      const breakClass = style.rectoChapterOpening ? 'break-right' : (ch.pageBreakBefore ? 'break-before' : '');

      return `
        <article class="print-chapter ${breakClass}" id="chapter-${idx}">
          <header class="chapter-header">
            ${ch.headerImage ? `<div class="chapter-header-image" style="margin-bottom: 18pt; text-align: center;"><img src="${ch.headerImage}" alt="" style="max-height: 1.5in; max-width: 80%; border-radius: 4px;" /></div>` : ''}
            <h1 class="chapter-title">${ch.title}</h1>
            ${ch.subtitle ? `<h2 class="chapter-subtitle">${ch.subtitle}</h2>` : ''}
          </header>
          <div class="chapter-body">
            ${formattedContent}
          </div>
          ${footnotesHtml}
        </article>
      `;
    })
    .join('\n');

  const isRtl = book?.direction === 'rtl' || style.direction === 'rtl';

  return `<!DOCTYPE html>
<html lang="${book.language || 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${book.title} — Print Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;600&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${chosenTrim};
      margin-top: 0.75in;
      margin-bottom: 0.75in;
      margin-left: ${gutterMargin}; /* Inside Gutter margin */
      margin-right: 0.625in;        /* Outside margin */
      @bottom-center {
        content: counter(page);
        font-family: "${style.bodyFont}", serif;
        font-size: 9pt;
      }
    }
    @page :left {
      margin-left: 0.625in;        /* Outside margin for verso */
      margin-right: ${gutterMargin}; /* Inside gutter margin for verso */
    }
    body {
      font-family: "${style.bodyFont}", Georgia, serif;
      font-size: ${style.fontSizePt}pt;
      line-height: ${style.lineSpacing};
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      direction: ${isRtl ? 'rtl' : 'ltr'};
      text-align: ${isRtl ? 'right' : 'justify'};
      text-rendering: optimizeLegibility;
    }
    .print-chapter {
      page-break-before: always;
      break-before: page;
    }
    .break-right {
      page-break-before: right !important;
      break-before: right !important;
    }
    .print-part-page {
      page-break-before: always;
      break-before: page;
      text-align: center;
      padding-top: 2.5in;
      min-height: 70vh;
    }
    .part-page-title {
      font-family: "${style.headingFont}", Georgia, serif;
      font-size: 2.2em;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 0 0 0.3in 0;
    }
    .part-page-subtitle {
      font-family: "${style.bodyFont}", Georgia, serif;
      font-style: italic;
      font-size: 1.25em;
      color: #444;
      margin: 0;
    }
    .part-page-epigraph {
      margin-top: 0.8in;
      font-style: italic;
      color: #555;
      font-size: 0.95em;
    }
    .chapter-header {
      text-align: center;
      margin-top: 1.5in;
      margin-bottom: 1in;
    }
    .chapter-title {
      font-family: "${style.headingFont}", Georgia, serif;
      font-size: 1.75em;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 0 0 0.25em 0;
    }
    .chapter-subtitle {
      font-family: "${style.bodyFont}", Georgia, serif;
      font-style: italic;
      font-size: 1em;
      color: #444;
      margin: 0;
    }
    p {
      margin-top: 0;
      margin-bottom: ${style.paragraphSpacingPt}pt;
      text-indent: ${style.paragraphIndentEm}em;
      text-align: justify;
      hyphens: auto;
    }
    p:first-of-type, .no-indent {
      text-indent: 0 !important;
    }
    .has-dropcap .drop-cap-letter {
      float: ${isRtl ? 'right' : 'left'};
      font-size: 3.4em;
      line-height: 0.85;
      padding-top: 2px;
      padding-${isRtl ? 'left' : 'right'}: 6px;
      font-family: "${style.headingFont}", serif;
      font-weight: bold;
    }
    .folio-scene-break {
      text-align: center;
      margin: 1.5em 0;
    }
    .folio-page-break {
      page-break-before: always;
      break-before: page;
      visibility: hidden;
      height: 0;
      margin: 0;
      padding: 0;
    }
    .print-footnotes-section {
      margin-top: 0.6in;
      padding-top: 0.25in;
      border-top: 0.5pt solid #888;
      font-size: 8.5pt;
      line-height: 1.35;
      color: #333;
    }
    .print-footnote-row {
      margin-bottom: 5pt;
    }
    .no-print-toolbar {
      position: fixed;
      top: 12px;
      right: 12px;
      background: #18181b;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 99999;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .no-print-toolbar button {
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 6px 14px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
    }
    @media print {
      .no-print-toolbar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <span>Print or Save to PDF (Trim: ${style.trimSize})</span>
    <button onclick="window.print()">Print Document</button>
  </div>
  ${formattedChaptersHtml}
</body>
</html>`;
}

export function openPrintDialog(book: Book, chapters: Chapter[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print preview.');
    return;
  }

  const html = compilePrintReadyHtml(book, chapters);
  printWindow.document.write(html);
  printWindow.document.close();
}
