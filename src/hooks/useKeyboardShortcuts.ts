import { useEffect } from 'react';

export interface KeyboardShortcut {
  /** Key(s) to listen for */
  key: string;
  /** Whether Ctrl/Cmd key must be pressed */
  ctrlKey?: boolean;
  /** Whether Shift key must be pressed */
  shiftKey?: boolean;
  /** Whether Alt key must be pressed */
  altKey?: boolean;
  /** Callback to execute when shortcut is triggered */
  callback: (event: KeyboardEvent) => void;
  /** Description of what the shortcut does */
  description?: string;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 * 
 * @param shortcuts Array of keyboard shortcuts to register
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrlKey: true,
 *     callback: (e) => {
 *       e.preventDefault();
 *       handleSave();
 *     },
 *     description: 'Save'
 *   },
 *   {
 *     key: 'd',
 *     ctrlKey: true,
 *     callback: () => handleDownload(),
 *     description: 'Download'
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        // Skip if shortcut is disabled
        if (shortcut.enabled === false) return;

        // Check if key matches
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        
        // Check modifier keys
        const ctrlMatches = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : true;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        // If all conditions match, execute callback
        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          shortcut.callback(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Get a formatted string representation of a keyboard shortcut
 * 
 * @param shortcut The shortcut to format
 * @returns Formatted string (e.g., "Ctrl+S", "Shift+D")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) {
    // Use "Cmd" on Mac, "Ctrl" elsewhere
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    parts.push(isMac ? 'Cmd' : 'Ctrl');
  }
  
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}
