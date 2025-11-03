import { createTheme, ThemeOptions } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

export function createAppTheme(mode: 'light' | 'dark') {
  // New design tokens from design-03.svg
  const lightBg = '#D9D3CD'; // Beige/tan background
  const darkBg = '#121212'; // closer to MUI dark background
  const primary = '#F97316'; // Orange accent
  const primaryLight = '#FDB585'; // Peach/light orange for inactive states
  const darkCircle = '#1B1F22'; // Dark circle for upload area

  const options: ThemeOptions = {
    palette: {
      mode,
      primary: { 
        main: primary,
        light: primaryLight,
        dark: '#ea580c', // Darker orange for hover states
      },
      background: { 
        default: mode === 'light' ? lightBg : darkBg, 
        paper: mode === 'light' ? darkCircle : grey[900] 
      },
      text: { 
        primary: mode === 'light' ? '#FFFFFF' : grey[100], 
        secondary: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : grey[400] 
      },
    },
    shape: { borderRadius: 10 },
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
