(function () {
  const DB_NAME = 'costs-db';
  const DB_VERSION = 1;
  const COSTS_STORE = 'costs';
  const SETTINGS_STORE = 'settings';

  const openCostsDB = function (name, version) {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open(name || DB_NAME, version || DB_VERSION);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(COSTS_STORE)) {
          const costs = db.createObjectStore(COSTS_STORE, { keyPath: 'id', autoIncrement: true });
          costs.createIndex('byYearMonth', ['year', 'month']);
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      };
      request.onerror = function () { reject(request.error); };
      request.onsuccess = function () { resolve(request.result); };
    });
  };

  const withStore = function (db, storeName, mode, fn) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = function () { resolve(result); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  };

  const addCost = function (db, cost) {
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
    return withStore(db, COSTS_STORE, 'readwrite', function (store) { return store.add(record); }).then(function () {
      return { sum: record.sum, currency: record.currency, category: record.category, description: record.description };
    });
  };

  // Default rates used for conversion if nothing else is available
  var DEFAULT_RATES = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };

  function convertAmount(amount, from, to, rates) {
    var r = rates || DEFAULT_RATES;
    var src = r[from];
    var tgt = r[to];
    if (typeof src !== 'number' || typeof tgt !== 'number') {
      return amount;
    }
    return (amount / src) * tgt;
  }

  const getReport = function (db, year, month, currency) {
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
      var totalConverted = 0;
      var normalized = items.map(function (c) {
        var d = new Date(c.date);
        var day = d.getDate();
        totalConverted += convertAmount(c.sum, c.currency, currency || 'USD', DEFAULT_RATES);
        return {
          sum: c.sum,
          currency: c.currency,
          category: c.category,
          description: c.description,
          date: c.date,
          year: c.year,
          month: c.month,
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
  };

  const getYearReport = function (db, year, currency) {
    return getReport(db, year, undefined, currency);
  };

  const setSetting = function (db, key, value) {
    return withStore(db, SETTINGS_STORE, 'readwrite', function (store) { return store.put(value, key); });
  };

  const getSetting = function (db, key) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const req = store.get(key);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  };

  var api = {
    openCostsDB: openCostsDB,
    addCost: function (cost) {
      return openCostsDB(DB_NAME, DB_VERSION).then(function (db) { return addCost(db, cost); });
    },
    getReport: function (year, month, currency) {
      return openCostsDB(DB_NAME, DB_VERSION).then(function (db) { return getReport(db, year, month, currency); });
    },
    getYearReport: function (year, currency) {
      return openCostsDB(DB_NAME, DB_VERSION).then(function (db) { return getYearReport(db, year, currency); });
    },
    setSetting: function (key, value) {
      return openCostsDB(DB_NAME, DB_VERSION).then(function (db) { return setSetting(db, key, value); });
    },
    getSetting: function (key) {
      return openCostsDB(DB_NAME, DB_VERSION).then(function (db) { return getSetting(db, key); });
    },
  };
  // Per requirement, expose as `db` on the global object. Keep `idb` for backward-compatibility.
  window.db = api;
  window.idb = api;
})();


