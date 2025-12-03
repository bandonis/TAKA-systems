type SupportedValuesOf = (key: string) => string[];

type CountryOption = {
  value: string;
  label: string;
};

const FALLBACK_COUNTRY_CODES = [
  'US',
  'CA',
  'GB',
  'IE',
  'DE',
  'FR',
  'ES',
  'IT',
  'PT',
  'NL',
  'BE',
  'LU',
  'AT',
  'CH',
  'DK',
  'SE',
  'NO',
  'FI',
  'IS',
  'EE',
  'LV',
  'LT',
  'PL',
  'CZ',
  'SK',
  'HU',
  'SI',
  'HR',
  'RO',
  'BG',
  'GR',
  'CY',
  'MT',
  'AU',
  'NZ',
  'SG',
  'JP',
  'CN',
  'HK',
  'AE',
  'SA',
  'QA',
  'KW',
  'BR',
  'AR',
  'MX',
  'CL',
  'ZA'
] as const;

const ISO_REGION_REGEX = /^[A-Z]{2}$/;

function resolveCountryCodes(): string[] {
  const supportedValuesOf = (Intl as typeof Intl & { supportedValuesOf?: SupportedValuesOf }).supportedValuesOf;
  if (typeof supportedValuesOf === 'function') {
    try {
      return supportedValuesOf.call(Intl, 'region').filter((code) => ISO_REGION_REGEX.test(code));
    } catch {
      // Fallback to static list if the runtime does not support querying regions.
    }
  }
  return [...FALLBACK_COUNTRY_CODES];
}

const rawCountryCodes = resolveCountryCodes();

export const COUNTRY_CODES = Array.from(new Set(rawCountryCodes));

export const COUNTRY_CODE_SET = new Set(COUNTRY_CODES);

const displayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

function resolveCountryLabel(code: string) {
  try {
    return displayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export const COUNTRY_OPTIONS: CountryOption[] = COUNTRY_CODES.map((code) => ({
  value: code,
  label: resolveCountryLabel(code)
})).sort((a, b) => a.label.localeCompare(b.label, 'en'));

export const COUNTRY_NAME_LOOKUP = new Map<string, string>();

for (const option of COUNTRY_OPTIONS) {
  COUNTRY_NAME_LOOKUP.set(option.label.toLowerCase(), option.value);
  COUNTRY_NAME_LOOKUP.set(option.value.toLowerCase(), option.value);
}


