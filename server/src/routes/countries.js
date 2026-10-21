import { Router } from 'express';

const router = Router();

const COUNTRIES_API =
  'https://raw.githubusercontent.com/mariuspatru/restcountries/main/all-countries-v3.1.json';

router.get('/', async (_req, res, next) => {
  try {
    const response = await fetch(COUNTRIES_API, {
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return res.status(502).json({
        message: 'Unable to fetch country data.'
      });
    }

    const countries = await response.json();

    if (!Array.isArray(countries)) {
      return res.status(502).json({
        message: 'Invalid country data received.'
      });
    }

    const safeCountries = countries
      .filter((country) => country?.name?.common && country?.cca3)
      .map((country) => ({
        code: country.cca3,
        name: country.name.common,
        officialName: country.name.official || country.name.common,
        flag: country.flags?.svg || country.flags?.png || '',
        flagAlt: country.flags?.alt || `Flag of ${country.name.common}`,
        capital: Array.isArray(country.capital)
          ? country.capital[0] || 'No capital listed'
          : 'No capital listed',
        region: country.region || 'Other',
        subregion: country.subregion || '',
        population: Number(country.population) || 0,
        area: Number(country.area) || 0,
        languages: Object.values(country.languages || {}),
        currencies: Object.values(country.currencies || {}).map((currency) => ({
          name: currency.name,
          symbol: currency.symbol || ''
        })),
        timezones: country.timezones || [],
        borders: country.borders || [],
        mapUrl: country.maps?.googleMaps || ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.set('Cache-Control', 'public, max-age=300');

    return res.json({
      count: safeCountries.length,
      countries: safeCountries
    });
  } catch (error) {
    next(error);
  }
});

export default router;