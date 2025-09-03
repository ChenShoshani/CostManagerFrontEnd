import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from '@mui/material';
import { idb } from '../lib/idb.module.js';
import { convertAmount, supportedCurrencies } from '../utils/currency.js';

const yearsAround = () => {
  const now = new Date();
  const y = now.getFullYear();
  return [y - 2, y - 1, y, y + 1];
};

/**
 * Report table for a selected month/year with on-the-fly currency conversion.
 */
const ReportView = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [currency, setCurrency] = useState('USD');
  const [data, setData] = useState({ costs: [], total: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        await idb.openCostsDB('costs-db', 1);
        const report = await idb.getReport(year, month, currency);
        setData(report);
        setError('');
      } catch (e) {
        setError(e?.message || 'Failed to load report.');
      }
    };
    run();
  }, [year, month, currency]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl fullWidth sx={{ minWidth: 140 }}>
          <InputLabel id="year-label">Year</InputLabel>
          <Select labelId="year-label" label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            {yearsAround().map((y) => (
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

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Converted ({currency})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.costs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography className="empty-state">No items for selection.</Typography>
                </TableCell>
              </TableRow>
            )}
            {data.costs.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                <TableCell>{c.category}</TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell align="right">{`${c.sum.toFixed(2)} ${c.currency}`}</TableCell>
                <TableCell align="right">{`${convertAmount(c.sum, c.currency, currency).toFixed(2)} ${currency}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right">
                {`${data.costs.reduce((acc, c) => acc + convertAmount(c.sum, c.currency, currency), 0).toFixed(2)} ${currency}`}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportView;


