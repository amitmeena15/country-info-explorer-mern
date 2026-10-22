import { useEffect, useMemo, useState } from 'react';
import {
  Globe2,
  Search,
  SlidersHorizontal,
  Users,
  MapPin,
  Heart,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';

const numberFormat = new Intl.NumberFormat('en-US');

const populationRanges = {
  all: { label: 'All populations', min: 0, max: Infinity },
  under1m: { label: 'Under 1 million', min: 0, max: 1000000 },
  '1m-10m': { label: '1M - 10M', min: 1000000, max: 10000000 },
  '10m-100m': { label: '10M - 100M', min: 10000000, max: 100000000 },
  above100m: { label: 'Above 100 million', min: 100000000, max: Infinity }
};

export default function App() {
  const [countries, setCountries] = useState([]);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [region, setRegion] = useState('All regions');
  const [populationFilter, setPopulationFilter] = useState('all');
  const [sort, setSort] = useState('name');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('world-explorer-favorites') || '[]'
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [showFavorites, setShowFavorites] = useState(false);
  const [dark, setDark] = useState(true);

  async function loadCountries() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/countries');

      if (!response.ok) {
        throw new Error(
          'Country data could not be loaded. Please try again.'
        );
      }

      const data = await response.json();

      setCountries(
        Array.isArray(data.countries) ? data.countries : []
      );
    } catch (err) {
      setError(
        err.message || 'Something went wrong while loading countries.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'world-explorer-favorites',
        JSON.stringify(favorites)
      );
    } catch {
      // App remains usable if browser storage is unavailable.
    }
  }, [favorites]);

  const regions = useMemo(() => {
    return [
      'All regions',
      ...new Set(
        countries
          .map((country) => country.region)
          .filter(Boolean)
          .sort()
      )
    ];
  }, [countries]);

  const visibleCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const selectedRange = populationRanges[populationFilter];

    return countries
      .filter((country) => {
        if (!normalizedQuery) return true;

        let searchableFields = [];

        if (searchType === 'name') {
          searchableFields = [country.name];
        } else if (searchType === 'capital') {
          searchableFields = [country.capital];
        } else {
          searchableFields = [
            country.name,
            country.capital,
            country.region,
            country.subregion
          ];
        }

        return searchableFields.some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(normalizedQuery)
        );
      })
      .filter((country) => {
        return (
          region === 'All regions' ||
          country.region === region
        );
      })
      .filter((country) => {
        const population = Number(country.population);

        return (
          Number.isFinite(population) &&
          population >= selectedRange.min &&
          population < selectedRange.max
        );
      })
      .filter((country) => {
        return (
          !showFavorites ||
          favorites.includes(country.code)
        );
      })
      .sort((a, b) => {
        if (sort === 'population') {
          return Number(b.population || 0) -
            Number(a.population || 0);
        }

        if (sort === 'area') {
          return Number(b.area || 0) -
            Number(a.area || 0);
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    countries,
    query,
    searchType,
    region,
    populationFilter,
    sort,
    showFavorites,
    favorites
  ]);

  function toggleFavorite(code) {
    setFavorites((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  function resetFilters() {
    setQuery('');
    setSearchType('all');
    setRegion('All regions');
    setPopulationFilter('all');
    setSort('name');
    setShowFavorites(false);
  }

  const hasActiveFilters =
    query.trim() !== '' ||
    searchType !== 'all' ||
    region !== 'All regions' ||
    populationFilter !== 'all' ||
    sort !== 'name' ||
    showFavorites;

  return (
    <div className={dark ? 'app dark' : 'app light'}>

      {/* HEADER */}
      <header className="topbar">
        <a
          className="brand"
          href="#"
          aria-label="World Explorer home"
        >
          <span className="brand-icon">
            <Globe2 size={22} />
          </span>

          <span>
            World
            <span className="brand-accent">
              Explorer
            </span>
          </span>
        </a>

        <div className="top-actions">
          <button
            className="icon-button"
            onClick={() => setDark((value) => !value)}
            aria-label={
              dark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            className={`favorites-toggle ${
              showFavorites ? 'active' : ''
            }`}
            onClick={() =>
              setShowFavorites((value) => !value)
            }
          >
            <Heart size={16} />
            Favorites
            <span>{favorites.length}</span>
          </button>
        </div>
      </header>

      <main className="main-content">

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              YOUR WINDOW TO THE WORLD
            </p>

            <h1>
              Discover the world,
              <br />
              <span>one country at a time.</span>
            </h1>

            <p className="hero-description">
              Explore countries, uncover fascinating facts,
              and find your next destination.
            </p>
          </div>

          <div className="hero-stat">
            <Globe2 size={22} />

            <div>
              <strong>
                {countries.length || '—'}
              </strong>

              <span>countries to explore</span>
            </div>
          </div>
        </section>

        {/* SEARCH AND FILTERS */}
        <section
          className="toolbar"
          aria-label="Search and filter countries"
        >

          {/* SEARCH INPUT */}
          <label className="search-box">
            <Search size={19} />

            <span className="sr-only">
              Search countries
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search countries..."
            />
          </label>

          {/* SEARCH TYPE */}
          <label className="select-box">
            <span className="sr-only">
              Search by
            </span>

            <select
              value={searchType}
              onChange={(event) =>
                setSearchType(event.target.value)
              }
            >
              <option value="all">
                Search: All Fields
              </option>

              <option value="name">
                Country Name
              </option>

              <option value="capital">
                Capital City
              </option>
            </select>
          </label>

          {/* REGION FILTER */}
          <label className="select-box">
            <SlidersHorizontal size={17} />

            <span className="sr-only">
              Filter by region
            </span>

            <select
              value={region}
              onChange={(event) =>
                setRegion(event.target.value)
              }
            >
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {/* POPULATION FILTER */}
          <label className="select-box">
            <Users size={17} />

            <span className="sr-only">
              Filter by population
            </span>

            <select
              value={populationFilter}
              onChange={(event) =>
                setPopulationFilter(event.target.value)
              }
            >
              {Object.entries(populationRanges).map(
                ([value, range]) => (
                  <option key={value} value={value}>
                    {range.label}
                  </option>
                )
              )}
            </select>
          </label>

          {/* SORT */}
          <label className="select-box">
            <span className="sr-only">
              Sort countries
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="name">
                Sort: A–Z
              </option>

              <option value="population">
                Largest population
              </option>

              <option value="area">
                Largest area
              </option>
            </select>
          </label>

          {/* RESET FILTERS */}
          <button
            type="button"
            className="secondary-button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            <RefreshCw size={16} />
            Reset Filters
          </button>

        </section>

        {/* RESULTS */}
        <div className="results-row">
          <p>
            {showFavorites
              ? 'Your favorite countries'
              : 'Explore countries'}

            <span>
              {' '}({visibleCountries.length} results)
            </span>
          </p>

          <span className="live-label">
            <span />
            LIVE COUNTRY DATA
          </span>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="state-panel">
            <div className="spinner" />

            <h2>Mapping the world...</h2>

            <p>
              Fetching country information for you.
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="state-panel error-panel">
            <h2>
              We couldn't load the countries
            </h2>

            <p>{error}</p>

            <button
              className="primary-button"
              onClick={loadCountries}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {/* NO RESULTS */}
        {!loading &&
          !error &&
          visibleCountries.length === 0 && (
            <div className="state-panel">
              <h2>No countries found</h2>

              <p>
                {showFavorites
                  ? 'No favorite countries match your filters.'
                  : 'Try another search or reset your filters.'}
              </p>

              <button
                className="secondary-button"
                onClick={resetFilters}
              >
                <RefreshCw size={16} />
                Clear filters
              </button>
            </div>
          )}

        {/* COUNTRY CARDS */}
        {!loading &&
          !error &&
          visibleCountries.length > 0 && (
            <section
              className="country-grid"
              aria-label="Country results"
            >
              {visibleCountries.map((country) => {
                const isFavorite = favorites.includes(
                  country.code
                );

                return (
                  <article
                    className="country-card"
                    key={country.code}
                  >
                    <div className="flag-wrap">
                      <img
                        src={country.flag}
                        alt={
                          country.flagAlt ||
                          `Flag of ${country.name}`
                        }
                        loading="lazy"
                      />

                      <span className="region-badge">
                        {country.region || 'Other'}
                      </span>

                      <button
                        className={`favorite-button ${
                          isFavorite ? 'selected' : ''
                        }`}
                        onClick={() =>
                          toggleFavorite(country.code)
                        }
                        aria-label={`${
                          isFavorite ? 'Remove' : 'Add'
                        } ${country.name} ${
                          isFavorite ? 'from' : 'to'
                        } favorites`}
                      >
                        <Heart
                          size={17}
                          fill={
                            isFavorite
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>
                    </div>

                    <div className="country-info">
                      <h2>{country.name}</h2>

                      <p className="capital">
                        <MapPin size={14} />
                        {country.capital || 'N/A'}
                      </p>

                      <div className="card-divider" />

                      <div className="fact-row">
                        <span>
                          <Users size={14} />
                          Population
                        </span>

                        <strong>
                          {numberFormat.format(
                            country.population || 0
                          )}
                        </strong>
                      </div>

                      <div className="fact-row">
                        <span>
                          <Globe2 size={14} />
                          Area
                        </span>

                        <strong>
                          {numberFormat.format(
                            Math.round(country.area || 0)
                          )}{' '}
                          km²
                        </strong>
                      </div>

                      <div className="card-footer">
                        <span>{country.code}</span>

                        <a
                          href={
                            country.mapUrl ||
                            `https://www.google.com/maps/search/${encodeURIComponent(
                              country.name
                            )}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on map ↗
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <Globe2 size={16} />

        <span>
          Made for curious minds.
        </span>

        <span className="footer-dot">
          •
        </span>

        <span>
          World Explorer
        </span>
      </footer>
    </div>
  );
}