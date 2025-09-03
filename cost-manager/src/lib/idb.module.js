import { openCostsDB as coreOpen, addCost as coreAdd, getReport as coreReport, getYearReport as coreYearReport, setSetting as coreSetSetting, getSetting as coreGetSetting } from './idb_common.js';

/**
 * Thin wrapper class that keeps a single open DB instance
 * and exposes convenient async methods for app usage.
 */
class CostsDB {
  constructor() {
    this.db = null;
  }

  async openCostsDB(name, version) {
    this.db = await coreOpen(name, version);
    return this.db;
  }

  async addCost(cost) {
    if (!this.db) {
      await this.openCostsDB('costs-db', 1);
    }
    return coreAdd(this.db, cost);
  }

  async getReport(year, month, currency) {
    if (!this.db) {
      await this.openCostsDB('costs-db', 1);
    }
    return coreReport(this.db, year, month, currency);
  }

  async getYearReport(year, currency) {
    if (!this.db) {
      await this.openCostsDB('costs-db', 1);
    }
    return coreYearReport(this.db, year, currency);
  }

  async setSetting(key, value) {
    if (!this.db) {
      await this.openCostsDB('costs-db', 1);
    }
    return coreSetSetting(this.db, key, value);
  }

  async getSetting(key) {
    if (!this.db) {
      await this.openCostsDB('costs-db', 1);
    }
    return coreGetSetting(this.db, key);
  }
}

export const idb = new CostsDB();
export { coreOpen as openCostsDB };


