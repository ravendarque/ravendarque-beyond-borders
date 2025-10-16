import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import Skeleton from '@mui/material/Skeleton';
import type { FlagSpec } from '@/flags/schema';

export interface FlagSelectorProps {
  value: string;
  flags: FlagSpec[];
  onChange: (flagId: string) => void;
  isLoading?: boolean; // NEW: Track if flags are being loaded
}

/**
 * Flag selection dropdown component
 * Memoized to prevent re-renders when props unchanged
 */
function FlagSelectorComponent({ value, flags, onChange, isLoading = false }: FlagSelectorProps) {
  // Get the currently selected flag display name for aria-describedby
  const selectedFlag = flags.find(f => f.id === value);
  const flagDescription = selectedFlag 
    ? `${selectedFlag.displayName} selected` 
    : 'No flag selected';
  
  // Show skeleton loader while flags are being loaded
  if (isLoading) {
    return (
      <FormControl fullWidth>
        <Skeleton 
          variant="rectangular" 
          height={56} 
          sx={{ borderRadius: 1 }}
          aria-label="Loading flags..."
          role="status"
          aria-busy="true"
        />
        <FormHelperText>
          <Skeleton width="60%" />
        </FormHelperText>
      </FormControl>
    );
  }
  
  return (
    <FormControl fullWidth>
      <InputLabel id="flag-select-label">Select a flag</InputLabel>
      <Select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        label="Select a flag"
        labelId="flag-select-label"
        aria-describedby="flag-select-description flag-helper-text"
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {flags.map((flag) => (
          <MenuItem key={flag.id} value={flag.id}>
            {flag.displayName}
          </MenuItem>
        ))}
      </Select>
      <span id="flag-select-description" className="visually-hidden">
        {flagDescription}. Choose a flag to add as a border to your avatar.
      </span>
      {!value && (
        <FormHelperText id="flag-helper-text">
          Select a flag to add a colorful border to your avatar
        </FormHelperText>
      )}
    </FormControl>
  );
}

export const FlagSelector = React.memo(FlagSelectorComponent);
