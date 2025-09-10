(function () {
  // Constants for IndexedDB database configuration
  const DB_NAME = 'costs-db';
  const DB_VERSION = 1;
  const COSTS_STORE = 'costs';

  // Default exchange rates used as a fallback
  const DEFAULT_RATES = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };

  function openCostsDB(name, version) {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(name || DB_NAME, version || DB_VERSION);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(COSTS_STORE)) {
          const costs = db.createObjectStore(COSTS_STORE, { keyPath: 'id', autoIncrement: true });
          costs.createIndex('byYearMonth', ['year', 'month']);
        }
      };
      request.onerror = function () { reject(request.error); };
      request.onsuccess = function () {
        const db = request.result;
        resolve({
          addCost: function (cost) { return addCost(db, cost); },
          getReport: function (year, month, currency) { return getReport(db, year, month, currency); },
        });
      };
    });
  }

  function withStore(db, storeName, mode, fn) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = function () { resolve(result); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  function addCost(db, cost) {
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

  function loadRates() {
    return fetch('/exchange-rates.json', { mode: 'cors' })
      .then(function (r) { if (!r.ok) { throw new Error('status ' + r.status); } return r.json(); })
      .catch(function (e) { console.error('Failed to load exchange rates. Using defaults.', e); return DEFAULT_RATES; });
  }

  function convertAmount(amount, from, to, rates) {
    const r = rates || DEFAULT_RATES;
    const src = r[from];
    const tgt = r[to];
    if (typeof src !== 'number' || typeof tgt !== 'number') {
      return amount;
    }
    return (amount / src) * tgt;
  }

  function getReport(db, year, month, currency) {
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

  // Expose global as per spec: `db` on the global object
  window.db = { openCostsDB: openCostsDB };
  // Backward compatibility for earlier tests/code that referenced `idb`
  window.idb = window.db;
})();


