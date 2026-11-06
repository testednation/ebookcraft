import { Book, Chapter, CharacterProfile } from '../types/book';
import { getDefaultStyleConfig } from './themes';

const DB_NAME = 'foliocraft_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chapterStore.createIndex('bookId', 'bookId', { unique: false });
      }
      if (!db.objectStoreNames.contains('characters')) {
        const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
        characterStore.createIndex('bookId', 'bookId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/* ==================== Books ==================== */

export async function getBooks(): Promise<Book[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.getAll();
    req.onsuccess = () => {
      const rawBooks: Book[] = req.result || [];
      const normalized = rawBooks.map((b) => ({
        ...b,
        styleConfig: {
          ...getDefaultStyleConfig(b.styleConfig?.themeId || 'literary'),
          ...(b.styleConfig || {}),
        },
      }));
      resolve(normalized);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveBook(book: Book): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readwrite');
    const store = tx.objectStore('books');
    store.put(book);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'chapters', 'characters'], 'readwrite');
    tx.objectStore('books').delete(id);

    const chStore = tx.objectStore('chapters');
    const chIndex = chStore.index('bookId');
    const chReq = chIndex.getAllKeys(id);
    chReq.onsuccess = () => {
      chReq.result.forEach((key) => chStore.delete(key));
    };

    const charStore = tx.objectStore('characters');
    const charIndex = charStore.index('bookId');
    const charReq = charIndex.getAllKeys(id);
    charReq.onsuccess = () => {
      charReq.result.forEach((key) => charStore.delete(key));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==================== Chapters ==================== */

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('bookId');
    const req = index.getAll(bookId);
    req.onsuccess = () => {
      const chapters: Chapter[] = req.result || [];
      chapters.sort((a, b) => a.order - b.order);
      resolve(chapters);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    store.put(chapter);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveChapters(chapters: Chapter[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    chapters.forEach((ch) => store.put(ch));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteChapter(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==================== Characters ==================== */

export async function getCharacters(bookId: string): Promise<CharacterProfile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('characters', 'readonly');
    const store = tx.objectStore('characters');
    const index = store.index('bookId');
    const req = index.getAll(bookId);
    req.onsuccess = () => {
      const chars: CharacterProfile[] = req.result || [];
      chars.sort((a, b) => a.name.localeCompare(b.name));
      resolve(chars);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveCharacter(character: CharacterProfile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('characters', 'readwrite');
    const store = tx.objectStore('characters');
    store.put(character);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCharacters(characters: CharacterProfile[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('characters', 'readwrite');
    const store = tx.objectStore('characters');
    characters.forEach((c) => store.put(c));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('characters', 'readwrite');
    const store = tx.objectStore('characters');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==================== Backups ==================== */

export async function exportFullBackupJSON(bookId: string): Promise<string> {
  const books = await getBooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new Error('Book not found');
  const chapters = await getChapters(bookId);
  const characters = await getCharacters(bookId);

  const payload = {
    version: 2,
    timestamp: new Date().toISOString(),
    book,
    chapters,
    characters,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importFullBackupJSON(jsonStr: string): Promise<{ book: Book; chapters: Chapter[]; characters: CharacterProfile[] }> {
  const data = JSON.parse(jsonStr);
  if (!data.book || !Array.isArray(data.chapters)) {
    throw new Error('Invalid FolioCraft project backup file.');
  }

  const book: Book = {
    ...data.book,
    styleConfig: {
      ...getDefaultStyleConfig('literary'),
      ...(data.book.styleConfig || {}),
    },
    updatedAt: Date.now(),
  };

  const chapters: Chapter[] = data.chapters.map((ch: Chapter) => ({
    ...ch,
    bookId: book.id,
  }));

  const characters: CharacterProfile[] = Array.isArray(data.characters)
    ? data.characters.map((c: CharacterProfile) => ({ ...c, bookId: book.id }))
    : [];

  await saveBook(book);
  await saveChapters(chapters);
  if (characters.length > 0) {
    await saveCharacters(characters);
  }

  return { book, chapters, characters };
}

/* ==================== Initial Demo Seeding ==================== */

export async function seedInitialDemoIfEmpty(): Promise<{ book: Book; chapters: Chapter[]; characters: CharacterProfile[] }> {
  const existingBooks = await getBooks();
  if (existingBooks.length > 0) {
    let book = existingBooks[0];
    let needsUpdate = false;
    if (!book.styleConfig || !book.styleConfig.chapterOrnamentId) {
      book = {
        ...book,
        styleConfig: {
          ...getDefaultStyleConfig('literary'),
          ...(book.styleConfig || {}),
        },
      };
      needsUpdate = true;
    }
    if (!book.targetWordCount || !book.dailyWordGoal) {
      book = {
        ...book,
        targetWordCount: book.targetWordCount || 60000,
        dailyWordGoal: book.dailyWordGoal || 1000,
        dailyBaselineDate: book.dailyBaselineDate || new Date().toISOString().slice(0, 10),
        dailyBaselineWords: book.dailyBaselineWords ?? 0,
      };
      needsUpdate = true;
    }
    const chapters = await getChapters(book.id);
    const characters = await getCharacters(book.id);
    if (needsUpdate) {
      await saveBook(book);
    }
    return { book, chapters, characters };
  }

  const demoBookId = 'book-clockwork-horizon';
  const todayStr = new Date().toISOString().slice(0, 10);
  const demoBook: Book = {
    id: demoBookId,
    title: 'The Clockwork Horizon',
    subtitle: 'A Chronicle of the Brass Archipelago',
    author: 'Elena R. Sterling',
    publisher: 'Aetherial Press',
    isbn: '978-1-73891-002-4',
    description: 'An atmospheric adventure across mechanical skies, where airships track the dying pulse of forgotten celestial spheres.',
    language: 'en',
    genre: 'Fantasy / Steampunk',
    styleConfig: getDefaultStyleConfig('literary'),
    autoSaveFrequency: '5s',
    targetWordCount: 65000,
    dailyWordGoal: 1000,
    dailyBaselineDate: todayStr,
    dailyBaselineWords: 400,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const demoChapters: Chapter[] = [
    {
      id: 'ch-title',
      bookId: demoBookId,
      title: 'Title Page',
      type: 'title-page',
      group: 'front-matter',
      order: 1,
      wordCount: 12,
      includeInToc: false,
      pageBreakBefore: true,
      content: `
        <div class="text-center py-12">
          <h1 class="text-3xl font-serif font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">The Clockwork Horizon</h1>
          <p class="text-sm italic text-neutral-600 dark:text-neutral-400 mt-2">A Chronicle of the Brass Archipelago</p>
          <div class="my-8"><span class="inline-block w-12 h-px bg-neutral-400"></span></div>
          <p class="text-base font-semibold tracking-wide text-neutral-800 dark:text-neutral-200">ELENA R. STERLING</p>
          <p class="text-xs text-neutral-500 uppercase tracking-widest mt-12">AETHERIAL PRESS &bull; EDINBURGH</p>
        </div>
      `,
    },
    {
      id: 'ch-copyright',
      bookId: demoBookId,
      title: 'Copyright',
      type: 'copyright',
      group: 'front-matter',
      order: 2,
      wordCount: 65,
      includeInToc: false,
      pageBreakBefore: true,
      content: `
        <div class="text-xs text-neutral-500 space-y-3 pt-24 font-sans leading-relaxed">
          <p>The Clockwork Horizon &copy; 2026 by Elena R. Sterling. All rights reserved.</p>
          <p>Published by Aetherial Press, London and Edinburgh.</p>
          <p>This is a work of fiction. Names, characters, businesses, places, events, locales, and incidents are either the products of the author's imagination or used in a fictitious manner.</p>
          <p>First FolioCraft Collector's Edition: November 2026<br/>ISBN: 978-1-73891-002-4</p>
        </div>
      `,
    },
    {
      id: 'ch-toc',
      bookId: demoBookId,
      title: 'Table of Contents',
      type: 'toc',
      group: 'front-matter',
      order: 3,
      wordCount: 15,
      includeInToc: false,
      pageBreakBefore: true,
      content: `<p class="italic text-neutral-500">Table of Contents will automatically populate in publication exports.</p>`,
    },
    {
      id: 'ch-part-1',
      bookId: demoBookId,
      title: 'Part I',
      subtitle: 'The Brass Meridian',
      number: 1,
      partNumber: 1,
      type: 'part',
      group: 'body',
      order: 4,
      wordCount: 5,
      targetWordCount: 5,
      includeInToc: true,
      pageBreakBefore: true,
      content: `<p class="text-center italic text-neutral-400">"When the pendulums pause, the horizon remembers its ancient curvature."</p>`,
    },
    {
      id: 'ch-prologue',
      bookId: demoBookId,
      title: 'Prologue',
      subtitle: 'The Gilded Astrolabe',
      number: undefined,
      type: 'prologue',
      group: 'body',
      order: 5,
      wordCount: 220,
      targetWordCount: 1500,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [
        {
          id: 'fn-1',
          number: 1,
          text: 'The Great Meridian was calibrated in 1842 using celestial refraction angles recorded by the Edinburgh Astronomical Guild.',
        },
      ],
      content: `
        <p>The dawn broke over the Brass Archipelago not with birdsong, but with the steady, synchronized ticking of eleven thousand suspended pendulum towers. Through the sulfur mist, the Great Meridian rotated upon immense jade bearings, whispering forgotten equations to the empty sky.</p>
        <p>High above the harbor docks, Nicholas Drake adjusted the brass aperture of his ocular lens. The atmospheric barometer was plunging faster than a punctured gasbag. Something colossal was disturbing the ionosphere, carving trenches of ozone through clouds that had known only wind for centuries.<sup class="text-amber-400 font-mono font-bold">[1]</sup></p>
        <hr />
        <p>He folded the copper quadrant into his canvas waistcoat and stepped to the edge of the iron gantry. The air smelled of burnt camphor and ozone. Far below, the bells of St. Jude's Basilica began to chime, but their intervals were wrong—fractions of a second late, as if time itself had grown viscous and resistant.</p>
      `,
    },
    {
      id: 'ch-1',
      bookId: demoBookId,
      title: 'Chapter One',
      subtitle: 'Tides of Molten Glass',
      number: 1,
      type: 'chapter',
      group: 'body',
      order: 6,
      wordCount: 380,
      targetWordCount: 3000,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [
        {
          id: 'fn-2',
          number: 1,
          text: 'Vellum charts of the Cerulean Gulf require monthly baths in diluted tea oil to stave off brine rot.',
        },
      ],
      content: `
        <p>No one ever explained to the apprentices of the Admiralty Why the horizon curved upward at the rim of the world. It was simply accepted as one accepts the weight of copper coins or the bite of winter brine.</p>
        <p>Master Julian sat hunched over the drafting table, his calloused thumbs smoothing the vellum charts of the Cerulean Gulf.<sup class="text-amber-400 font-mono font-bold">[1]</sup> Across the bay, the leviathan boilers of the Iron Citadel exhaled plumes of pearlescent steam that drifted lazily toward the moon.</p>
        <p>"You doubt the reading, Nicholas," the old cartographer murmured without raising his eyes from the ink compass. "You believe the chronometer has succumbed to salt damp."</p>
        <p>"The variance is thirty-seven arc-seconds, sir," Nicholas replied, resting his gloved hands upon the cedar balustrade. "Salt damp can rust an escapement spring, but it cannot bend the alignment of Polaris."</p>
        <hr />
        <p>Julian slowly lifted his head. The gaslamp caught the faint silver lattice etched into his artificial eye. When he spoke again, his voice possessed that rare quietude that precedes artillery fire.</p>
        <p>"Then pack your sextant, lad. The Sovereign's flagship departs on the midnight tide, and the Emperor has forbidden any living soul from disembarking until the meridian is restored."</p>
      `,
    },
    {
      id: 'ch-about',
      bookId: demoBookId,
      title: 'About the Author',
      type: 'about-author',
      group: 'back-matter',
      order: 7,
      wordCount: 110,
      includeInToc: true,
      pageBreakBefore: true,
      content: `
        <p>Elena R. Sterling is a speculative fiction author, former marine chronometer restorer, and avid collector of antique astrolabes. Her novels explore the intersections of Victorian industry, celestial mechanics, and human solitude.</p>
        <p>She lives in the Scottish Highlands with two greyhounds and an iron printing press named Hephaestus.</p>
      `,
    },
  ];

  const demoCharacters: CharacterProfile[] = [
    {
      id: 'char-nicholas-drake',
      bookId: demoBookId,
      name: 'Nicholas Drake',
      role: 'protagonist',
      aliases: 'Nick, The Observatory Apprentice',
      age: '22',
      occupation: 'Junior Celestial Cartographer',
      color: '#f59e0b',
      physicalTraits: 'Lean athletic build; unruly dark chestnut hair perpetually dusted with graphite; keen hazel eyes behind custom brass-framed bifocals; ink-stained knuckles on his right hand.',
      bio: 'Orphaned during the Great Brass Collapse of 1884, Nicholas was taken under the wing of Master Julian Vance. Possesses an extraordinary intuitive gift for celestial mechanics and mechanical acoustics.',
      personalityTraits: 'Meticulous, quiet under pressure, stubborn when facts contradict authority. Speaks in precise, clipped cadences.',
      notes: 'Carries a pocket watch that runs backward—a legacy left behind by his cartographer mother.',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'char-lady-seraphina',
      bookId: demoBookId,
      name: 'Lady Seraphina Vance',
      role: 'antagonist',
      aliases: 'The Iron Baroness, Director Vance',
      age: '44',
      occupation: 'High Chancellor of the Meridian Admiralty',
      color: '#e11d48',
      physicalTraits: 'Tall, aristocratically upright; silver-streaked raven hair woven into intricate coil braids; cold slate-gray eyes; wears high-collared velvet coats adorned with gearwork insignias.',
      bio: 'Julian Vance\'s estranged younger sister. Believes the celestial shift is not a catastrophe to be averted, but a planned cosmic ascension that will purge weakness from the Archipelago.',
      personalityTraits: 'Ruthlessly pragmatic, silken voiced, never raises her temper; every word is measured like poison in a cordial.',
      notes: 'Has clandestine dealings with the guild saboteurs who tampered with the Central Pendulum.',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'char-master-julian',
      bookId: demoBookId,
      name: 'Master Julian Vance',
      role: 'supporting',
      aliases: 'Old Julian, The Blind Astrologer',
      age: '68',
      occupation: 'Chief Cartographer Emeritus of St. Jude\'s',
      color: '#10b981',
      physicalTraits: 'Stooped shoulders, weathered parchment skin, artificial left eye made of polished silver and sapphire crystal; fingers scarred from decades of molten solder.',
      bio: 'Once the most celebrated navigator of the Queen\'s sky-fleet. Stepped down forty years ago after an expedition beyond the Great Meridian whose logs remain heavily redacted.',
      personalityTraits: 'Gruff exterior masking profound paternal affection for Nicholas. Smokes sweet cherry tobacco in a carved briar pipe.',
      notes: 'Knows the exact coordinates where the horizon folds, but fears what will awaken if Nicholas goes there.',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
  ];

  await saveBook(demoBook);
  await saveChapters(demoChapters);
  await saveCharacters(demoCharacters);

  return { book: demoBook, chapters: demoChapters, characters: demoCharacters };
}
