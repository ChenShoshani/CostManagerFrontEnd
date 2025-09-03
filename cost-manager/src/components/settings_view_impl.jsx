import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { idb } from '../lib/idb.module.js';
import { setRates as setGlobalRates } from '../utils/currency.js';
import { SettingsError } from '../utils/errors.js';

const DEFAULT_RATES_URL = '/exchange-rates.json';

const isValidRates = (json) => {
  if (!json || typeof json !== 'object') {
    return false;
  }
  const keys = ['USD', 'GBP', 'EURO', 'ILS'];
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(json, k)) {
      return false;
    }
    const v = json[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      return false;
    }
  }
  return true;
};

const SettingsView = () => {
  const [url, setUrl] = useState('');
  const [rates, setRates] = useState(null);
  const [lastFetch, setLastFetch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        await idb.openCostsDB('costs-db', 1);
        const existing = await idb.getSetting('exchangeRatesUrl');
        setUrl(existing || DEFAULT_RATES_URL);
      } catch (e) {
        setError(e?.message || 'Failed to load settings.');
      }
    };
    run();
  }, []);

  const testAndSave = async () => {
    try {
      setError('');
      setSuccess('');
      const candidate = url.trim();
      if (!candidate) {
        setError('Please provide a valid URL.');
        return;
      }
      const response = await fetch(candidate, { mode: 'cors' });
      if (!response.ok) {
        throw new SettingsError('RATES_FETCH_FAILED', `Failed to fetch rates. Status ${response.status}`, { status: response.status });
      }
      const json = await response.json();
      if (!isValidRates(json)) {
        throw new SettingsError('INVALID_RATES_JSON', 'Invalid rates JSON. Expect keys USD, GBP, EURO, ILS with numeric values.', { json });
      }
      await idb.setSetting('exchangeRatesUrl', candidate);
      setGlobalRates(json);
      setRates(json);
      setLastFetch(new Date().toLocaleString());
      setSuccess('Exchange rates URL saved and validated.');
    } catch (e) {
      setError(e?.message || 'Failed to validate and save settings.');
    }
  };

  const resetToDefault = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await fetch(DEFAULT_RATES_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new SettingsError('RATES_FETCH_FAILED', `Failed to fetch rates. Status ${response.status}`, { status: response.status });
      }
      const json = await response.json();
      if (!isValidRates(json)) {
        throw new SettingsError('INVALID_RATES_JSON', 'Invalid rates JSON. Expect keys USD, GBP, EURO, ILS with numeric values.', { json });
      }
      await idb.setSetting('exchangeRatesUrl', DEFAULT_RATES_URL);
      setUrl(DEFAULT_RATES_URL);
      setGlobalRates(json);
      setRates(json);
      setLastFetch(new Date().toLocaleString());
      setSuccess('Reset to default completed.');
    } catch (e) {
      setError(e?.message || 'Failed to reset to default.');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="Exchange rates URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button variant="contained" onClick={testAndSave}>
          Test & Save
        </Button>
        <Button variant="text" onClick={resetToDefault}>
          Reset to default
        </Button>
        {rates && (
          <Box>
            <Typography variant="subtitle1">Current rates</Typography>
            <pre>{JSON.stringify(rates, null, 2)}</pre>
            <Typography variant="caption">Last fetched: {lastFetch}</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default SettingsView;


