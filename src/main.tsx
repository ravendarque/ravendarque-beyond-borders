import React, { createContext, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { App } from './pages/App';
import { createAppTheme } from './theme';
import { ErrorBoundary } from './components/ErrorBoundary';

export const ThemeModeContext = createContext<{
  mode: 'light' | 'dark';
  setMode: (m: 'light' | 'dark') => void;
}>({ mode: 'dark', setMode: () => {} });

const el = document.getElementById('root')!;
function Root() {
  // Initialize theme mode from localStorage when available, default to 'dark'.
  const getInitialMode = () => {
    try {
      const stored = localStorage.getItem('bb:mode');
      return stored === 'light' || stored === 'dark' ? (stored as 'light' | 'dark') : 'dark';
    } catch {
      return 'dark';
    }
  };

  const [modeState, setModeState] = useState<'light' | 'dark'>(getInitialMode);
  const appTheme = useMemo(() => createAppTheme(modeState), [modeState]);

  // wrapper that persists to localStorage
  const setMode = (m: 'light' | 'dark') => {
    try {
      localStorage.setItem('bb:mode', m);
    } catch {
      // ignore storage errors
    }
    setModeState(m);
  };

  // Apply data-theme attribute for CSS to pick up dark overrides
  React.useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', modeState);
    } catch {
      // ignore in SSR/non-browser
    }
  }, [modeState]);

  return (
    <ThemeModeContext.Provider value={{ mode: modeState, setMode }}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

createRoot(el).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
