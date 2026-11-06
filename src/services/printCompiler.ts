import { Book, Chapter } from '../types/book';
import { formatChapterHtml } from './formattingEngine';
import { getDefaultStyleConfig } from './themes';

export function openPrintDialog(book: Book, chapters: Chapter[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print preview.');
    return;
  }

  const style = {
    ...getDefaultStyleConfig('literary'),
    ...(book.styleConfig || {}),
  };
  const trimDimensions = {
    '5x8': '5in 8in',
    '5.5x8.5': '5.5in 8.5in',
    '6x9': '6in 9in',
  }[style.trimSize || '5.5x8.5'];

  const formattedChaptersHtml = chapters
    .map((ch, idx) => {
      const formattedContent = formatChapterHtml(ch.content, style, ch.customOrnamentId);
      return `
        <article class="print-chapter ${ch.pageBreakBefore ? 'break-before' : ''}" id="chapter-${idx}">
          <header class="chapter-header">
            <h1 class="chapter-title">${ch.title}</h1>
            ${ch.subtitle ? `<h2 class="chapter-subtitle">${ch.subtitle}</h2>` : ''}
          </header>
          <div class="chapter-body">
            ${formattedContent}
          </div>
        </article>
      `;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${book.title} — Print Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;600&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${trimDimensions};
      margin-top: 0.75in;
      margin-bottom: 0.75in;
      margin-left: 0.75in;
      margin-right: 0.625in;
      @bottom-center {
        content: counter(page);
        font-family: "${style.bodyFont}", serif;
        font-size: 9pt;
      }
    }
    @page :left {
      margin-left: 0.625in;
      margin-right: 0.75in;
    }
    body {
      font-family: "${style.bodyFont}", Georgia, serif;
      font-size: ${style.fontSizePt}pt;
      line-height: ${style.lineSpacing};
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      text-rendering: optimizeLegibility;
    }
    .print-chapter {
      page-break-before: always;
      break-before: page;
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
      float: left;
      font-size: 3.4em;
      line-height: 0.85;
      padding-top: 2px;
      padding-right: 6px;
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

  printWindow.document.write(html);
  printWindow.document.close();
}
