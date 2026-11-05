import JSZip from 'jszip';
import { BookProject, BookSection } from '../types/book';
import { getThemeById } from './themes';
import { getOrnamentSvg } from './ornaments';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanHtmlToXhtml(html: string): string {
  let cleaned = html
    // Self-close void elements
    .replace(/<hr([^>]*)>/gi, '<hr$1/>')
    .replace(/<br([^>]*)>/gi, '<br$1/>')
    .replace(/<img([^>]*)(?<!\/)>/gi, '<img$1/>')
    // Remove unsupported attributes
    .replace(/contenteditable="[^"]*"/gi, '')
    .replace(/spellcheck="[^"]*"/gi, '');

  return cleaned;
}

export async function generateEpub(book: BookProject, sections: BookSection[]): Promise<Blob> {
  const zip = new JSZip();
  const theme = getThemeById(book.themeId);
  const bookUuid = `urn:uuid:${book.id}-${book.createdAt}`;
  const modifiedDate = new Date(book.updatedAt || Date.now()).toISOString().split('.')[0] + 'Z';

  // 1. mimetype (MUST be uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/styles.css
  const stylesCss = `/* FolioCraft Generated EPUB Stylesheet */
body {
  font-family: serif;
  margin: 5%;
  line-height: ${book.lineSpacing};
  font-size: 1em;
  text-align: justify;
}

h1, h2, h3, h4 {
  font-family: sans-serif;
  text-align: ${theme.headerAlignment};
  font-weight: normal;
  margin-top: 2em;
  margin-bottom: 0.5em;
  text-transform: ${theme.chapterTitleTransform};
}

h1.chapter-title {
  font-size: 1.8em;
  letter-spacing: 0.05em;
}

p.chapter-subtitle {
  text-align: ${theme.headerAlignment};
  font-style: italic;
  margin-bottom: 2em;
  opacity: 0.8;
}

p.chapter-epigraph {
  text-align: center;
  font-style: italic;
  font-size: 0.9em;
  margin: 1.5em 15% 2.5em 15%;
}

p {
  margin: 0;
  text-indent: 1.5em;
}

p.first-p, p.no-indent {
  text-indent: 0;
}

/* Drop Caps */
.drop-cap:first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.8;
  padding-right: 0.15em;
  padding-top: 0.05em;
  font-weight: bold;
}

.folio-scene-break {
  text-align: center;
  margin: 2em 0;
}

.folio-scene-break svg {
  display: inline-block;
  max-width: 100px;
  height: auto;
}

blockquote {
  margin: 1.5em 10%;
  font-style: italic;
}
`;
  zip.file('OEBPS/styles.css', stylesCss);

  // 4. Chapter XHTML files
  const manifestItems: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="styles" href="styles.css" media-type="text/css"/>`,
  ];
  const spineItems: string[] = [];
  const ncxNavPoints: string[] = [];
  const tocNavList: string[] = [];

  let playOrder = 1;

  sections.forEach((section, index) => {
    const fileId = `sec_${index + 1}`;
    const fileName = `section_${index + 1}.xhtml`;

    manifestItems.push(`<item id="${fileId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${fileId}"/>`);

    if (section.includeInToc) {
      ncxNavPoints.push(`
    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${escapeXml(section.title)}</text></navLabel>
      <content src="${fileName}"/>
    </navPoint>`);
      tocNavList.push(`<li><a href="${fileName}">${escapeXml(section.title)}</a></li>`);
      playOrder++;
    }

    const dropCapClass = section.dropCap ? 'drop-cap first-p' : 'first-p';
    let formattedContent = cleanHtmlToXhtml(section.content);

    // Apply drop cap class to first paragraph if enabled
    if (section.dropCap) {
      formattedContent = formattedContent.replace(/<p>/i, `<p class="${dropCapClass}">`);
    }

    const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language || 'en'}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(section.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body epub:type="${section.type === 'front' ? 'frontmatter' : section.type === 'back' ? 'backmatter' : 'bodymatter'}">
  <section class="section-container">
    ${section.subtype !== 'title-page' ? `<h1 class="chapter-title">${escapeXml(section.title)}</h1>` : ''}
    ${section.subtitle ? `<p class="chapter-subtitle">${escapeXml(section.subtitle)}</p>` : ''}
    ${section.epigraph ? `<p class="chapter-epigraph">${escapeXml(section.epigraph)}</p>` : ''}
    <div class="chapter-body">
      ${formattedContent}
    </div>
  </section>
</body>
</html>`;

    zip.file(`OEBPS/${fileName}`, chapterHtml);
  });

  // 5. OEBPS/nav.xhtml (EPUB 3 Nav Document)
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language || 'en'}">
<head>
  <meta charset="utf-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${tocNavList.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 6. OEBPS/toc.ncx (EPUB 2 / Legacy E-Readers Fallback)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookUuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(book.title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(book.author)}</text>
  </docAuthor>
  <navMap>
    ${ncxNavPoints.join('')}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 7. OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookUuid}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    ${book.subtitle ? `<dc:description>${escapeXml(book.subtitle)}</dc:description>` : ''}
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>${book.language || 'en'}</dc:language>
    ${book.publisher ? `<dc:publisher>${escapeXml(book.publisher)}</dc:publisher>` : ''}
    ${book.rightsStatement ? `<dc:rights>${escapeXml(book.rightsStatement)}</dc:rights>` : ''}
    <meta property="dcterms:modified">${modifiedDate}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
