import { BookProject, BookSection, TRIM_SIZES } from '../types/book';
import { getThemeById } from './themes';
import { getOrnamentSvg } from './ornaments';
import { downloadBlob } from './epubCompiler';

export function generatePrintHtml(book: BookProject, sections: BookSection[]): string {
  const trim = TRIM_SIZES.find((t) => t.id === book.trimSize) || TRIM_SIZES[2];
  const theme = getThemeById(book.themeId);
  const ornamentSvg = getOrnamentSvg(book.ornamentKey || theme.ornamentKey);

  const sectionsHtml = sections
    .map((section, idx) => {
      const dropCapClass = section.dropCap ? 'print-drop-cap' : '';
      return `
      <section class="book-page ${section.type === 'body' ? 'chapter-recto-start' : 'matter-page'}">
        ${
          section.subtype !== 'title-page'
            ? `
          <header class="chapter-header">
            <h1 class="chapter-title">${section.title}</h1>
            ${section.subtitle ? `<h2 class="chapter-subtitle">${section.subtitle}</h2>` : ''}
            ${section.epigraph ? `<blockquote class="chapter-epigraph">${section.epigraph}</blockquote>` : ''}
            <div class="header-divider">${ornamentSvg}</div>
          </header>
        `
            : ''
        }
        <div class="chapter-content ${dropCapClass}">
          ${section.content}
        </div>
      </section>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${book.language || 'en'}">
<head>
  <meta charset="utf-8"/>
  <title>${book.title} — Print Edition</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;600&display=swap');

    @page {
      size: ${trim.widthInches}in ${trim.heightInches}in;
      margin: 0.75in 0.6in 0.75in 0.85in; /* Gutter margin for binding */
      @bottom-center {
        content: counter(page);
        font-family: ${book.bodyFont};
        font-size: 9pt;
      }
    }

    @page :left {
      margin-left: 0.6in;
      margin-right: 0.85in;
      @top-center {
        content: "${book.title}";
        font-family: ${book.headingFont};
        font-size: 8.5pt;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
    }

    @page :right {
      margin-left: 0.85in;
      margin-right: 0.6in;
      @top-center {
        content: "${book.author}";
        font-family: ${book.headingFont};
        font-size: 8.5pt;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: ${book.bodyFont};
      font-size: ${book.baseFontSize}px;
      line-height: ${book.lineSpacing};
      color: #111;
      background: #fff;
      margin: 0;
      padding: 0;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern" 1, "liga" 1;
    }

    .book-page {
      page-break-before: always;
      break-before: page;
    }

    .chapter-recto-start {
      page-break-before: right;
      break-before: right;
    }

    .chapter-header {
      text-align: ${theme.headerAlignment};
      margin-top: 1in;
      margin-bottom: 2rem;
    }

    .chapter-title {
      font-family: ${book.headingFont};
      font-size: 1.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin: 0 0 0.5rem 0;
      text-transform: ${theme.chapterTitleTransform};
    }

    .chapter-subtitle {
      font-family: ${book.bodyFont};
      font-size: 1.1rem;
      font-weight: normal;
      font-style: italic;
      color: #444;
      margin: 0 0 1rem 0;
    }

    .chapter-epigraph {
      font-style: italic;
      font-size: 0.95rem;
      margin: 1.5rem 10% 2rem 10%;
      text-align: center;
      color: #555;
    }

    .header-divider {
      margin: 1.5rem 0;
      opacity: 0.8;
      text-align: ${theme.headerAlignment};
    }

    .header-divider svg {
      display: inline-block;
      max-width: 90px;
      height: auto;
    }

    .chapter-content p {
      margin: 0;
      text-indent: 1.4em;
      text-align: justify;
      hyphens: auto;
    }

    .chapter-content p:first-of-type,
    .chapter-content div + p {
      text-indent: 0;
    }

    .print-drop-cap p:first-of-type::first-letter {
      float: left;
      font-family: ${book.headingFont};
      font-size: 3.4em;
      line-height: 0.8;
      padding-top: 4px;
      padding-right: 8px;
      font-weight: 600;
      color: #111;
    }

    .folio-scene-break {
      text-align: center;
      margin: 1.8rem 0;
    }

    .folio-scene-break svg {
      display: inline-block;
      max-width: 80px;
      height: auto;
    }

    /* Screen preview framing */
    @media screen {
      body {
        background: #27272a;
        padding: 2rem;
      }
      .book-page {
        width: ${trim.widthInches}in;
        min-height: ${trim.heightInches}in;
        background: white;
        margin: 0 auto 2rem auto;
        padding: 0.85in 0.75in;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      }
    }
  </style>
</head>
<body>
  ${sectionsHtml}
  <script>
    window.onload = function() {
      // Auto trigger print if parameter ?print=true
      if (window.location.search.indexOf('print=true') !== -1) {
        setTimeout(function() { window.print(); }, 400);
      }
    };
  </script>
</body>
</html>`;
}

export function openPrintDialog(book: BookProject, sections: BookSection[]): void {
  const html = generatePrintHtml(book, sections);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print dialog.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 600);
}

export function exportHtmlFile(book: BookProject, sections: BookSection[]): void {
  const html = generatePrintHtml(book, sections);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Formatted_Print.html`;
  downloadBlob(blob, filename);
}

export function exportMarkdownFile(book: BookProject, sections: BookSection[]): void {
  let md = `---
title: "${book.title}"
${book.subtitle ? `subtitle: "${book.subtitle}"\n` : ''}author: "${book.author}"
publisher: "${book.publisher || ''}"
isbn: "${book.isbnPrint || book.isbnEpub || ''}"
language: "${book.language}"
date: "${new Date().toISOString().split('T')[0]}"
---

# ${book.title}
${book.subtitle ? `*${book.subtitle}*\n` : ''}
By ${book.author}

---

`;

  for (const sec of sections) {
    md += `## ${sec.title}\n`;
    if (sec.subtitle) md += `*${sec.subtitle}*\n\n`;
    if (sec.epigraph) md += `> ${sec.epigraph}\n\n`;

    // Convert basic HTML to markdown
    const textContent = sec.content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n### $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n#### $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n##### $1\n\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<div class="folio-scene-break"[^>]*>.*?<\/div>/gi, '\n* * *\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    md += `${textContent}\n\n---\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const filename = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Manuscript.md`;
  downloadBlob(blob, filename);
}
