import React, { useMemo } from 'react';
import * as Select from '@radix-ui/react-select';
import type { FlagSpec } from '@/flags/schema';

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
  // Group flags by category and only include categories that have flags
  // Memoized to prevent recalculation on every render
  const flagsByCategory = useMemo(() => {
    return flags.reduce((acc, flag) => {
      if (!flag.category) return acc;
      if (!acc[flag.category]) {
        acc[flag.category] = [];
      }
      acc[flag.category].push(flag);
      return acc;
    }, {} as Record<string, typeof flags>);
  }, [flags]);

  // Get unique categories that have flags, sorted for consistent display
  const categories = useMemo(() => {
    return Object.keys(flagsByCategory).sort();
  }, [flagsByCategory]);

  /**
   * Get display name for a category from the first flag that has it (from source of truth)
   * 
   * Categories are resolved from flag-data.yaml through the fetch-flags script,
   * which preserves the original display name in categoryDisplayName. If for some reason
   * categoryDisplayName is missing, we fall back to the category code as a last resort.
   */
  const getCategoryDisplayName = (category: string): string => {
    const flagsInCategory = flagsByCategory[category];
    if (flagsInCategory && flagsInCategory.length > 0) {
      const firstFlag = flagsInCategory[0];
      // Use categoryDisplayName from source of truth if available, otherwise fall back to category code
      return firstFlag.categoryDisplayName ?? category;
    }
    return category;
  };

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
              {categories.map((category) => (
                <Select.Group key={category}>
                  <Select.Label className="flag-select-label">
                    {getCategoryDisplayName(category)}
                  </Select.Label>
                  {flagsByCategory[category].map((flag) => (
                    <Select.Item key={flag.id} value={flag.id} className="flag-select-item">
                      <Select.ItemText>{flag.displayName}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Group>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

