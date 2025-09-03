import { useEffect, useState } from 'react';
import { idb } from '../lib/idb.module.js';
import { setRates } from '../utils/currency.js';

const DEFAULT_RATES_URL = '/exchange-rates.json';

const isValidRates = (json) => {
  if (!json || typeof json !== 'object') {
    return false;
  }
  const keys = ['USD', 'GBP', 'EURO', 'ILS'];
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(json, k)) {
      return false;
    }
    const v = json[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return false;
    }
  }
  return true;
};

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

        const fetchRatesWithFallback = async (candidateUrl) => {
          const primary = candidateUrl || DEFAULT_RATES_URL;
          try {
            const r1 = await fetch(primary, { mode: 'cors' });
            if (!r1.ok) {
              throw new Error(`status ${r1.status}`);
            }
            const json = await r1.json();
            if (!isValidRates(json)) {
              throw new Error('Invalid rates JSON schema');
            }
            if (!candidateUrl) {
              await idb.setSetting('exchangeRatesUrl', DEFAULT_RATES_URL);
            }
            return { json, url: primary };
          } catch (e) {
            if (candidateUrl) {
              const r2 = await fetch(DEFAULT_RATES_URL, { mode: 'cors' });
              if (!r2.ok) {
                throw new Error(`fallback status ${r2.status}`);
              }
              const json2 = await r2.json();
              if (!isValidRates(json2)) {
                throw new Error('Invalid rates JSON schema');
              }
              await idb.setSetting('exchangeRatesUrl', DEFAULT_RATES_URL);
              return { json: json2, url: DEFAULT_RATES_URL };
            }
            throw e;
          }
        };

        const { json, url: effectiveUrl } = await fetchRatesWithFallback(savedUrl);
        setRates(json);
        setUrl(effectiveUrl);
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


