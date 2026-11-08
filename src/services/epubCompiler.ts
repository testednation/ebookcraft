import JSZip from 'jszip';
import { Book, Chapter } from '../types/book';
import { getOrnamentSvg } from './ornaments';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRoman(num: number): string {
  const lookup: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || `${num}`;
}

export async function generateEpubBlob(book: Book, chapters: Chapter[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST be stored uncompressed, first file in ZIP)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  const isRtl = book.direction === 'rtl' || book.styleConfig?.direction === 'rtl';

  // 3. OEBPS/styles.css
  const styles = `
@charset "utf-8";
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.05em;
  line-height: 1.6;
  margin: 5%;
  direction: ${isRtl ? 'rtl' : 'ltr'};
  text-align: ${isRtl ? 'right' : 'justify'};
  color: #1a1a1a;
}

h1, h2, h3, .title {
  text-align: center;
  font-weight: normal;
}

h1 {
  font-size: 2em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}

.subtitle {
  text-align: center;
  font-style: italic;
  font-size: 1.1em;
  color: #666;
  margin-bottom: 2em;
}

p {
  margin-top: 0;
  margin-bottom: 0;
  text-indent: 1.5em;
}

p.first, .no-indent {
  text-indent: 0;
}

.drop-cap {
  float: ${isRtl ? 'right' : 'left'};
  font-size: 3.4em;
  line-height: 0.85;
  margin-top: 0.1em;
  margin-${isRtl ? 'left' : 'right'}: 0.12em;
  font-family: serif;
}

.small-caps {
  font-variant: small-caps;
  letter-spacing: 0.08em;
}

.scene-break {
  text-align: center;
  margin: 1.8em 0;
  text-indent: 0;
}

.scene-break svg {
  display: inline-block;
  width: 32px;
  height: 18px;
  fill: #78716c;
}

/* Full-page Part Divider */
.part-page {
  page-break-before: always;
  page-break-after: always;
  text-align: center;
  padding-top: 35vh;
}

.part-label {
  font-size: 0.9em;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #78716c;
  margin-bottom: 0.8em;
}

.part-title {
  font-size: 2.2em;
  font-weight: normal;
  letter-spacing: 0.08em;
  margin-bottom: 1.2em;
}

.part-ornament {
  margin: 1.5em auto;
}

/* Footnotes EPUB 3 popup reader */
.footnote-ref {
  vertical-align: super;
  font-size: 0.75em;
  line-height: 0;
  text-decoration: none;
  font-weight: bold;
  padding: 0 0.2em;
}

aside[epub\\:type~="footnote"] {
  font-size: 0.88em;
  line-height: 1.4;
  margin-top: 2em;
  padding-top: 1em;
  border-top: 1px solid #e5e5e5;
  text-indent: 0;
}

.footnotes-section {
  margin-top: 3em;
  padding-top: 1.5em;
  border-top: 1px solid #ddd;
}
`;
  zip.file('OEBPS/styles.css', styles);

  // 4. Chapter files
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navItems: string[] = [];

  manifestItems.push(`<item id="css" href="styles.css" media-type="text/css"/>`);
  manifestItems.push(`<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);

  chapters.forEach((ch, idx) => {
    const fileId = `chapter_${idx + 1}`;
    const fileName = `${fileId}.xhtml`;

    manifestItems.push(`<item id="${fileId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${fileId}"/>`);

    if (ch.includeInToc) {
      navItems.push(`<li><a href="${fileName}">${escapeXml(ch.title)}</a></li>`);
    }

    let chapterBody = '';

    if (ch.type === 'part') {
      // Dedicated Full-Page Part Divider
      chapterBody = `
      <section epub:type="part" class="part-page">
        <div class="part-label">PART ${ch.partNumber ? toRoman(ch.partNumber) : ''}</div>
        <h1 class="part-title">${escapeXml(ch.title)}</h1>
        <div class="part-ornament">❦</div>
        ${ch.subtitle ? `<p class="subtitle">${escapeXml(ch.subtitle)}</p>` : ''}
        ${ch.content || ''}
      </section>`;
    } else {
      // Standard chapter or matter
      chapterBody = `
      <section epub:type="${ch.type === 'prologue' ? 'prologue' : ch.type === 'epilogue' ? 'epilogue' : 'chapter'}">
        <h1 class="chapter-title">${escapeXml(ch.title)}</h1>
        ${ch.subtitle ? `<p class="subtitle">${escapeXml(ch.subtitle)}</p>` : ''}
        <div class="chapter-content">
          ${ch.content || '<p></p>'}
        </div>`;

      // Append footnotes if present
      if (ch.footnotes && ch.footnotes.length > 0) {
        chapterBody += `<section class="footnotes-section" epub:type="footnotes">`;
        ch.footnotes.forEach((fn) => {
          chapterBody += `
            <aside epub:type="footnote" id="fn_${fn.id}">
              <p><sup>${fn.number}</sup> ${escapeXml(fn.text)}</p>
            </aside>`;
        });
        chapterBody += `</section>`;
      }

      chapterBody += `</section>`;
    }

    const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(book.language || 'en')}" lang="${escapeXml(book.language || 'en')}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <title>${escapeXml(ch.title)} - ${escapeXml(book.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  ${chapterBody}
</body>
</html>`;

    zip.file(`OEBPS/${fileName}`, xhtml);
  });

  // 5. OEBPS/toc.xhtml (EPUB 3 Nav)
  const tocXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navItems.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/toc.xhtml', tocXhtml);

  // 6. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author || 'Anonymous')}</dc:creator>
    <dc:language>${book.language || 'en'}</dc:language>
    <dc:identifier id="BookId">urn:uuid:${book.id}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
    ${book.description ? `<dc:description>${escapeXml(book.description)}</dc:description>` : ''}
    ${book.publisher ? `<dc:publisher>${escapeXml(book.publisher)}</dc:publisher>` : ''}
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine page-progression-direction="${isRtl ? 'rtl' : 'default'}">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
  });
}
