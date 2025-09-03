import React, { useMemo, useState } from 'react';
import { CssBaseline, AppBar, Tabs, Tab, Toolbar, Typography, Box, Container, Alert } from '@mui/material';
import AddCostForm from './components/add_cost_form.jsx';
import ReportView from './components/report_view.jsx';
import ChartsView from './components/charts_view.jsx';
import SettingsView from './components/settings_view.jsx';
import { useExchangeRates } from './hooks/use_exchange_rates.js';

const TabPanel = ({ children, index, value }) => {
  if (value !== index) {
    return null;
  }
  return <Box sx={{ py: 2 }}>{children}</Box>;
};

export default function App() {
  const [tab, setTab] = useState(0);
  const ratesState = useExchangeRates();
  const handleChange = (_event, newValue) => {
    setTab(newValue);
  };

  const tabs = useMemo(
    () => [
      { label: 'Add Cost', component: <AddCostForm /> },
      { label: 'Report', component: <ReportView /> },
      { label: 'Charts', component: <ChartsView /> },
      { label: 'Settings', component: <SettingsView /> },
    ],
    [],
  );

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Cost Manager
          </Typography>
          <Tabs value={tab} onChange={handleChange} textColor="inherit" indicatorColor="secondary">
            {tabs.map((t, i) => (
              <Tab key={t.label} label={t.label} id={`nav-${i}`} />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        {ratesState.error && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning">{ratesState.error}</Alert>
          </Box>
        )}
        {tabs.map((t, i) => (
          <TabPanel key={t.label} index={i} value={tab}>
            {t.component}
          </TabPanel>
        ))}
      </Container>
    </>
  );
}


