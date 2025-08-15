import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
  primary: { main: '#f97316' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#6b7280' },
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
          backgroundColor: '#f8fafc',
          margin: 0,
          color: '#0f172a',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        },
        // focus ring for form controls to mimic previous styles
        'select:focus, input[type=range]:focus, input[type=color]:focus, input[type=file]:focus, button:focus':
          {
            outline: 'none',
            boxShadow: '0 0 0 4px rgba(249,115,22,0.12)',
            borderColor: '#f97316',
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
});

export default theme;
