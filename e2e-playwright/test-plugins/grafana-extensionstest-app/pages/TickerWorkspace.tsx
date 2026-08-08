import { useEffect, useMemo, useState } from 'react';

import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Stack } from '@grafana/ui';

import { testIds } from '../testIds';

const WATCHLIST_STORAGE_KEY = 'grafana-extensionstest-app:ticker-watchlist';
const FAVORITES_STORAGE_KEY = 'grafana-extensionstest-app:ticker-favorites';
const RECENT_SEARCH_STORAGE_KEY = 'grafana-extensionstest-app:ticker-recent-searches';
const COMPARISON_STORAGE_KEY = 'grafana-extensionstest-app:ticker-comparison';
const MAX_RECENT_SEARCHES = 8;

type TickerSnapshot = {
  symbol: string;
  company: string;
  price: number;
  changePct: number;
  volume: string;
};

const TICKERS: Record<string, TickerSnapshot> = {
  AAPL: { symbol: 'AAPL', company: 'Apple', price: 196.25, changePct: 0.84, volume: '58.1M' },
  AMZN: { symbol: 'AMZN', company: 'Amazon', price: 184.18, changePct: -0.66, volume: '44.3M' },
  GOOGL: { symbol: 'GOOGL', company: 'Alphabet', price: 158.49, changePct: 1.12, volume: '29.4M' },
  META: { symbol: 'META', company: 'Meta', price: 490.33, changePct: 0.43, volume: '19.6M' },
  MSFT: { symbol: 'MSFT', company: 'Microsoft', price: 425.77, changePct: 0.55, volume: '26.8M' },
  NFLX: { symbol: 'NFLX', company: 'Netflix', price: 639.04, changePct: -0.21, volume: '7.2M' },
  NVDA: { symbol: 'NVDA', company: 'NVIDIA', price: 903.56, changePct: 1.97, volume: '38.7M' },
  TSLA: { symbol: 'TSLA', company: 'Tesla', price: 171.74, changePct: -1.1, volume: '112.3M' },
};

function readStringArray(key: string): string[] {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return [];
    }
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writeStringArray(key: string, value: string[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getTicker(symbol: string) {
  return TICKERS[symbol.toUpperCase()];
}

function asSuggestion(symbol: string) {
  const ticker = getTicker(symbol);
  if (!ticker) {
    return symbol;
  }
  return `${ticker.symbol} — ${ticker.company}`;
}

export function TickerWorkspace() {
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(() => readStringArray(WATCHLIST_STORAGE_KEY));
  const [favorites, setFavorites] = useState<string[]>(() => readStringArray(FAVORITES_STORAGE_KEY));
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readStringArray(RECENT_SEARCH_STORAGE_KEY));
  const [comparison, setComparison] = useState<string[]>(() => readStringArray(COMPARISON_STORAGE_KEY));

  useEffect(() => {
    writeStringArray(WATCHLIST_STORAGE_KEY, watchlist);
  }, [watchlist]);

  useEffect(() => {
    writeStringArray(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites]);

  useEffect(() => {
    writeStringArray(RECENT_SEARCH_STORAGE_KEY, recentSearches);
  }, [recentSearches]);

  useEffect(() => {
    writeStringArray(COMPARISON_STORAGE_KEY, comparison);
  }, [comparison]);

  useEffect(() => {
    setFavorites((current) => current.filter((symbol) => watchlist.includes(symbol)));
    setComparison((current) => current.filter((symbol) => watchlist.includes(symbol)));
  }, [watchlist]);

  const comparisonTickers = useMemo(() => comparison.map(getTicker).filter(Boolean), [comparison]);

  const addRecentSearch = (symbol: string) => {
    setRecentSearches((current) => [symbol, ...current.filter((value) => value !== symbol)].slice(0, MAX_RECENT_SEARCHES));
  };

  const addToWatchlist = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      return;
    }
    setWatchlist((current) => [...current, symbol]);
  };

  const resolveSymbol = (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (getTicker(normalized)) {
      return normalized;
    }
    const match = Object.values(TICKERS).find(
      (ticker) => ticker.company.toLowerCase() === value.trim().toLowerCase() || ticker.symbol === normalized
    );
    return match?.symbol;
  };

  const handleAdd = () => {
    const symbol = resolveSymbol(query);
    if (!symbol) {
      setErrorMessage('Enter a valid ticker symbol (for example: AAPL, MSFT, NVDA).');
      return;
    }

    addToWatchlist(symbol);
    addRecentSearch(symbol);
    setErrorMessage('');
    setQuery(symbol);
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites((current) =>
      current.includes(symbol) ? current.filter((value) => value !== symbol) : [...current, symbol]
    );
  };

  const toggleComparison = (symbol: string) => {
    setComparison((current) =>
      current.includes(symbol) ? current.filter((value) => value !== symbol) : [...current, symbol]
    );
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((current) => current.filter((value) => value !== symbol));
  };

  return (
    <PluginPage>
      <Stack direction="column" gap={2} data-testid={testIds.tickerWorkspace.container}>
        <h3>Ticker Workspace</h3>
        <p>
          Save tickers, star favorites, and compare symbols side-by-side. Data is persisted in localStorage for
          session-to-session recall.
        </p>

        <section>
          <label htmlFor="ticker-search-input">
            <strong>Ticker search</strong>
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              id="ticker-search-input"
              list="recent-ticker-searches"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search ticker (AAPL, MSFT, NVDA...)"
              style={{ minWidth: '320px', padding: '8px' }}
              data-testid={testIds.tickerWorkspace.searchInput}
            />
            <Button type="button" onClick={handleAdd} data-testid={testIds.tickerWorkspace.addButton}>
              Add to watchlist
            </Button>
          </div>
          <datalist id="recent-ticker-searches">
            {recentSearches.map((symbol) => (
              <option key={symbol} value={symbol}>
                {asSuggestion(symbol)}
              </option>
            ))}
          </datalist>
          {errorMessage && (
            <Alert severity="warning" title={errorMessage}>
              <span>Use one of: {Object.keys(TICKERS).join(', ')}</span>
            </Alert>
          )}
          <div style={{ marginTop: '8px' }}>
            <strong>Recent searches:</strong>{' '}
            {recentSearches.length === 0 ? (
              <span>None yet</span>
            ) : (
              recentSearches.map((symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => setQuery(symbol)}
                  style={{ marginRight: '8px' }}
                  data-testid={`${testIds.tickerWorkspace.recentSearchButtonPrefix}${symbol}`}
                >
                  {symbol}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <strong>Favorites</strong>
          <div style={{ marginTop: '8px' }}>
            {favorites.length === 0 ? (
              <span>No favorites selected.</span>
            ) : (
              favorites.map((symbol) => (
                <button
                  type="button"
                  key={symbol}
                  onClick={() => setQuery(symbol)}
                  style={{ marginRight: '8px' }}
                  data-testid={`${testIds.tickerWorkspace.favoriteQuickButtonPrefix}${symbol}`}
                >
                  {symbol}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <strong>Saved watchlist</strong>
          {watchlist.length === 0 ? (
            <p>No tickers saved yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {watchlist.map((symbol) => {
                const ticker = getTicker(symbol);
                if (!ticker) {
                  return null;
                }
                const favorite = favorites.includes(symbol);
                const selectedForComparison = comparison.includes(symbol);
                return (
                  <li
                    key={symbol}
                    style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    data-testid={`${testIds.tickerWorkspace.watchlistItemPrefix}${symbol}`}
                  >
                    <span style={{ minWidth: '180px' }}>
                      {ticker.symbol} — {ticker.company}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(symbol)}
                      data-testid={`${testIds.tickerWorkspace.favoriteButtonPrefix}${symbol}`}
                    >
                      {favorite ? 'Unstar' : 'Star'}
                    </button>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedForComparison}
                        onChange={() => toggleComparison(symbol)}
                        data-testid={`${testIds.tickerWorkspace.compareCheckboxPrefix}${symbol}`}
                      />{' '}
                      Compare
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFromWatchlist(symbol)}
                      data-testid={`${testIds.tickerWorkspace.removeButtonPrefix}${symbol}`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <strong>Comparison view</strong>
          {comparisonTickers.length < 2 ? (
            <p data-testid={testIds.tickerWorkspace.comparisonHint}>
              Select at least two tickers from the watchlist to compare side-by-side.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
                marginTop: '10px',
              }}
              data-testid={testIds.tickerWorkspace.comparisonGrid}
            >
              {comparisonTickers.map((ticker) => (
                <article
                  key={ticker.symbol}
                  style={{ border: '1px solid #666', borderRadius: '4px', padding: '10px' }}
                  data-testid={`${testIds.tickerWorkspace.comparisonCardPrefix}${ticker.symbol}`}
                >
                  <h4 style={{ margin: '0 0 8px 0' }}>{ticker.symbol}</h4>
                  <div>{ticker.company}</div>
                  <div>Price: ${ticker.price.toFixed(2)}</div>
                  <div style={{ color: ticker.changePct >= 0 ? '#299c46' : '#d44a3a' }}>
                    Daily change: {ticker.changePct > 0 ? '+' : ''}
                    {ticker.changePct.toFixed(2)}%
                  </div>
                  <div>Volume: {ticker.volume}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </Stack>
    </PluginPage>
  );
}
