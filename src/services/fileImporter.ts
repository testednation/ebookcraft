import { Chapter } from '../types/book';

export async function importTextOrMarkdownFile(
  file: File,
  bookId: string,
  startOrder: number
): Promise<Chapter[]> {
  const text = await file.text();
  const filename = file.name.replace(/\.[^/.]+$/, '');

  // Detect if Markdown has multiple chapters separated by # or ---
  const chapterSplits = text.split(/\n(?=#\s+|\bChapter\s+\d+)/i);

  if (chapterSplits.length > 1) {
    return chapterSplits
      .map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // Try extracting heading
        const lines = trimmed.split('\n');
        let title = lines[0].replace(/^#+\s*/, '').trim() || `Chapter ${idx + 1}`;
        const bodyLines = lines.slice(1).join('\n').trim();

        const formattedHtml = markdownToHtml(bodyLines || trimmed);

        const ch: Chapter = {
          id: `ch-import-${Date.now()}-${idx}`,
          bookId,
          title,
          type: 'chapter',
          group: 'body',
          order: startOrder + idx,
          wordCount: countWords(bodyLines || trimmed),
          includeInToc: true,
          pageBreakBefore: true,
          content: formattedHtml,
        };
        return ch;
      })
      .filter((c): c is Chapter => c !== null);
  }

  // Single file chapter
  const content = markdownToHtml(text);
  const singleChapter: Chapter = {
    id: `ch-import-${Date.now()}`,
    bookId,
    title: filename,
    type: 'chapter',
    group: 'body',
    order: startOrder,
    wordCount: countWords(text),
    includeInToc: true,
    pageBreakBefore: true,
    content,
  };

  return [singleChapter];
}

function markdownToHtml(markdown: string): string {
  // Simple clean converter
  const paragraphs = markdown.split(/\n\s*\n/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed === '***' || trimmed === '---' || trimmed === '* * *') {
        return '<hr />';
      }
      if (trimmed.startsWith('# ')) {
        return `<h1 class="text-2xl font-serif font-bold text-center my-4">${trimmed.substring(2)}</h1>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="text-xl font-serif font-semibold text-center my-3">${trimmed.substring(3)}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3 class="text-lg font-serif font-medium text-center my-2">${trimmed.substring(4)}</h3>`;
      }
      // Basic bold and italics
      let html = trimmed
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>');
      return `<p>${html}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}
