const COUNTRIES_API =
  'https://raw.githubusercontent.com/mariuspatru/restcountries/main/all-countries-v3.1.json';

const CACHE_DURATION = 5 * 60 * 1000;

let cachedCodes = null;
let cacheExpiresAt = 0;
let pendingRequest = null;

async function loadCountryCodes() {
  const response = await fetch(COUNTRIES_API, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error('Unable to fetch country codes');
  }

  const countries = await response.json();

  if (!Array.isArray(countries)) {
    throw new Error('Invalid country dataset');
  }

  const codes = new Set(
    countries
      .map((country) => country?.cca3)
      .filter((code) => /^[A-Z]{3}$/.test(code))
  );

  if (codes.size === 0) {
    throw new Error('Country dataset is empty');
  }

  cachedCodes = codes;
  cacheExpiresAt = Date.now() + CACHE_DURATION;

  return codes;
}

export async function isValidCountryCode(countryCode) {
  if (!/^[A-Z]{3}$/.test(countryCode)) {
    return false;
  }

  if (cachedCodes && Date.now() < cacheExpiresAt) {
    return cachedCodes.has(countryCode);
  }

  if (!pendingRequest) {
    pendingRequest = loadCountryCodes().finally(() => {
      pendingRequest = null;
    });
  }

  const codes = await pendingRequest;

  return codes.has(countryCode);
}