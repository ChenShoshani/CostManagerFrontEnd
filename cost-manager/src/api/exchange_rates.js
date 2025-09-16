/**
 * Exchange rates API module.
 * Handles fetching and validating exchange-rate JSON from a URL.
 */

const REQUIRED_KEYS = ['USD', 'GBP', 'EURO', 'ILS'];

/**
 * Normalize an incoming JSON (from flat or nested { rates }) into a plain map
 * with upper-cased currency codes and EUR mapped to EURO.
 * Returns the normalized object without validating values.
 * @param {any} json
 * @returns {Record<string, any>}
 */
const normalizeIncomingRates = (json) => {
  if (!json || typeof json !== 'object') {
    return {};
  }
  const source = json && typeof json === 'object' && json.rates && typeof json.rates === 'object' ? json.rates : json;
  const out = {};
  for (const key of Object.keys(source)) {
    const upper = String(key).toUpperCase();
    const normalizedKey = upper === 'EUR' ? 'EURO' : upper;
    out[normalizedKey] = source[key];
  }
  return out;
};

/**
 * Validate that the given object is a proper exchange rates map.
 * @param {any} json
 * @returns {boolean}
 */
export const isValidRatesJson = (json) => {
  const normalized = normalizeIncomingRates(json);
  for (const key of REQUIRED_KEYS) {
    const value = normalized[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return false;
    }
  }
  return true;
};

/**
 * Fetch JSON from the provided URL and validate it as exchange rates.
 * @param {string} url
 * @returns {Promise<Record<string, number>>}
 */
export const fetchRates = async (url) => {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    const error = new Error(`Failed to fetch rates. Status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const raw = await response.json();
  const normalized = normalizeIncomingRates(raw);
  // Validate the presence and correctness of required keys after normalization
  for (const key of REQUIRED_KEYS) {
    const value = normalized[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      const error = new Error('Invalid rates JSON. Expect keys USD, GBP, EURO, ILS with numeric values.');
      error.code = 'INVALID_RATES_JSON';
      error.payload = { json: raw };
      throw error;
    }
  }
  // Return only the required normalized keys
  return {
    USD: normalized.USD,
    GBP: normalized.GBP,
    EURO: normalized.EURO,
    ILS: normalized.ILS,
  };
};

/**
 * Try fetching rates from a candidate URL, and if it fails, fall back to default.
 * Returns the json and the effective url actually used.
 * @param {string|undefined} candidateUrl
 * @param {string} defaultUrl
 * @returns {Promise<{ json: Record<string, number>, url: string }>}
 */
export const fetchRatesWithFallback = async (candidateUrl, defaultUrl) => {
  const primary = candidateUrl || defaultUrl;
  try {
    const json = await fetchRates(primary);
    return { json, url: primary };
  } catch (primaryError) {
    if (candidateUrl) {
      const json = await fetchRates(defaultUrl);
      return { json, url: defaultUrl };
    }
    throw primaryError;
  }
};


