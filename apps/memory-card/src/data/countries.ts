export interface CountryData {
  code: string;
  name: string;
}

export const COUNTRIES: CountryData[] = [
  { code: 'us', name: 'United States' },
  { code: 'ca', name: 'Canada' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'jp', name: 'Japan' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'it', name: 'Italy' },
  { code: 'au', name: 'Australia' },
  { code: 'br', name: 'Brazil' },
  { code: 'cn', name: 'China' },
  { code: 'in', name: 'India' },
  { code: 'ru', name: 'Russia' },
  { code: 'kr', name: 'South Korea' },
  { code: 'es', name: 'Spain' },
  { code: 'mx', name: 'Mexico' },
  { code: 'ar', name: 'Argentina' },
  { code: 'za', name: 'South Africa' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'se', name: 'Sweden' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'sg', name: 'Singapore' },
  { code: 'my', name: 'Malaysia' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'tr', name: 'Turkey' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'eg', name: 'Egypt' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'id', name: 'Indonesia' },
  { code: 'th', name: 'Thailand' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'no', name: 'Norway' },
  { code: 'dk', name: 'Denmark' },
  { code: 'fi', name: 'Finland' },
  { code: 'ie', name: 'Ireland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'gr', name: 'Greece' },
  { code: 'at', name: 'Austria' },
  { code: 'be', name: 'Belgium' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'pl', name: 'Poland' }
];

export function getFlagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
}
