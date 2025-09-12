import { useEffect, useState } from 'react';
import { idb } from '../lib/idb.module.js';
import { setRates } from '../utils/currency.js';
import { fetchRatesWithFallback } from '../api/exchange_rates.js';

const DEFAULT_RATES_URL = '/exchange-rates.json';

// Validation and fetching are handled by the API module now.

/**
 * useExchangeRates
 * Loads the exchange rates from a saved URL (or default),
 * validates them, applies them to the global currency module,
 * and persists the effective URL in settings.
 */
export const useExchangeRates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await idb.openCostsDB('costs-db', 1);
        const savedUrl = await idb.getSetting('exchangeRatesUrl');

        // Use the API module to fetch with fallback
        const { json, url: effectiveUrl } = await fetchRatesWithFallback(savedUrl, DEFAULT_RATES_URL);
        setRates(json);
        setUrl(effectiveUrl);
        // Persist the effective URL if it differs or wasn't set
        if (!savedUrl || savedUrl !== effectiveUrl) {
          await idb.setSetting('exchangeRatesUrl', effectiveUrl);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load exchange rates.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { loading, error, url };
};


