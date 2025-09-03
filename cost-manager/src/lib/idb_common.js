import { convertAmount } from '../utils/currency.js';

const DB_NAME = 'costs-db';
const DB_VERSION = 1;
const COSTS_STORE = 'costs';
const SETTINGS_STORE = 'settings';

/**
 * Open (and upgrade if needed) the Costs IndexedDB database.
 * @param {string} [name]
 * @param {number} [version]
 * @returns {Promise<IDBDatabase>}
 */
export const openCostsDB = (name = DB_NAME, version = DB_VERSION) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(COSTS_STORE)) {
        const costs = db.createObjectStore(COSTS_STORE, { keyPath: 'id', autoIncrement: true });
        costs.createIndex('byYearMonth', ['year', 'month']);
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Wrap an IndexedDB transaction and resolve on completion.
 * @template T
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => T} fn
 * @returns {Promise<T>}
 */
const withStore = (db, storeName, mode, fn) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

/**
 * Add a new cost item. Date/year/month are derived from now.
 * @param {IDBDatabase} db
 * @param {{sum:number,currency:string,category:string,description:string}} cost
 * @returns {Promise<{sum:number,currency:string,category:string,description:string}>}
 */
export const addCost = async (db, cost) => {
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
  await withStore(db, COSTS_STORE, 'readwrite', (store) => store.add(record));
  return { sum: record.sum, currency: record.currency, category: record.category, description: record.description };
};

/**
 * Get report for month or whole year in a target currency.
 * @param {IDBDatabase} db
 * @param {number} year
 * @param {number|undefined} month
 * @param {string} [currency]
 * @returns {Promise<{year:number,month:number|undefined,costs:Array<any>,total:{currency:string,total:number}}>} 
 */
export const getReport = async (db, year, month, currency = 'USD') => {
  const items = [];
  await withStore(db, COSTS_STORE, 'readonly', (store) => {
    const index = store.index('byYearMonth');
    const range = month ? IDBKeyRange.only([year, month]) : IDBKeyRange.bound([year, 1], [year, 12]);
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      }
    };
  });
  let totalConverted = 0;
  const normalized = items.map((c) => {
    const d = new Date(c.date);
    const day = d.getDate();
    totalConverted += convertAmount(c.sum, c.currency, currency);
    return {
      ...c,
      Date: { day },
    };
  });
  return { year, month, costs: normalized, total: { currency, total: Number(totalConverted) } };
};

/**
 * Convenience wrapper for a yearly report.
 * @param {IDBDatabase} db
 * @param {number} year
 * @param {string} [currency]
 */
export const getYearReport = async (db, year, currency = 'USD') => {
  return getReport(db, year, undefined, currency);
};

export const setSetting = async (db, key, value) =>
  withStore(db, SETTINGS_STORE, 'readwrite', (store) => store.put(value, key));

export const getSetting = async (db, key) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });


