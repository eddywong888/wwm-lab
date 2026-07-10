// Shared number/money formatting. Both English and Chinese prompts use the
// same Arabic-numeral digits, so a single formatter serves both languages.

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Format an integer number of sen (1/100 RM) as "RM1,234.55" */
export function formatMoneySen(sen: number): string {
  const sign = sen < 0 ? '-' : '';
  const abs = Math.abs(Math.round(sen));
  const ringgit = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}RM${ringgit.toLocaleString('en-US')}.${String(cents).padStart(2, '0')}`;
}

/**
 * Format an integer number of sen as a plain decimal string with no "RM"
 * prefix or thousands separator, e.g. "23.20" — matches what the on-screen
 * numeric keypad (digits, minus, decimal point) can actually produce.
 */
export function formatSenPlain(sen: number): string {
  const sign = sen < 0 ? '-' : '';
  const abs = Math.abs(Math.round(sen));
  const ringgit = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}${ringgit}.${String(cents).padStart(2, '0')}`;
}

const ONES_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS_EN = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function threeDigitsToWordsEN(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES_EN[hundreds]} hundred`);
  if (rest > 0) {
    if (rest < 20) {
      parts.push(ONES_EN[rest]);
    } else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      parts.push(ones > 0 ? `${TENS_EN[tens]}-${ONES_EN[ones]}` : TENS_EN[tens]);
    }
  }
  return parts.join(' ');
}

/** Number-to-words in English, supporting up to 999,999. */
export function numberToWordsEN(n: number): string {
  if (n === 0) return 'zero';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions > 0) parts.push(`${threeDigitsToWordsEN(millions)} million`);
  if (thousands > 0) parts.push(`${threeDigitsToWordsEN(thousands)} thousand`);
  if (rest > 0) parts.push(threeDigitsToWordsEN(rest));
  return parts.join(', ');
}

const DIGIT_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function fourDigitsToWordsZH(n: number): string {
  // n in [0, 9999]
  if (n === 0) return '';
  const thousand = Math.floor(n / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const ten = Math.floor((n % 100) / 10);
  const one = n % 10;
  let s = '';
  let seenHigher = false;
  if (thousand > 0) {
    s += DIGIT_ZH[thousand] + '千';
    seenHigher = true;
  }
  if (hundred > 0) {
    s += DIGIT_ZH[hundred] + '百';
    seenHigher = true;
  } else if (seenHigher && (ten > 0 || one > 0)) {
    s += '零';
  }
  if (ten > 0) {
    // "一十" is usually just "十" only at the very start of the whole number,
    // but within a segment following higher digits we keep the leading 一.
    if (ten === 1 && !seenHigher) {
      s += '十';
    } else {
      s += DIGIT_ZH[ten] + '十';
    }
    seenHigher = true;
  } else if (seenHigher && one > 0 && hundred === 0 && thousand === 0) {
    // no-op, handled above
  } else if (hundred > 0 && one > 0 && ten === 0) {
    s += '零';
  }
  if (one > 0) {
    s += DIGIT_ZH[one];
  }
  return s;
}

/** Number-to-words (Simplified Chinese), supporting up to 999,999 (以内). */
export function numberToWordsZH(n: number): string {
  if (n === 0) return '零';
  const wan = Math.floor(n / 10000);
  const rest = n % 10000;
  let s = '';
  if (wan > 0) {
    s += fourDigitsToWordsZH(wan) + '万';
    if (rest > 0 && rest < 1000) s += '零';
  }
  s += fourDigitsToWordsZH(rest);
  return s;
}
