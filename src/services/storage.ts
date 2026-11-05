import { BookProject, BookSection } from '../types/book';
import { createSceneBreakHtml } from './ornaments';

const DB_NAME = 'foliocraft_db';
const DB_VERSION = 1;

interface FolioDB {
  books: BookProject;
  sections: BookSection;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sections')) {
        const sectionStore = db.createObjectStore('sections', { keyPath: 'id' });
        sectionStore.createIndex('bookId', 'bookId', { unique: false });
        sectionStore.createIndex('order', 'order', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export async function getAllBooks(): Promise<BookProject[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getBook(id: string): Promise<BookProject | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: BookProject): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readwrite');
    const store = tx.objectStore('books');
    const req = store.put({ ...book, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'sections'], 'readwrite');
    const bookStore = tx.objectStore('books');
    const sectionStore = tx.objectStore('sections');

    bookStore.delete(id);
    const index = sectionStore.index('bookId');
    const req = index.getAllKeys(id);
    req.onsuccess = () => {
      for (const key of req.result) {
        sectionStore.delete(key);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSections(bookId: string): Promise<BookSection[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sections', 'readonly');
    const store = tx.objectStore('sections');
    const index = store.index('bookId');
    const req = index.getAll(bookId);

    req.onsuccess = () => {
      const sections = (req.result || []) as BookSection[];
      sections.sort((a, b) => a.order - b.order);
      resolve(sections);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSection(section: BookSection): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sections', 'readwrite');
    const store = tx.objectStore('sections');
    const req = store.put({
      ...section,
      wordCount: countWords(section.content),
      updatedAt: Date.now(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveSections(sections: BookSection[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sections', 'readwrite');
    const store = tx.objectStore('sections');
    for (const sec of sections) {
      store.put({
        ...sec,
        wordCount: countWords(sec.content),
        updatedAt: Date.now(),
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSection(sectionId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sections', 'readwrite');
    const store = tx.objectStore('sections');
    const req = store.delete(sectionId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function exportProjectBackup(bookId: string): Promise<string> {
  const book = await getBook(bookId);
  const sections = await getSections(bookId);
  if (!book) throw new Error('Book not found');

  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    book,
    sections,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importProjectBackup(jsonStr: string): Promise<BookProject> {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.book || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid FolioCraft project archive format.');
  }

  const newBookId = `book-${Date.now()}`;
  const importedBook: BookProject = {
    ...parsed.book,
    id: newBookId,
    title: `${parsed.book.title} (Imported)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveBook(importedBook);

  const importedSections: BookSection[] = parsed.sections.map((s: BookSection, idx: number) => ({
    ...s,
    id: `sec-${newBookId}-${idx}`,
    bookId: newBookId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  await saveSections(importedSections);
  return importedBook;
}

export async function seedInitialDemoIfEmpty(): Promise<{ book: BookProject; sections: BookSection[] }> {
  const books = await getAllBooks();
  if (books.length > 0) {
    const firstBook = books[0];
    const sections = await getSections(firstBook.id);
    return { book: firstBook, sections };
  }

  // Create starter masterwork book matching Vellum/Atticus showcase
  const demoBookId = 'book-starter-alchemist';
  const demoBook: BookProject = {
    id: demoBookId,
    title: "The Alchemist's Horizon",
    subtitle: 'A Chronicle of the Clockwork Guild',
    author: 'Victoria Vance',
    publisher: 'Obsidian & Quill Press',
    edition: 'First Edition',
    seriesName: 'The Aetherium Chronicles',
    seriesNumber: 'Book I',
    isbnEpub: '978-1-987654-32-1',
    isbnPrint: '978-1-987654-33-8',
    language: 'en',
    description: 'When the celestial orrery stumbles mid-rotation, a young apprentice in Prague uncovers an ancient parchment that could unravel the geometry of time itself.',
    copyrightYear: '2026',
    rightsStatement: 'All rights reserved. No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form without prior written permission of the publisher.',
    themeId: 'theme-classic-literary',
    trimSize: '6x9',
    headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'EB Garamond', Georgia, serif",
    baseFontSize: 16,
    lineSpacing: 1.6,
    numberFormat: 'Roman',
    dropCapEnabled: true,
    dropCapStyle: 'classic',
    ornamentKey: 'fleuron',
    versoHeader: 'title',
    rectoHeader: 'chapter',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const sceneBreak = createSceneBreakHtml('fleuron');

  const demoSections: BookSection[] = [
    // Front matter
    {
      id: `sec-${demoBookId}-1`,
      bookId: demoBookId,
      type: 'front',
      subtype: 'title-page',
      title: 'Title Page',
      content: `<div style="text-align: center; padding: 3rem 0;">
        <h1 style="font-size: 2.5rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem;">The Alchemist's Horizon</h1>
        <p style="font-style: italic; font-size: 1.15rem; color: #71717a; margin-bottom: 2rem;">A Chronicle of the Clockwork Guild</p>
        <div style="margin: 2rem auto; width: 60px; height: 1px; background: currentColor; opacity: 0.4;"></div>
        <p style="font-size: 1.4rem; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 3rem;">VICTORIA VANCE</p>
        <p style="font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.7;">Obsidian & Quill Press · London & Prague</p>
      </div>`,
      order: 0,
      includeInToc: false,
      dropCap: false,
      wordCount: 38,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-2`,
      bookId: demoBookId,
      type: 'front',
      subtype: 'copyright',
      title: 'Copyright',
      content: `<div style="font-size: 0.85rem; line-height: 1.7; color: #52525b; max-width: 480px; margin: 4rem auto;">
        <p><strong>The Alchemist's Horizon</strong></p>
        <p>Copyright © 2026 by Victoria Vance</p>
        <p style="margin-top: 1rem;">All rights reserved. Under International Copyright Conventions, no part of this book may be reproduced or utilized in any form or by any electronic, mechanical, or other means, now known or hereafter invented, including xerography, photocopying, and recording, or in any information storage and retrieval system, without written permission from the publisher.</p>
        <p style="margin-top: 1rem;">Published by Obsidian & Quill Press<br/>Printed in the United States of America</p>
        <p style="margin-top: 1rem;">eBook ISBN: 978-1-987654-32-1<br/>Print ISBN: 978-1-987654-33-8</p>
      </div>`,
      order: 1,
      includeInToc: false,
      dropCap: false,
      wordCount: 88,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-3`,
      bookId: demoBookId,
      type: 'front',
      subtype: 'dedication',
      title: 'Dedication',
      content: `<div style="text-align: center; margin: 6rem auto; font-style: italic; font-size: 1.15rem; max-width: 400px; line-height: 1.8;">
        For those who look upon forgotten stars<br/>and dare to hear the gears turning beneath.
      </div>`,
      order: 2,
      includeInToc: false,
      dropCap: false,
      wordCount: 17,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-4`,
      bookId: demoBookId,
      type: 'front',
      subtype: 'epigraph',
      title: 'Epigraph',
      content: `<div style="text-align: center; margin: 5rem auto; max-width: 440px; font-style: italic; line-height: 1.8;">
        <p>“Time is not a stream that washes us away;<br/>it is a crucible, and we are the quicksilver.”</p>
        <p style="font-style: normal; font-size: 0.9rem; margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">— Master Elias Vane, <em>Tractatus Horologicus</em>, 1642</p>
      </div>`,
      order: 3,
      includeInToc: false,
      dropCap: false,
      wordCount: 31,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // Body Chapters
    {
      id: `sec-${demoBookId}-5`,
      bookId: demoBookId,
      type: 'body',
      subtype: 'prologue',
      title: 'Prologue',
      subtitle: 'The Stumbling Hour',
      content: `<p>The great copper bells of Old Town did not chime at midnight. Instead, they gave a single, muffled groan, as though a bronze hand had seized the clapper from within the bell tower’s hollow throat.</p>
      <p>High above the cobblestone alleyways, in the drafty attic of the Royal Astrolabe Foundry, Nicholas froze with a silver needle hovering three inches above the spring-barrel. Outside, the fog smelled of damp stone, sulfur, and unburned coal. On the workbench before him, three dozen clockwork chronometers lay open, their sapphire escapements ticking in frantic, uneven polyrhythms.</p>
      ${sceneBreak}
      <p>Then, without warning, the central pendulum stopped.</p>
      <p>It did not slow. It did not shudder to a gentle halt under the weight of friction. It hung dead at the apex of its leftward swing, suspended at a thirty-degree angle against gravity itself, like a silver tear pinned against the velvet air.</p>`,
      order: 4,
      includeInToc: true,
      dropCap: true,
      wordCount: 145,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-6`,
      bookId: demoBookId,
      type: 'body',
      subtype: 'chapter',
      title: 'Chapter I',
      subtitle: 'The Apprentice’s Lantern',
      epigraph: 'Every mechanism holds an imperfection, and therein lies its soul.',
      content: `<p>Dawn crept over Prague like gray ink spilled across parchment. Nicholas buttoned his wool waistcoat against the river chill, blew out the sputtering whale-oil lantern, and gathered the rolled vellum charts into his leather satchel.</p>
      <p>Across the courtyard, Master Gerhard had not slept. The old guildsman was bent double over the furnace table, the glowing ruby lens strapped to his left eye magnifying an iris clouded with eighty winters. His gnarled hands moved over a sphere of polished brass—not the customary terrestrial globe, but something older, etched with constellations whose names had been forbidden by the Council of Venice.</p>
      <p>“You felt it, then,” Gerhard said, without lifting his gaze. His voice sounded like dry gravel dragged beneath a heavy heel.</p>
      <p>“Three minutes past midnight, Master,” Nicholas replied, keeping his distance from the smoking alembic. “The escapements refused their teeth. The pendulum held at the zenith for seventeen seconds.”</p>
      ${sceneBreak}
      <p>The old man set down his micro-tweezers. A faint metallic aroma—part ozone, part crushed rosemary—drifted up from the brass sphere. When he turned, the ruby lens flashed in the morning twilight like an unblinking coal.</p>
      <p>“Seventeen seconds,” Gerhard whispered, almost reverently. “The astronomers believe the heavens move in circles, boy. They build their instruments to measure circles. But the universe is an escapement. And somewhere in the dark between the stars, a tooth has broken.”</p>`,
      order: 5,
      includeInToc: true,
      dropCap: true,
      wordCount: 226,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-7`,
      bookId: demoBookId,
      type: 'body',
      subtype: 'chapter',
      title: 'Chapter II',
      subtitle: 'The Cipher of Saint Vitus',
      content: `<p>The archives of Saint Vitus lay beneath thirty feet of Bohemian sandstone, where moisture gathered on the vaulted arches in heavy beads that fell with the rhythmic persistence of water clocks.</p>
      <p>Nicholas carried only a horn lantern and an iron key shaped like a double-headed griffin. The air was frigid enough to turn his breath into pale plumes. Row upon row of bound ledgers stretched into the subterranean gloom: church registers, tax tallies from the reign of Charles IV, and confessions whispered centuries before gunpowder reached Europe.</p>
      <p>He was looking for box thirty-seven: the private correspondence of Brother Anselm, who had been burnt in the public square in 1419 for claiming that the stars were molten bronze wheels propelled by celestial oil.</p>
      ${sceneBreak}
      <p>When Nicholas pulled the rusted tin case from the lower shelf, a moth fluttered into the lantern beam, blinded by the sudden flame. Inside lay three sheets of vellum, so thin they were almost translucent. When held against the horn lantern, hidden ink appeared between the Latin prayers: geometric proofs, planetary gears with prime-number tooth counts, and a diagram of an aperture located beneath the altar of Old Town square.</p>`,
      order: 6,
      includeInToc: true,
      dropCap: true,
      wordCount: 198,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },

    // Back matter
    {
      id: `sec-${demoBookId}-8`,
      bookId: demoBookId,
      type: 'back',
      subtype: 'acknowledgments',
      title: 'Acknowledgments',
      content: `<div style="line-height: 1.8; max-width: 520px; margin: 2rem auto;">
        <p>This novel could not have been written without the horological guidance of the British Horological Institute, who generously answered arcane inquiries regarding seventeenth-century escapement tolerances and fusee chains.</p>
        <p style="margin-top: 1rem;">To my agent, Clara Finch, whose faith in an apprentice clockmaker never wavered. To my editor, Julian Reed, whose editorial red pen wielded the precision of a master watchmaker’s chisel.</p>
        <p style="margin-top: 1rem;">And finally, to my partner, Marcus: thank you for keeping the tea warm during long winter nights of writing.</p>
      </div>`,
      order: 7,
      includeInToc: true,
      dropCap: false,
      wordCount: 95,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-9`,
      bookId: demoBookId,
      type: 'back',
      subtype: 'about-author',
      title: 'About the Author',
      content: `<div style="line-height: 1.8; max-width: 520px; margin: 2rem auto;">
        <p><strong>Victoria Vance</strong> is an award-winning historical novelist and mechanical engineer. Before turning to fiction full-time, she spent a decade restoring antique astronomical clocks across Central Europe.</p>
        <p style="margin-top: 1rem;">She lives in Edinburgh with two Scottish terriers and an unruly collection of brass chronometers. When not writing, she can be found wandering second-hand bookstores or tinkering with antique music boxes.</p>
        <p style="margin-top: 1.5rem; font-style: italic;">Connect with Victoria at www.victoriavancebooks.com</p>
      </div>`,
      order: 8,
      includeInToc: true,
      dropCap: false,
      wordCount: 76,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: `sec-${demoBookId}-10`,
      bookId: demoBookId,
      type: 'back',
      subtype: 'also-by',
      title: 'Also by Victoria Vance',
      content: `<div style="text-align: center; line-height: 2; margin: 3rem auto; max-width: 460px;">
        <p style="font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem;">The Aetherium Chronicles</p>
        <p><em>The Alchemist's Horizon</em> (Book I)</p>
        <p><em>The Celestial Escapement</em> (Book II — Coming 2027)</p>
        <div style="margin: 2rem auto; width: 40px; height: 1px; background: currentColor; opacity: 0.3;"></div>
        <p style="font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem;">Stand-alone Novels</p>
        <p><em>The Glass Foundry of Murano</em></p>
        <p><em>Shadows over the Moldau</em></p>
      </div>`,
      order: 9,
      includeInToc: false,
      dropCap: false,
      wordCount: 52,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  await saveBook(demoBook);
  await saveSections(demoSections);

  return { book: demoBook, sections: demoSections };
}
