import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppStepWorkflow } from './pages/AppStepWorkflow';
import { createAppTheme } from './theme';
import { ErrorBoundary } from './components/ErrorBoundary';

const el = document.getElementById('root')!;
function Root() {
  // Use light mode only
  const appTheme = useMemo(() => createAppTheme('light'), []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppStepWorkflow />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

createRoot(el).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
