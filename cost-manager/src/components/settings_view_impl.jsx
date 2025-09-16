import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { idb } from '../lib/idb.module.js';
import { setRates as setGlobalRates } from '../utils/currency.js';
import { fetchRates } from '../api/exchange_rates.js';
import { SettingsError } from '../utils/errors.js';

const DEFAULT_RATES_URL = 'https://open.er-api.com/v6/latest/USD';

// Validation moved to the API module.

/**
 * SettingsView: allows configuring the exchange rates URL.
 * Validates the URL by fetching JSON and applies rates globally.
 */
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

  /** Fetch the provided URL, validate JSON, save URL and apply rates. */
  const testAndSave = async () => {
    try {
      setError('');
      setSuccess('');
      const candidate = url.trim();
      if (!candidate) {
        setError('Please provide a valid URL.');
        return;
      }
      const json = await fetchRates(candidate);
      await idb.setSetting('exchangeRatesUrl', candidate);
      setGlobalRates(json);
      setRates(json);
      setLastFetch(new Date().toLocaleString());
      setSuccess('Exchange rates URL saved and validated.');
    } catch (e) {
      setError(e?.message || 'Failed to validate and save settings.');
    }
  };

  /** Reset to the default ER-API endpoint. */
  const resetToDefault = async () => {
    try {
      setError('');
      setSuccess('');
      const json = await fetchRates(DEFAULT_RATES_URL);
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
            <Box
              sx={{
                bgcolor: '#fff',
                color: '#000',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ color: 'inherit', mb: 1 }}>Current rates</Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  color: 'inherit',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(rates, null, 2)}
              </Box>
              <Typography variant="caption" sx={{ color: 'inherit', display: 'block', mt: 1 }}>
                Last fetched: {lastFetch}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default SettingsView;


