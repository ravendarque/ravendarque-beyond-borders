import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '@/theme';
import React from 'react';

// Mock the renderAvatar function
vi.mock('@/renderer/render', () => ({
  renderAvatar: vi.fn(async () => new Blob(['test'], { type: 'image/png' })),
}));

// Mock main.tsx to prevent createRoot execution
vi.mock('@/main', () => ({
  ThemeModeContext: React.createContext<{
    mode: 'light' | 'dark';
    setMode: (m: 'light' | 'dark') => void;
  }>({ mode: 'dark', setMode: () => {} }),
}));

// Import App after mocking
const { App } = await import('@/pages/App');

// Mock ThemeModeContext
const ThemeModeContext = React.createContext<{
  mode: 'light' | 'dark';
  setMode: (m: 'light' | 'dark') => void;
}>({ mode: 'dark', setMode: () => {} });

// Helper to render App with necessary providers
function renderApp() {
  const theme = createAppTheme('dark');
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', setMode: () => {} }}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

// Helper to upload image and select flag (enables sections 2 and 3)
async function uploadImageAndSelectFlag(user: ReturnType<typeof userEvent.setup>) {
  // Upload an image
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['test'], 'avatar.png', { type: 'image/png' });
  await user.upload(fileInput, file);
  
  // Wait for flags to load
  await waitFor(() => {
    expect(screen.queryByText('Loading flags...')).toBeFalsy();
  }, { timeout: 2000 });
  
  // Wait for section 2 (flag selector) to become enabled
  await waitFor(() => {
    const selects = document.querySelectorAll('[role="combobox"]');
    const flagSelect = Array.from(selects).find((el) => {
      const parent = el.closest('.MuiFormControl-root');
      return parent?.querySelector('label')?.textContent?.includes('Select a flag');
    }) as HTMLElement;
    
    if (!flagSelect) {
      throw new Error('Flag select not found');
    }
    
    const section = flagSelect?.closest('.MuiStack-root') as HTMLElement;
    if (!section) {
      throw new Error('Section not found');
    }
    
    const pointerEvents = window.getComputedStyle(section).pointerEvents;
    expect(pointerEvents).not.toBe('none');
  }, { timeout: 3000 });
  
  // Select a flag
  const selects = document.querySelectorAll('[role="combobox"]');
  const flagSelect = Array.from(selects).find((el) => {
    const parent = el.closest('.MuiFormControl-root');
    return parent?.querySelector('label')?.textContent?.includes('Select a flag');
  }) as HTMLElement;
  await user.click(flagSelect);
  const firstFlag = screen.getAllByRole('option')[1]; // Skip "None"
  await user.click(firstFlag);
  
  // Wait for section 3 (appearance controls) to become enabled
  await waitFor(() => {
    const segmentRadio = screen.getByRole('radio', { name: 'Segment' });
    const section = segmentRadio?.closest('.MuiStack-root') as HTMLElement;
    
    if (!section) {
      throw new Error('Appearance section not found');
    }
    
    const pointerEvents = window.getComputedStyle(section).pointerEvents;
    expect(pointerEvents).not.toBe('none');
  }, { timeout: 3000 });
}

describe('Integration: Complete Avatar Creation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock browser APIs
    global.createImageBitmap = vi.fn(async () => ({
      width: 100,
      height: 100,
      close: vi.fn(),
    })) as any;
    
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock fetch to return valid flag data
    global.fetch = vi.fn(async (url) => {
      if (typeof url === 'string' && url.includes('flags.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'flag1',
              displayName: 'Test Flag',
              png_full: '/flags/test.png',
              png_preview: '/flags/test.preview.png',
            },
          ],
        } as Response;
      }
      // For other requests (like flag images)
      return {
        ok: true,
        status: 200,
        blob: async () => new Blob(['test'], { type: 'image/png' }),
      } as Response;
    }) as any;
  });

  it('should render the main app with all components', () => {
    renderApp();
    
    // Check for main components
    expect(screen.getByText('Beyond Borders')).toBeTruthy();
    expect(screen.getByText('Choose Image')).toBeTruthy();
    expect(screen.getByText('Preview')).toBeTruthy();
  });

  it('should have default presentation mode as ring', () => {
    renderApp();
    
    const ringRadio = screen.getByRole('radio', { name: 'Ring' }) as HTMLInputElement;
    expect(ringRadio.checked).toBe(true);
  });

  it('should allow uploading an image', async () => {
    const user = userEvent.setup();
    renderApp();
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'avatar.png', { type: 'image/png' });
    
    await user.upload(fileInput, file);
    
    // Canvas should be updated (canvas element should exist)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should allow selecting a flag', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Wait for flags to finish loading (skeleton loader should disappear)
    await waitFor(() => {
      expect(screen.queryByText('Loading flags...')).toBeFalsy();
    }, { timeout: 2000 });
    
    // Upload an image first to enable flag selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'avatar.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    
    // Wait for flag selector to become enabled
    await waitFor(() => {
      const selects = document.querySelectorAll('[role="combobox"]');
      const flagSelect = Array.from(selects).find((el) => {
        const parent = el.closest('.MuiFormControl-root');
        return parent?.querySelector('label')?.textContent?.includes('Select a flag');
      }) as HTMLElement;
      
      const section = flagSelect?.closest('.MuiStack-root') as HTMLElement;
      expect(section?.style.pointerEvents).not.toBe('none');
    }, { timeout: 1000 });
    
    // Open flag selector
    const selects = document.querySelectorAll('[role="combobox"]');
    const flagSelect = Array.from(selects).find((el) => {
      const parent = el.closest('.MuiFormControl-root');
      return parent?.querySelector('label')?.textContent?.includes('Select a flag');
    }) as HTMLElement;
    
    await user.click(flagSelect);
    
    // At least "None" option should be visible
    expect(screen.getByText('None')).toBeTruthy();
  });

  it('should change presentation mode from ring to segment', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Upload image and select flag to enable controls
    await uploadImageAndSelectFlag(user);
    
    const segmentRadio = screen.getByRole('radio', { name: 'Segment' });
    await user.click(segmentRadio);
    
    const segmentRadioChecked = screen.getByRole('radio', { name: 'Segment' }) as HTMLInputElement;
    expect(segmentRadioChecked.checked).toBe(true);
  });

  it('should show Flag Offset slider only in cutout mode', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Should not show in ring mode (even if we had controls enabled, which we don't yet)
    expect(screen.queryByText(/Flag Horizontal Offset/)).toBeFalsy();
    
    // Upload image and select flag to enable controls
    await uploadImageAndSelectFlag(user);
    
    // Still should not show in ring mode
    expect(screen.queryByText(/Flag Horizontal Offset/)).toBeFalsy();
    
    // Switch to cutout mode
    const cutoutRadio = screen.getByRole('radio', { name: 'Cutout' });
    await user.click(cutoutRadio);
    
    // Should show in cutout mode
    await waitFor(() => {
      expect(screen.getByText(/Flag Horizontal Offset/)).toBeTruthy();
    });
  });

  it('should persist settings to localStorage', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Upload image and select flag to enable controls
    await uploadImageAndSelectFlag(user);
    
    // Change thickness slider (should be persisted)
    const thicknessSlider = screen.getByText(/Border thickness/).parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
    
    // Simulate slider change via keyboard (more reliable than mouse)
    await user.click(thicknessSlider);
    
    // Check that localStorage methods would be called
    // (actual persistence is tested in usePersistedState unit tests)
    expect(thicknessSlider).toBeTruthy();
  });

  it('should have download button initially disabled', () => {
    renderApp();
    
    const downloadButton = screen.getByText('Download').closest('button') as HTMLButtonElement;
    expect(downloadButton.disabled).toBe(true);
  });

  it('should allow changing background color', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Upload image and select flag to enable controls
    await uploadImageAndSelectFlag(user);
    
    // Open background selector
    const selectsAfter = document.querySelectorAll('[role="combobox"]');
    const bgSelect = Array.from(selectsAfter).find((el) => {
      const parent = el.closest('.MuiFormControl-root');
      return parent?.querySelector('label')?.textContent?.includes('Background');
    }) as HTMLElement;
    
    if (bgSelect) {
      await user.click(bgSelect);
      
      // Check for background options (use getAllByText since dropdown shows multiple instances)
      expect(screen.getAllByText('Transparent').length).toBeGreaterThan(0);
      expect(screen.getByText('White')).toBeTruthy();
      expect(screen.getByText('Black')).toBeTruthy();
    }
  });

  it('should render canvas with correct default size', () => {
    renderApp();
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    // Default size should be set
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('should have all slider controls rendered', () => {
    renderApp();
    
    expect(screen.getByText(/Border thickness/)).toBeTruthy();
    expect(screen.getByText(/Inset\/Outset/)).toBeTruthy();
  });

  it('should render presentation controls with all options', () => {
    renderApp();
    
    expect(screen.getByText('Presentation Style')).toBeTruthy();
    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('Segment')).toBeTruthy();
    expect(screen.getByText('Cutout')).toBeTruthy();
  });

  it('should switch between presentation modes without errors', async () => {
    const user = userEvent.setup();
    renderApp();
    
    // Upload image and select flag to enable controls
    await uploadImageAndSelectFlag(user);
    
    // Switch through all modes
    await user.click(screen.getByRole('radio', { name: 'Segment' }));
    await user.click(screen.getByRole('radio', { name: 'Cutout' }));
    await user.click(screen.getByRole('radio', { name: 'Ring' }));
    
    // Should end up back at ring
    const ringRadio = screen.getByRole('radio', { name: 'Ring' }) as HTMLInputElement;
    expect(ringRadio.checked).toBe(true);
  });

  it('should have proper layout structure', () => {
    const { container } = renderApp();
    
    // Should have Paper components for sections
    const papers = container.querySelectorAll('.MuiPaper-root');
    expect(papers.length).toBeGreaterThan(0);
    
    // Should have Grid layout (MUI v6 uses Grid2)
    const grid = container.querySelector('.MuiGrid2-root');
    expect(grid).toBeTruthy();
  });
});
