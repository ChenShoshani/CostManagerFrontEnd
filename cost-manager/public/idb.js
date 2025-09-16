(function () {
  /**
   * Vanilla IndexedDB wrapper for the Cost Manager app.
   * Exposes a global `idb` object for use in simple HTML tests.
   */
  const DB_NAME = 'costs-db';
  const DB_VERSION = 1;
  const COSTS_STORE = 'costs';

  const DEFAULT_RATES = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };
  const DEFAULT_RATES_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  let db = null;

  /**
   * Normalize incoming JSON from either flat or nested { rates } responses.
   * Maps EUR -> EURO and upper-cases currency codes.
   */
  function normalizeIncomingRates(json) {
    if (!json || typeof json !== 'object') { return {}; }
    var source = (json && typeof json === 'object' && json.rates && typeof json.rates === 'object') ? json.rates : json;
    var out = {};
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        var upper = String(key).toUpperCase();
        var normalizedKey = upper === 'EUR' ? 'EURO' : upper;
        out[normalizedKey] = source[key];
      }
    }
    return out;
  }

  /**
   * openCostsDB(databaseName, databaseVersion)
   * Opens the IndexedDB and stores the reference in a module-scoped variable.
   * Returns a Promise resolving to the DB instance, as per spec.
   */
  function openCostsDB(databaseName, databaseVersion) {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(databaseName || DB_NAME, typeof databaseVersion === 'number' ? databaseVersion : 1);
      request.onupgradeneeded = function (event) {
        const upgradeDb = event.target.result;
        if (!upgradeDb.objectStoreNames.contains(COSTS_STORE)) {
          const store = upgradeDb.createObjectStore(COSTS_STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('byYearMonth', ['year', 'month']);
        }
      };
      request.onerror = function (event) { reject(event.target.error); };
      request.onsuccess = function (event) {
        db = event.target.result;
        resolve(db);
      };
    });
  }

  /**
   * Run a function within a transaction and resolve on completion.
   */
  function withStore(dbInstance, storeName, mode, fn) {
    return new Promise(function (resolve, reject) {
      const tx = dbInstance.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = function () { resolve(result); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  /**
   * Add a cost item; date/year/month are derived from now.
   */
  function addCost(cost) {
    if (!db) { return Promise.reject(new Error('Database not initialized. Call openCostsDB() first.')); }
    const now = new Date();
    const record = {
      sum: cost.sum,
      currency: cost.currency,
      category: cost.category,
      description: cost.description,
      date: now.toISOString(),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
    return withStore(db, COSTS_STORE, 'readwrite', function (store) { return store.add(record); })
      .then(function () {
        return { sum: record.sum, currency: record.currency, category: record.category, description: record.description };
      });
  }

  /**
   * Fetch exchange rates or fall back to defaults.
   */
  function loadRates() {
    return fetch(DEFAULT_RATES_URL, { mode: 'cors' })
      .then(function (r) { if (!r.ok) { throw new Error('status ' + r.status); } return r.json(); })
      .then(function (raw) {
        var normalized = normalizeIncomingRates(raw);
        if (
          typeof normalized.USD === 'number' && isFinite(normalized.USD) && normalized.USD > 0 &&
          typeof normalized.GBP === 'number' && isFinite(normalized.GBP) && normalized.GBP > 0 &&
          typeof normalized.EURO === 'number' && isFinite(normalized.EURO) && normalized.EURO > 0 &&
          typeof normalized.ILS === 'number' && isFinite(normalized.ILS) && normalized.ILS > 0
        ) {
          return { USD: normalized.USD, GBP: normalized.GBP, EURO: normalized.EURO, ILS: normalized.ILS };
        }
        throw new Error('invalid rates json');
      })
      .catch(function (e) { console.error('Failed to load exchange rates. Using defaults.', e); return DEFAULT_RATES; });
  }

  /**
   * Convert `amount` from one currency to another using `rates`.
   */
  function convertAmount(amount, from, to, rates) {
    const r = rates || DEFAULT_RATES;
    const src = r[from];
    const tgt = r[to];
    if (typeof src !== 'number' || typeof tgt !== 'number') {
      return amount;
    }
    return (amount / src) * tgt;
  }

  /**
   * Build a detailed report for a given year/month and currency.
   */
  function getReport(year, month, currency) {
    if (!db) { return Promise.reject(new Error('Database not initialized. Call openCostsDB() first.')); }
    const items = [];
    return withStore(db, COSTS_STORE, 'readonly', function (store) {
      const index = store.index('byYearMonth');
      const range = month ? IDBKeyRange.only([year, month]) : IDBKeyRange.bound([year, 1], [year, 12]);
      const request = index.openCursor(range);
      request.onsuccess = function () {
        const cursor = request.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        }
      };
    }).then(function () {
      return loadRates().then(function (rates) {
        let totalConverted = 0;
        const normalized = items.map(function (c) {
          const d = new Date(c.date);
          const day = d.getDate();
          totalConverted += convertAmount(c.sum, c.currency, currency || 'USD', rates);
          return {
            sum: c.sum,
            currency: c.currency,
            category: c.category,
            description: c.description,
            Date: { day: day },
          };
        });
        return {
          year: year,
          month: month,
          costs: normalized,
          total: { currency: currency || 'USD', total: Number(totalConverted) },
        };
      });
    });
  }

  // Expose global as per spec: `idb` on the global object
  // Support both styles:
  // 1) const db = await idb.openCostsDB(...); await db.addCost(...)
  // 2) await idb.addCost(...); await idb.getReport(...)
  window.idb = { openCostsDB: openCostsDB, addCost: addCost, getReport: getReport };
})();


