import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import type { FlagSpec } from '@/flags/schema';

export interface FlagDropdownProps {
  /** Available flags to choose from */
  flags: FlagSpec[];
  
  /** Currently selected flag ID */
  selectedFlagId: string | null;
  
  /** Callback when selection changes */
  onChange: (flagId: string | null) => void;
  
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  
  /** Whether selection is required */
  required?: boolean;
  
  /** Error message to display */
  error?: string;
}

export const FlagDropdown: React.FC<FlagDropdownProps> = ({
  flags,
  selectedFlagId,
  onChange,
  disabled = false,
  required = false,
  error,
}) => {
  // Map category codes to human-readable labels
  const getCategoryLabel = React.useCallback((category: string): string => {
    switch (category) {
      case 'authoritarian':
        return 'Authoritarian States';
      case 'occupied':
        return 'Occupied / Disputed Territories';
      case 'stateless':
        return 'Stateless Peoples';
      case 'oppressed':
        return 'Oppressed Groups';
      default:
        return 'Other';
    }
  }, []);

  // Sort flags by category, then alphabetically within each category
  const sortedFlags = React.useMemo(() => {
    return [...flags].sort((a, b) => {
      const categoryA = getCategoryLabel(a.category);
      const categoryB = getCategoryLabel(b.category);
      
      // First sort by category
      const categoryComparison = categoryA.localeCompare(categoryB);
      if (categoryComparison !== 0) {
        return categoryComparison;
      }
      
      // Then sort alphabetically within category by display name
      const nameA = a.displayName.split(' — ')[0];
      const nameB = b.displayName.split(' — ')[0];
      return nameA.localeCompare(nameB);
    });
  }, [flags, getCategoryLabel]);

  // Find the selected flag object
  const selectedFlag = sortedFlags.find(f => f.id === selectedFlagId) || null;

  return (
    <Autocomplete
      options={sortedFlags}
      value={selectedFlag}
      onChange={(_event, newValue) => {
        onChange(newValue?.id || null);
      }}
      getOptionLabel={(option) => option.displayName.split(' — ')[0]}
      groupBy={(option) => getCategoryLabel(option.category)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Choose a flag"
          required={required}
          error={!!error}
          helperText={error}
          aria-label="Choose a flag for your border"
        />
      )}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText="No options"
      clearOnEscape
      disableClearable={false}
    />
  );
};
