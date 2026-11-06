/**
 * EAN-13 / ISBN Vector Barcode Generator
 * Generates standards-compliant SVG vector barcodes for book back-covers.
 */

const L_CODE: string[] = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

const G_CODE: string[] = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

const R_CODE: string[] = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

// Parity table for first digit (0-9 determines L vs G patterns for left group)
const PARITY_MAP: string[] = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

export function cleanIsbn(isbn: string): string {
  return (isbn || '').replace(/[^0-9]/g, '');
}

export function calculateIsbn13CheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digits12[i] || '0', 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export function isValidIsbn13(isbn: string): boolean {
  const clean = cleanIsbn(isbn);
  if (clean.length !== 13) return false;
  const expectedCheck = calculateIsbn13CheckDigit(clean.slice(0, 12));
  return parseInt(clean[12], 10) === expectedCheck;
}

export function generateEan13Svg(
  isbn: string,
  options: {
    addon5?: string; // Optional 5-digit price addon, e.g. "51999"
    width?: number;
    height?: number;
    color?: string;
    bgColor?: string;
  } = {}
): string {
  let digits = cleanIsbn(isbn);
  if (digits.length < 12) {
    digits = '978000000000'.slice(0, 12);
  }
  if (digits.length === 12) {
    digits += calculateIsbn13CheckDigit(digits);
  } else if (digits.length > 13) {
    digits = digits.slice(0, 13);
  }

  const firstDigit = parseInt(digits[0], 10);
  const leftDigits = digits.slice(1, 7);
  const rightDigits = digits.slice(7, 13);
  const parity = PARITY_MAP[firstDigit] || 'LLLLLL';

  let bitString = '';

  // Start guard
  bitString += '101';

  // Left 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(leftDigits[i], 10);
    const patternType = parity[i];
    bitString += patternType === 'L' ? L_CODE[digit] : G_CODE[digit];
  }

  // Center guard
  bitString += '01010';

  // Right 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(rightDigits[i], 10);
    bitString += R_CODE[digit];
  }

  // End guard
  bitString += '101';

  const barWidth = 1.6;
  const barHeight = 60;
  const guardExtraHeight = 6;
  const totalBarcodeWidth = bitString.length * barWidth;
  const totalSvgWidth = options.width || 200;
  const totalSvgHeight = options.height || 100;
  const barColor = options.color || '#000000';
  const bgColor = options.bgColor || '#ffffff';

  const formattedIsbn = `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9, 12)}-${digits.slice(12, 13)}`;

  let barsSvg = '';
  for (let i = 0; i < bitString.length; i++) {
    if (bitString[i] === '1') {
      const isGuard =
        i < 3 || (i >= 45 && i < 50) || i >= bitString.length - 3;
      const h = isGuard ? barHeight + guardExtraHeight : barHeight;
      const x = 16 + i * barWidth;
      barsSvg += `<rect x="${x.toFixed(2)}" y="16" width="${barWidth.toFixed(2)}" height="${h}" fill="${barColor}" />`;
    }
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSvgWidth} ${totalSvgHeight}" width="${totalSvgWidth}" height="${totalSvgHeight}">
  <rect width="100%" height="100%" fill="${bgColor}" rx="4" />
  <g id="bars">
    ${barsSvg}
  </g>
  <!-- First Digit on outer left -->
  <text x="8" y="78" font-family="Courier, monospace" font-size="11" font-weight="bold" fill="${barColor}">${firstDigit}</text>
  <!-- Human-readable formatted ISBN text at top/bottom -->
  <text x="${totalBarcodeWidth / 2 + 16}" y="12" font-family="Courier, monospace" font-size="8.5" text-anchor="middle" font-weight="600" fill="${barColor}">ISBN ${formattedIsbn}</text>
  <!-- Digits under bars -->
  <text x="${16 + 21 * barWidth}" y="88" font-family="Courier, monospace" font-size="9" text-anchor="middle" fill="${barColor}">${leftDigits}</text>
  <text x="${16 + 68 * barWidth}" y="88" font-family="Courier, monospace" font-size="9" text-anchor="middle" fill="${barColor}">${rightDigits}</text>
</svg>`.trim();
}
