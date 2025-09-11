import { convertAmount } from './currency.js';

export const chartColors = [
  '#1976d2',
  '#9c27b0',
  '#ef6c00',
  '#2e7d32',
  '#d32f2f',
  '#00796b',
  '#5d4037',
  '#455a64',
];

/**
 * Aggregate costs by category for a pie chart, converting to the display currency.
 */
export const buildPieSeries = (costs, currency) => {
  const byCategory = {};
  for (const c of costs) {
    const converted = convertAmount(c.sum, c.currency, currency);
    byCategory[c.category] = (byCategory[c.category] || 0) + converted;
  }
  return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
};

/**
 * Aggregate costs per month for a bar chart, converting to the display currency.
 */
export const buildBarSeries = (costs, year, currency) => {
  const byMonth = Array(12).fill(0);
  for (const c of costs) {
    if (c.year !== year) {
      continue;
    }
    const converted = convertAmount(c.sum, c.currency, currency);
    byMonth[c.month - 1] += converted;
  }
  return byMonth.map((total, i) => ({ month: i + 1, total }));
};


