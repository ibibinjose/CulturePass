/**
 * CulturePass Global Currency Engine
 * Maps roughly 200+ countries to their local currency ISO code to support native pricing displays
 * and Stripe gateway intents worldwide.
 */

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // North America
  'United States': 'USD',
  'Canada': 'CAD',
  'Mexico': 'MXN',

  // Europe (Eurozone + Others)
  'United Kingdom': 'GBP',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'Ireland': 'EUR',
  'Portugal': 'EUR',
  'Greece': 'EUR',
  'Finland': 'EUR',
  'Slovakia': 'EUR',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Bulgaria': 'BGN',
  'Croatia': 'EUR',
  'Russia': 'RUB',
  'Ukraine': 'UAH',

  // Oceania
  'Australia': 'AUD',
  'New Zealand': 'NZD',
  'Fiji': 'FJD',

  // Asia
  'Japan': 'JPY',
  'China': 'CNY',
  'India': 'INR',
  'South Korea': 'KRW',
  'Singapore': 'SGD',
  'Malaysia': 'MYR',
  'Indonesia': 'IDR',
  'Thailand': 'THB',
  'Vietnam': 'VND',
  'Philippines': 'PHP',
  'Taiwan': 'TWD',
  'Hong Kong': 'HKD',
  'Pakistan': 'PKR',
  'Bangladesh': 'BDT',
  'Sri Lanka': 'LKR',

  // Middle East
  'United Arab Emirates': 'AED',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Qatar': 'QAR',
  'Kuwait': 'KWD',
  'Oman': 'OMR',
  'Bahrain': 'BHD',
  'Israel': 'ILS',
  'Turkey': 'TRY',
  'Egypt': 'EGP',
  'Jordan': 'JOD',
  'Lebanon': 'LBP',

  // Africa
  'South Africa': 'ZAR',
  'Nigeria': 'NGN',
  'Kenya': 'KES',
  'Ghana': 'GHS',
  'Tanzania': 'TZS',
  'Uganda': 'UGX',
  'Morocco': 'MAD',
  'Algeria': 'DZD',
  'Tunisia': 'TND',

  // Latin America
  'Brazil': 'BRL',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'Uruguay': 'UYU',
  'Venezuela': 'VES',
};

/**
 * Fallback to USD if the country isn't matched exactly or omitted.
 */
export function getCurrencyForCountry(country?: string | null): string {
  if (!country) return 'USD';
  return COUNTRY_TO_CURRENCY[country] || 'USD';
}

/**
 * Returns a strict locale (e.g. en-AU) for Intl formatting so the currency
 * renders natively (e.g. ¥ vs JPY).
 */
export function getLocaleForCountry(country?: string | null): string {
  if (!country) return 'en-US';
  const mapping: Record<string, string> = {
    'Australia': 'en-AU',
    'New Zealand': 'en-NZ',
    'United Kingdom': 'en-GB',
    'United States': 'en-US',
    'Canada': 'en-CA',
    'United Arab Emirates': 'ar-AE',
    'UAE': 'ar-AE',
    'Germany': 'de-DE',
    'France': 'fr-FR',
    'Japan': 'ja-JP',
    'India': 'en-IN',
    'China': 'zh-CN',
  };
  return mapping[country] || 'en-US';
}

/**
 * Formats an integer amount (in cents/lowest denominator) to a localized, formatted string.
 */
export function formatCurrency(cents: number, country?: string | null): string {
  const currency = getCurrencyForCountry(country);
  const locale = getLocaleForCountry(country);
  
  // Note: some currencies like JPY do NOT use fractional units in Stripe conventionally,
  // but we enforce / 100 for now uniformly in CulturePass for AUD/USD/GBP etc.
  const isZeroDecimal = ['JPY', 'KRW', 'VND'].includes(currency);
  const amount = isZeroDecimal ? cents : cents / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount);
}
