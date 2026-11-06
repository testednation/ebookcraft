import JSZip from 'jszip';
import { Book, Chapter } from '../types/book';
import { formatChapterHtml } from './formattingEngine';
import { getDefaultStyleConfig } from './themes';

export async function generateEpubBlob(book: Book, chapters: Chapter[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Failed to create OEBPS folder in EPUB');

  // Stylesheet
  const style = {
    ...getDefaultStyleConfig('literary'),
    ...(book.styleConfig || {}),
  };
  const css = `
@charset "utf-8";
body {
  font-family: "${style.bodyFont}", Georgia, serif;
  font-size: ${style.fontSizePt}pt;
  line-height: ${style.lineSpacing};
  color: #1a1a1a;
  background-color: #ffffff;
  margin: 5%;
  text-align: justify;
}
h1, h2, h3 {
  font-family: "${style.headingFont}", Georgia, serif;
  text-align: center;
  font-weight: normal;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}
h1 {
  font-size: 2em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.subtitle {
  text-align: center;
  font-style: italic;
  font-size: 1.1em;
  color: #555;
  margin-top: -0.5em;
  margin-bottom: 1.5em;
}
p {
  margin-top: 0;
  margin-bottom: ${style.paragraphSpacingPt}pt;
  text-indent: ${style.paragraphIndentEm}em;
}
p:first-of-type, .no-indent {
  text-indent: 0 !important;
}
.has-dropcap .drop-cap-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding-top: 4px;
  padding-right: 8px;
  font-family: "${style.headingFont}", serif;
  font-weight: bold;
}
.folio-scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.2em;
  letter-spacing: 0.3em;
  color: #666;
}
.folio-page-break {
  page-break-before: always;
  break-before: page;
}
.text-center { text-align: center; }
.italic { font-style: italic; }
.uppercase { text-transform: uppercase; }
  `;
  oebps.file('styles.css', css);

  // Generate Chapter XHTML files
  const manifestItems: string[] = [
    `<item id="css" href="styles.css" media-type="text/css"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
  ];
  const spineItems: string[] = [];
  const tocNavList: string[] = [];
  const ncxNavPoints: string[] = [];

  chapters.forEach((ch, index) => {
    const filename = `chapter_${index + 1}.xhtml`;
    const formattedBody = formatChapterHtml(ch.content, style, ch.customOrnamentId);

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${book.language || 'en'}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body epub:type="${ch.type}">
  <header>
    <h1>${escapeXml(ch.title)}</h1>
    ${ch.subtitle ? `<p class="subtitle">${escapeXml(ch.subtitle)}</p>` : ''}
  </header>
  <div class="chapter-content">
    ${formattedBody}
  </div>
</body>
</html>`;

    oebps.file(filename, xhtml);

    const itemId = `ch_${index + 1}`;
    manifestItems.push(`<item id="${itemId}" href="${filename}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${itemId}"/>`);

    if (ch.includeInToc) {
      tocNavList.push(`<li><a href="${filename}">${escapeXml(ch.title)}</a></li>`);
      ncxNavPoints.push(`
        <navPoint id="np_${index + 1}" playOrder="${index + 1}">
          <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
          <content src="${filename}"/>
        </navPoint>
      `);
    }
  });

  // nav.xhtml (EPUB 3 Navigation)
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
  oebps.file('nav.xhtml', navXhtml);

  // toc.ncx (EPUB 2 fallback for older ereaders)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${book.isbn || book.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(book.title)}</text></docTitle>
  <docAuthor><text>${escapeXml(book.author)}</text></docAuthor>
  <navMap>
    ${ncxNavPoints.join('\n')}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${book.isbn || book.id}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    ${book.subtitle ? `<dc:description>${escapeXml(book.subtitle)}</dc:description>` : ''}
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>${book.language || 'en'}</dc:language>
    <dc:publisher>${escapeXml(book.publisher || 'FolioCraft')}</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
