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
  // Find the selected flag object
  const selectedFlag = flags.find(f => f.id === selectedFlagId) || null;

  return (
    <Autocomplete
      options={flags}
      value={selectedFlag}
      onChange={(_event, newValue) => {
        onChange(newValue?.id || null);
      }}
      getOptionLabel={(option) => option.displayName.split(' — ')[0]}
      groupBy={(option) => 
        option.category === 'marginalized' ? 'Pride & Marginalized' : 'National'
      }
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
