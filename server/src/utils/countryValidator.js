const COUNTRIES_API =
  'https://raw.githubusercontent.com/mariuspatru/restcountries/main/all-countries-v3.1.json';

const CACHE_DURATION = 5 * 60 * 1000;
const STALE_RETRY_DURATION = 30 * 1000;

let cachedCountries = null;
let cacheExpiresAt = 0;
let pendingRequest = null;

// Fetch and cache canonical country information
async function loadCountries() {
  const response = await fetch(COUNTRIES_API, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error('Unable to fetch country data');
  }

  const countries = await response.json();

  if (!Array.isArray(countries)) {
    throw new Error('Invalid country dataset');
  }

  const countryMap = new Map();

  for (const country of countries) {
    const code = country?.cca3;
    const name = country?.name?.common;

    if (
      !/^[A-Z]{3}$/.test(code || '') ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      continue;
    }

    const record = {
      countryCode: code,
      countryName: name.trim(),
      flag: country.flags?.svg || country.flags?.png || '',
      region: country.region || 'Other',
      capital: Array.isArray(country.capital)
        ? country.capital[0] || 'No capital listed'
        : 'No capital listed'
    };

    // Keep canonical records within database field limits
    if (
      record.countryName.length > 120 ||
      typeof record.flag !== 'string' ||
      record.flag.length > 500 ||
      typeof record.region !== 'string' ||
      record.region.length > 100 ||
      typeof record.capital !== 'string' ||
      record.capital.length > 120
    ) {
      continue;
    }

    countryMap.set(code, record);
  }

  if (countryMap.size === 0) {
    throw new Error('Country dataset is empty');
  }

  cachedCountries = countryMap;
  cacheExpiresAt = Date.now() + CACHE_DURATION;

  return countryMap;
}

// Return verified country information
export async function getValidCountry(countryCode) {
  if (
    typeof countryCode !== 'string' ||
    !/^[A-Z]{3}$/.test(countryCode)
  ) {
    return null;
  }

  if (
    cachedCountries &&
    Date.now() < cacheExpiresAt
  ) {
    return cachedCountries.get(countryCode) || null;
  }

  if (!pendingRequest) {
    pendingRequest = loadCountries().finally(() => {
      pendingRequest = null;
    });
  }

  // Use stale country data when refresh fails
  const countries = await pendingRequest.catch((error) => {
    if (!cachedCountries) {
      throw error;
    }

    cacheExpiresAt = Date.now() + STALE_RETRY_DURATION;

    return cachedCountries;
  });

  return countries.get(countryCode) || null;
}

// Preserve compatibility with existing validation calls
export async function isValidCountryCode(countryCode) {
  const country = await getValidCountry(countryCode);
  return country !== null;
}