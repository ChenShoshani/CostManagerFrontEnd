import React, { useState } from 'react';
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import AddCostForm from './components/AddCostForm.jsx';
import ReportView from './components/ReportView.jsx';
import ChartsView from './components/ChartsView.jsx';
import SettingsView from './components/SettingsView.jsx';
import { useExchangeRates } from './hooks/use_exchange_rates.js';

/**
 * App
 * Top-level shell that provides simple navigation between the four views
 * (Add, Report, Charts, Settings). On mount, it initializes exchange
 * rates via the `useExchangeRates` hook so that conversions work across
 * the app.
 */
const App = () => {
  const [view, setView] = useState('add');
  const { error } = useExchangeRates();

  const renderView = () => {
    switch (view) {
      case 'add':
        return <AddCostForm />;
      case 'report':
        return <ReportView />;
      case 'charts':
        return <ChartsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AddCostForm />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Cost Manager
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={() => setView('add')} aria-label="Add">
              Add
            </Button>
            <Button color="inherit" onClick={() => setView('report')} aria-label="Report">
              Report
            </Button>
            <Button color="inherit" onClick={() => setView('charts')} aria-label="Charts">
              Charts
            </Button>
            <Button color="inherit" onClick={() => setView('settings')} aria-label="Settings">
              Settings
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2 }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {renderView()}
      </Container>
    </Box>
  );
};

export default App;

 