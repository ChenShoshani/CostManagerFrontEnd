import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { idb } from '../lib/idb.module.js';
import { supportedCurrencies } from '../utils/currency.js';
import { buildBarSeries, buildPieSeries, chartColors } from '../utils/charts.js';

/**
 * Charts: Pie (by category for selected month) and Bar (totals per month in selected year).
 */
const ChartsView = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [currency, setCurrency] = useState('USD');
  const [monthCosts, setMonthCosts] = useState([]);
  const [yearCosts, setYearCosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        await idb.openCostsDB('costs-db', 1);
        const thisMonth = await idb.getReport(year, month, currency);
        const fullYear = await idb.getYearReport(year, currency);
        setMonthCosts(thisMonth.costs);
        setYearCosts(fullYear.costs);
        setError('');
      } catch (e) {
        setError(e?.message || 'Failed to load data.');
      }
    };
    run();
  }, [year, month, currency]);

  const pieData = useMemo(() => buildPieSeries(monthCosts, currency), [monthCosts, currency]);
  const barData = useMemo(() => buildBarSeries(yearCosts, year, currency), [yearCosts, year, currency]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl fullWidth sx={{ minWidth: 140 }}>
          <InputLabel id="year-label">Year</InputLabel>
          <Select labelId="year-label" label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ minWidth: 140 }}>
          <InputLabel id="month-label">Month</InputLabel>
          <Select labelId="month-label" label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ minWidth: 140 }}>
          <InputLabel id="currency-label">Currency</InputLabel>
          <Select labelId="currency-label" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {supportedCurrencies.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box sx={{ height: 340, mt: 3 }}>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ${currency}`} />
            <Legend />
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ height: 360, mt: 3 }}>
        <ResponsiveContainer>
          <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ${currency}`} />
            <Legend />
            <Bar dataKey="total" name={`Total (${currency})`} fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ChartsView;


