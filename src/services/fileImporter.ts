import { BookSection } from '../types/book';
import { countWords } from './storage';

export async function parseTextOrMarkdownFile(file: File, bookId: string, startOrder: number): Promise<BookSection> {
  const text = await file.text();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  let title = baseName;
  let rawContent = text;

  // Check if first line is a markdown heading
  const lines = text.split('\n');
  if (lines.length > 0 && lines[0].startsWith('# ')) {
    title = lines[0].replace(/^#\s+/, '').trim();
    rawContent = lines.slice(1).join('\n').trim();
  }

  // Convert double linebreaks to HTML paragraphs
  const paragraphs = rawContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  return {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookId,
    type: 'body',
    subtype: 'chapter',
    title,
    content: paragraphs || '<p></p>',
    order: startOrder,
    includeInToc: true,
    dropCap: true,
    wordCount: countWords(paragraphs),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
