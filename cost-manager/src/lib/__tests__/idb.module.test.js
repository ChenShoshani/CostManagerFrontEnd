import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { idb } from '../../lib/idb.module.js';

describe('idb.module', () => {
  beforeEach(async () => {
    await idb.openCostsDB('test-db', 1);
  });

  it('adds and reports costs', async () => {
    await idb.addCost({ sum: 10, currency: 'USD', category: 'Other', description: 'A' });
    await idb.addCost({ sum: 15, currency: 'USD', category: 'Food', description: 'B' });
    const now = new Date();
    const report = await idb.getReport(now.getFullYear(), now.getMonth() + 1, 'USD');
    expect(report.costs.length).toBeGreaterThanOrEqual(2);
    expect(report.total.total).toBeGreaterThanOrEqual(25);
  });
});


