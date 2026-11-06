import JSZip from 'jszip';
import { Book, Chapter } from '../types/book';

// Helper to escape XML special characters
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strip HTML tags for clean text extraction, maintaining basic paragraphs
function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  // Replace <p>, <br>, <div> with standard separators
  const cleaned = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return cleaned
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function generateDocxBlob(book: Book, chapters: Chapter[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.file('_rels/.rels', rootRelsXml);

  // 3. word/_rels/document.xml.rels
  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>
</Relationships>`;
  zip.file('word/_rels/document.xml.rels', docRelsXml);

  // 4. word/styles.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>
        <w:sz w:val="24"/>
        <w:color w:val="222222"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto" w:after="160"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="960" w:after="480"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="56"/>
      <w:color w:val="1a1a1a"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:after="720"/>
    </w:pPr>
    <w:rPr>
      <w:i/>
      <w:sz w:val="32"/>
      <w:color w:val="555555"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="PartDivider">
    <w:name w:val="Part Divider"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="2400" w:after="1200"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:smallCaps/>
      <w:sz w:val="44"/>
      <w:color w:val="8b5cf6"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="720" w:after="360"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="40"/>
      <w:color w:val="1a1a1a"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="FootnoteText">
    <w:name w:val="Footnote Text"/>
    <w:rPr>
      <w:sz w:val="20"/>
    </w:rPr>
  </w:style>

  <w:style w:type="character" w:styleId="FootnoteReference">
    <w:name w:val="Footnote Reference"/>
    <w:rPr>
      <w:vertAlign w:val="superscript"/>
    </w:rPr>
  </w:style>
</w:styles>`;
  zip.file('word/styles.xml', stylesXml);

  // Collect all footnotes across chapters
  const allFootnotes: { id: number; text: string }[] = [];
  let footnoteSeq = 1;
  const chapterFootnoteMapping = new Map<string, number[]>();

  chapters.forEach((ch) => {
    const list: number[] = [];
    if (ch.footnotes && ch.footnotes.length > 0) {
      ch.footnotes.forEach((fn) => {
        const id = footnoteSeq++;
        allFootnotes.push({ id, text: fn.text || '' });
        list.push(id);
      });
    }
    chapterFootnoteMapping.set(ch.id, list);
  });

  // 5. word/footnotes.xml
  let footnotesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:footnote w:type="separator" w:id="-1">
    <w:p><w:r><w:separator/></w:r></w:p>
  </w:footnote>
  <w:footnote w:type="continuationSeparator" w:id="0">
    <w:p><w:r><w:continuationSeparator/></w:r></w:p>
  </w:footnote>`;

  allFootnotes.forEach((fn) => {
    footnotesXml += `
  <w:footnote w:id="${fn.id}">
    <w:p>
      <w:pPr>
        <w:pStyle w:val="FootnoteText"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr>
        <w:footnoteRef/>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> ${escapeXml(fn.text)}</w:t>
      </w:r>
    </w:p>
  </w:footnote>`;
  });

  footnotesXml += `\n</w:footnotes>`;
  zip.file('word/footnotes.xml', footnotesXml);

  // 6. word/document.xml
  let bodyXml = '';

  // Title Page
  bodyXml += `
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>${escapeXml(book.title)}</w:t></w:r>
    </w:p>`;

  if (book.subtitle) {
    bodyXml += `
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r><w:t>${escapeXml(book.subtitle)}</w:t></w:r>
    </w:p>`;
  }

  bodyXml += `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="1600"/></w:pPr>
      <w:r><w:t>By ${escapeXml(book.author || 'Anonymous')}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>`;

  // Chapters & Part dividers
  chapters.forEach((ch, idx) => {
    // Page break before chapter (except maybe first)
    if (idx > 0 || ch.pageBreakBefore) {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }

    if (ch.type === 'part') {
      // Full-page Part divider in docx
      bodyXml += `
      <w:p>
        <w:pPr><w:pStyle w:val="PartDivider"/></w:pPr>
        <w:r>
          <w:t>PART ${ch.partNumber ? toRoman(ch.partNumber) : ''}</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:after="1400"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="48"/></w:rPr>
          <w:t>${escapeXml(ch.title)}</w:t>
        </w:r>
      </w:p>`;

      if (ch.subtitle) {
        bodyXml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="800"/></w:pPr>
          <w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="666666"/></w:rPr><w:t>${escapeXml(ch.subtitle)}</w:t></w:r>
        </w:p>`;
      }

      const partParas = htmlToParagraphs(ch.content);
      partParas.forEach((para) => {
        bodyXml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="300"/></w:pPr>
          <w:r><w:rPr><w:i/><w:color w:val="444444"/></w:rPr><w:t>${escapeXml(para)}</w:t></w:r>
        </w:p>`;
      });

      // Page break after part divider
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
      return;
    }

    // Standard Chapter / Front / Back Matter Heading
    bodyXml += `
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:t>${escapeXml(ch.title)}</w:t></w:r>
      </w:p>`;

    if (ch.subtitle) {
      bodyXml += `
      <w:p>
        <w:pPr><w:jc w:val="center"/><w:spacing w:after="400"/></w:pPr>
        <w:r><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="666666"/></w:rPr><w:t>${escapeXml(ch.subtitle)}</w:t></w:r>
      </w:p>`;
    }

    const paras = htmlToParagraphs(ch.content);
    const fnIds = chapterFootnoteMapping.get(ch.id) || [];
    let fnPointer = 0;

    paras.forEach((para, pIdx) => {
      // Check if scene break
      if (para === '***' || para === '* * *' || para === '---' || para === '❦') {
        bodyXml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="360" w:after="360"/></w:pPr>
          <w:r><w:rPr><w:sz w:val="28"/><w:color w:val="888888"/></w:rPr><w:t>❦  •  ❦</w:t></w:r>
        </w:p>`;
        return;
      }

      bodyXml += `<w:p>`;

      // If first paragraph and fiction indentation style, no first-line indent, else indent
      bodyXml += `<w:pPr><w:spacing w:line="360" w:lineRule="auto"/><w:ind w:firstLine="360"/></w:pPr>`;

      // Paragraph run
      bodyXml += `<w:r><w:t xml:space="preserve">${escapeXml(para)}</w:t></w:r>`;

      // Attach any chapter footnotes sequentially to paragraphs
      if (fnPointer < fnIds.length && (pIdx === paras.length - 1 || (pIdx + 1) % 2 === 0)) {
        const targetFnId = fnIds[fnPointer++];
        bodyXml += `
        <w:r>
          <w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr>
          <w:footnoteReference w:id="${targetFnId}"/>
        </w:r>`;
      }

      bodyXml += `</w:p>`;
    });
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/> <!-- Standard US Letter 8.5 x 11 in dxa -->
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
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
