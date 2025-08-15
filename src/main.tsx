import React, { createContext, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { App } from './pages/App';
import { createAppTheme } from './theme';

export const ThemeModeContext = createContext<{
  mode: 'light' | 'dark';
  setMode: (m: 'light' | 'dark') => void;
}>({ mode: 'dark', setMode: () => {} });

const el = document.getElementById('root')!;
function Root() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark'); // default to dark
  const appTheme = useMemo(() => createAppTheme(mode), [mode]);

  // Apply data-theme attribute for CSS to pick up dark overrides
  React.useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', mode);
    } catch {
      // ignore in SSR/non-browser
    }
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
  <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

createRoot(el).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
