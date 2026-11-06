import { StyleConfig } from '../types/book';
import { getOrnamentById } from './ornaments';

/**
 * Transforms raw HTML into beautifully styled chapter output according to the StyleConfig
 */
export function formatChapterHtml(
  rawHtml: string,
  style: StyleConfig,
  customOrnament?: string
): string {
  if (!rawHtml || !rawHtml.trim()) {
    return '<p class="empty-chapter text-neutral-400 italic">No content yet. Start writing in the editor...</p>';
  }

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const container = doc.body.firstElementChild as HTMLElement;

  if (!container) return rawHtml;

  // Replace <hr> or scene break placeholder with chosen ornament SVG
  const ornamentId = customOrnament || style.sceneBreakOrnamentId || 'fleuron';
  const ornamentDef = getOrnamentById(ornamentId);
  const ornamentHtml = ornamentDef && ornamentDef.svg
    ? `<div class="folio-scene-break py-6 text-center select-none" data-ornament="${ornamentId}">${ornamentDef.svg}</div>`
    : `<div class="folio-scene-break py-6 text-center select-none font-serif tracking-widest text-neutral-400">❖ &nbsp; ❖ &nbsp; ❖</div>`;

  // Find all <hr> tags or divs marked as scene break
  const hrs = container.querySelectorAll('hr, .folio-scene-break');
  hrs.forEach((hr) => {
    const replacement = doc.createElement('div');
    replacement.innerHTML = ornamentHtml;
    hr.replaceWith(replacement.firstElementChild || hr);
  });

  // Handle page break markers
  const pageBreaks = container.querySelectorAll('.folio-page-break');
  pageBreaks.forEach((pb) => {
    pb.setAttribute('class', 'folio-page-break my-6 py-2 border-t-2 border-dashed border-amber-500/40 text-center text-[10px] uppercase tracking-wider text-amber-500/70 select-none print:break-before-page');
  });

  // Handle first paragraph styling (Drop Cap / Small Caps)
  const paragraphs = Array.from(container.querySelectorAll('p')).filter((p) => {
    const text = p.textContent?.trim() || '';
    return text.length > 0 && !p.classList.contains('folio-page-break');
  });

  if (paragraphs.length > 0) {
    const firstP = paragraphs[0];

    // Remove old drop cap wrappers if re-formatting
    const oldDropCap = firstP.querySelector('.drop-cap-letter');
    if (oldDropCap && oldDropCap.textContent) {
      // already processed, skip reprocessing to avoid double wrapping
    } else if (style.firstParagraphDropCap && style.dropCap !== 'none') {
      const text = firstP.innerHTML.trim();
      // Match first letter (skipping leading tags or quotes)
      const match = text.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9])(.*)$/s);
      if (match) {
        const [, prefix, letter, rest] = match;
        let dropCapClass = 'drop-cap-letter font-serif font-bold float-left mr-2 leading-none';
        
        if (style.dropCap === 'illuminated') {
          dropCapClass += ' text-amber-700 dark:text-amber-300 text-5xl pt-1 px-1 border border-amber-600/30 bg-amber-500/10 rounded';
        } else if (style.dropCap === 'raised') {
          dropCapClass += ' text-4xl text-neutral-900 dark:text-neutral-100 align-top';
        } else {
          // simple 3-line drop cap
          dropCapClass += ' text-5xl text-neutral-900 dark:text-neutral-100';
        }

        let formattedRest = rest;
        // Optionally apply small-caps to first 3-5 words
        if (style.firstParagraphSmallCaps) {
          const words = rest.split(/\s+/);
          const smallCapWords = words.slice(0, 4).join(' ');
          const remainingWords = words.slice(4).join(' ');
          formattedRest = ` <span class="uppercase tracking-wider text-[0.88em] font-semibold">${smallCapWords}</span> ${remainingWords}`;
        }

        firstP.innerHTML = `${prefix}<span class="${dropCapClass}">${letter}</span>${formattedRest}`;
        firstP.classList.add('has-dropcap');
      }
    } else if (style.firstParagraphSmallCaps) {
      const text = firstP.innerHTML.trim();
      const words = text.split(/\s+/);
      const smallCapWords = words.slice(0, 4).join(' ');
      const remainingWords = words.slice(4).join(' ');
      firstP.innerHTML = `<span class="uppercase tracking-wider text-[0.88em] font-semibold">${smallCapWords}</span> ${remainingWords}`;
    }
  }

  return container.innerHTML;
}
