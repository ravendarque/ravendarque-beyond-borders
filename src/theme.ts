import { createTheme, ThemeOptions } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

export function createAppTheme(mode: 'light' | 'dark') {
  const lightBg = '#f8fafc';
  const darkBg = '#121212'; // closer to MUI dark background
  const primary = '#f97316'; // soft orange

  const options: ThemeOptions = {
    palette: {
      mode,
      primary: { main: primary },
      background: { default: mode === 'light' ? lightBg : darkBg, paper: mode === 'light' ? '#ffffff' : grey[900] },
      text: { primary: mode === 'light' ? '#0f172a' : grey[100], secondary: mode === 'light' ? '#6b7280' : grey[400] },
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
            backgroundColor: '#000000 !important',
            margin: 0,
            color: '#ffffff !important',
            fontFamily:
              'monospace, ui-monospace, "Cascadia Code", "Courier New", Courier !important',
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'center !important',
            minHeight: '100vh !important',
            padding: '20px !important',
          },
          '@media (max-width: 350px)': {
            body: {
              padding: '10px !important',
            },
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
