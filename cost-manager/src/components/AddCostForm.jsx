import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { idb } from '../lib/idb.module.js';

// AddCostForm: form for adding a new cost item into IndexedDB.
// Validates inputs and shows success/error messages.
const currencies = ['USD', 'ILS', 'GBP', 'EURO'];
const categories = ['Food', 'Travel', 'Health', 'Utilities', 'Entertainment', 'Other'];

const AddCostForm = () => {
  const [form, setForm] = useState({ sum: '', currency: 'USD', category: 'Other', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canSubmit = useMemo(() => Number(form.sum) > 0 && form.description.trim().length > 0, [form]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const sumNum = Number(form.sum);
      if (!Number.isFinite(sumNum) || sumNum <= 0) {
        setError('Sum must be a positive number.');
        return;
      }
      await idb.openCostsDB('costs-db', 1);
      await idb.addCost({
        sum: sumNum,
        currency: form.currency,
        category: form.category,
        description: form.description.trim(),
      });
      setSuccess('Cost saved.');
      setForm({ sum: '', currency: 'USD', category: 'Other', description: '' });
    } catch (e) {
      setError(e?.message || 'Failed to save cost.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={2} direction="column">
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          type="number"
          label="Sum"
          value={form.sum}
          onChange={handleChange('sum')}
          inputProps={{ step: '0.01', min: '0' }}
          required
        />
        <TextField select label="Currency" value={form.currency} onChange={handleChange('currency')}>
          {currencies.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Category" value={form.category} onChange={handleChange('category')}>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Description" value={form.description} onChange={handleChange('description')} />
        <Button type="submit" variant="contained" disabled={!canSubmit}>
          Add Cost
        </Button>
      </Stack>
    </Box>
  );
};

export default AddCostForm;


