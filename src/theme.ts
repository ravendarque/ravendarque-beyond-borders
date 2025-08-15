import { createTheme, ThemeOptions } from '@mui/material/styles';

export function createAppTheme(mode: 'light' | 'dark') {
  const lightBg = '#f8fafc';
  const darkBg = '#0b1220';
  const primary = '#f97316'; // soft orange

  const options: ThemeOptions = {
    palette: {
      mode,
      primary: { main: primary },
      background: { default: mode === 'light' ? lightBg : darkBg, paper: mode === 'light' ? '#ffffff' : '#071022' },
      text: { primary: mode === 'light' ? '#0f172a' : '#e6eef3', secondary: mode === 'light' ? '#6b7280' : '#9aa4b2' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': {
            boxSizing: 'border-box',
          },
          html: {
            height: '100%',
          },
          'html, body, #root': {
            height: '100%',
          },
          body: {
            backgroundColor: mode === 'light' ? lightBg : darkBg,
            margin: 0,
            color: mode === 'light' ? '#0f172a' : '#e6eef3',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          },
          // focus ring for form controls
          'select:focus, input[type=range]:focus, input[type=color]:focus, input[type=file]:focus, button:focus': {
            outline: 'none',
            boxShadow: `0 0 0 4px rgba(249,115,22,0.12)`,
            borderColor: primary,
          },
          '.visually-hidden': {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          },
        },
      },
    },
  };

  return createTheme(options);
}

export default createAppTheme('light');
