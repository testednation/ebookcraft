export interface OrnamentDefinition {
  key: string;
  name: string;
  category: 'classic' | 'botanical' | 'minimal' | 'celestial';
  svg: string;
}

export const ORNAMENTS: OrnamentDefinition[] = [
  {
    key: 'fleuron',
    name: 'Classic Fleuron',
    category: 'classic',
    svg: `<svg viewBox="0 0 100 24" width="80" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 2C46 8 38 12 30 12C36 14 42 18 44 22C46 16 54 16 56 22C58 18 64 14 70 12C62 12 54 8 50 2Z" opacity="0.9"/>
      <circle cx="50" cy="12" r="2.5"/>
      <circle cx="20" cy="12" r="1.5"/>
      <circle cx="80" cy="12" r="1.5"/>
      <line x1="5" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1"/>
      <line x1="84" y1="12" x2="95" y2="12" stroke="currentColor" stroke-width="1"/>
    </svg>`,
  },
  {
    key: 'diamonds',
    name: 'Diamond Asterism',
    category: 'minimal',
    svg: `<svg viewBox="0 0 100 20" width="70" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,4 56,10 50,16 44,10" />
      <polygon points="32,6 36,10 32,14 28,10" opacity="0.75" />
      <polygon points="68,6 72,10 68,14 64,10" opacity="0.75" />
      <line x1="10" y1="10" x2="24" y2="10" stroke="currentColor" stroke-width="0.75"/>
      <line x1="76" y1="10" x2="90" y2="10" stroke="currentColor" stroke-width="0.75"/>
    </svg>`,
  },
  {
    key: 'scroll',
    name: 'Victorian Scroll',
    category: 'classic',
    svg: `<svg viewBox="0 0 120 24" width="96" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 4C52 14 44 14 36 8C28 2 20 8 16 12C20 12 26 8 32 12C40 16 48 16 56 6L60 4Z"/>
      <path d="M60 4C68 14 76 14 84 8C92 2 100 8 104 12C100 12 94 8 88 12C80 16 72 16 64 6L60 4Z"/>
      <circle cx="60" cy="16" r="2"/>
    </svg>`,
  },
  {
    key: 'stars',
    name: 'Celestial Trio',
    category: 'celestial',
    svg: `<svg viewBox="0 0 100 20" width="75" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 2L52.5 7.5L58 10L52.5 12.5L50 18L47.5 12.5L42 10L47.5 7.5Z"/>
      <path d="M30 4.5L31.5 8L35 10L31.5 12L30 15.5L28.5 12L25 10L28.5 8Z" opacity="0.8"/>
      <path d="M70 4.5L71.5 8L75 10L71.5 12L70 15.5L68.5 12L65 10L68.5 8Z" opacity="0.8"/>
      <line x1="8" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="0.75"/>
      <line x1="80" y1="10" x2="92" y2="10" stroke="currentColor" stroke-width="0.75"/>
    </svg>`,
  },
  {
    key: 'laurel',
    name: 'Botanical Laurel',
    category: 'botanical',
    svg: `<svg viewBox="0 0 120 24" width="96" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 12C50 10 40 6 30 12C36 10 44 14 50 14C54 14 58 13 60 12Z"/>
      <path d="M60 12C70 10 80 6 90 12C84 10 76 14 70 14C66 14 62 13 60 12Z"/>
      <ellipse cx="44" cy="7" rx="3.5" ry="2" transform="rotate(-25 44 7)"/>
      <ellipse cx="76" cy="7" rx="3.5" ry="2" transform="rotate(25 76 7)"/>
      <circle cx="60" cy="8" r="2.5"/>
    </svg>`,
  },
  {
    key: 'feather',
    name: 'Author Quill',
    category: 'classic',
    svg: `<svg viewBox="0 0 120 24" width="96" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18C45 15 70 8 100 4C90 10 75 16 55 18C45 19 32 19 20 18Z"/>
      <line x1="15" y1="19" x2="105" y2="4" stroke="currentColor" stroke-width="1"/>
      <circle cx="60" cy="18" r="1.5"/>
    </svg>`,
  },
  {
    key: 'lines',
    name: 'Modern Bar & Pip',
    category: 'minimal',
    svg: `<svg viewBox="0 0 100 16" width="70" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="8" x2="42" y2="8" stroke="currentColor" stroke-width="1.25"/>
      <rect x="47" y="5" width="6" height="6" rx="1"/>
      <line x1="58" y1="8" x2="90" y2="8" stroke="currentColor" stroke-width="1.25"/>
    </svg>`,
  },
];

export function getOrnamentSvg(key: string): string {
  const found = ORNAMENTS.find((o) => o.key === key);
  return found ? found.svg : ORNAMENTS[0].svg;
}

export function createSceneBreakHtml(ornamentKey: string): string {
  const svg = getOrnamentSvg(ornamentKey);
  return `<div class="folio-scene-break" data-ornament="${ornamentKey}" style="text-align: center; margin: 2rem 0; opacity: 0.85; user-select: none;">${svg}</div>`;
}
