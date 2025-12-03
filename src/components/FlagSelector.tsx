import React, { useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';

export interface FlagSelectorProps {
  /** Available flags to choose from */
  flags: FlagSpec[];
  /** Currently selected flag ID */
  selectedFlagId: string | null;
  /** Callback when selection changes */
  onFlagChange: (flagId: string | null) => void;
}

/**
 * FlagSelector - Dropdown for selecting a flag from categorized groups
 * 
 * Single Responsibility: Flag selection UI with Radix Select primitive
 */
export function FlagSelector({ flags, selectedFlagId, onFlagChange }: FlagSelectorProps) {
  // Preload all preview images when dropdown opens
  useEffect(() => {
    const preloaded = new Set<string>();
    
    const preloadAllPreviews = () => {
      flags.forEach(flag => {
        const src = flag.png_preview || flag.png_full;
        if (!src) return;
        
        const url = getAssetUrl(`flags/${src}`);
        if (preloaded.has(url)) return;
        
        preloaded.add(url);
        const img = new Image();
        img.src = url;
      });
    };

    // Preload all previews immediately (don't wait for hover)
    preloadAllPreviews();
  }, [flags]);

  return (
    <div className="flag-selector">
      <Select.Root 
        value={selectedFlagId ?? ''} 
        onValueChange={(value) => onFlagChange(value || null)}
      >
        <Select.Trigger className="flag-select-trigger" aria-label="Choose a flag">
          <Select.Value placeholder="Choose a flag" />
          <Select.Icon className="flag-select-icon">▼</Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="flag-select-content" position="popper">
            <Select.Viewport>
              {/* Authoritarian Regimes */}
              <Select.Group>
                <Select.Label className="flag-select-label">Authoritarian Regimes</Select.Label>
                {flags.filter(f => f.category === 'authoritarian').map((flag) => (
                  <Select.Item key={flag.id} value={flag.id} className="flag-select-item" data-value={flag.id}>
                    <Select.ItemText>{flag.displayName}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>

              {/* Occupied Territories */}
              <Select.Group>
                <Select.Label className="flag-select-label">Occupied Territories</Select.Label>
                {flags.filter(f => f.category === 'occupied').map((flag) => (
                  <Select.Item key={flag.id} value={flag.id} className="flag-select-item" data-value={flag.id}>
                    <Select.ItemText>{flag.displayName}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>

              {/* Stateless Peoples */}
              <Select.Group>
                <Select.Label className="flag-select-label">Stateless Peoples</Select.Label>
                {flags.filter(f => f.category === 'stateless').map((flag) => (
                  <Select.Item key={flag.id} value={flag.id} className="flag-select-item" data-value={flag.id}>
                    <Select.ItemText>{flag.displayName}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>

              {/* Oppressed Groups */}
              <Select.Group>
                <Select.Label className="flag-select-label">Oppressed Groups</Select.Label>
                {flags.filter(f => f.category === 'oppressed').map((flag) => (
                  <Select.Item key={flag.id} value={flag.id} className="flag-select-item" data-value={flag.id}>
                    <Select.ItemText>{flag.displayName}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

