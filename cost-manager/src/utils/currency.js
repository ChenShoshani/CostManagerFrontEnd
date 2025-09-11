export const supportedCurrencies = ['USD', 'ILS', 'GBP', 'EURO'];
import { CurrencyError } from './errors.js';

let currentRates = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };

/**
 * Replace the current in-memory exchange rates after validation.
 */
export const setRates = (rates) => {
  const keys = ['USD', 'GBP', 'EURO', 'ILS'];
  for (const key of keys) {
    if (typeof rates[key] !== 'number' || !Number.isFinite(rates[key]) || rates[key] <= 0) {
      throw new CurrencyError('INVALID_RATE_VALUES', 'Invalid rate values.', { key, value: rates[key] });
    }
  }
  currentRates = { ...rates };
};

/**
 * Return a copy of the currently effective exchange rates.
 */
export const getRates = () => ({ ...currentRates });

/**
 * Convert an amount from sourceCurrency to targetCurrency using current rates.
 */
export const convertAmount = (amount, sourceCurrency, targetCurrency) => {
  const rates = currentRates;
  if (!supportedCurrencies.includes(sourceCurrency) || !supportedCurrencies.includes(targetCurrency)) {
    throw new CurrencyError('UNSUPPORTED_CURRENCY', 'Unsupported currency', { sourceCurrency, targetCurrency });
  }
  const srcRate = rates[sourceCurrency];
  const tgtRate = rates[targetCurrency];
  return (amount / srcRate) * tgtRate;
};


