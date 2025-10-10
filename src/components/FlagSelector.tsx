import React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { FlagSpec } from '@/flags/schema';

export interface FlagSelectorProps {
  value: string;
  flags: FlagSpec[];
  onChange: (flagId: string) => void;
}

/**
 * Flag selection dropdown component
 * Memoized to prevent re-renders when props unchanged
 */
function FlagSelectorComponent({ value, flags, onChange }: FlagSelectorProps) {
  // Get the currently selected flag display name for aria-describedby
  const selectedFlag = flags.find(f => f.id === value);
  const flagDescription = selectedFlag 
    ? `${selectedFlag.displayName} selected` 
    : 'No flag selected';
  
  return (
    <FormControl fullWidth>
      <InputLabel id="flag-select-label">Select a flag</InputLabel>
      <Select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        label="Select a flag"
        labelId="flag-select-label"
        aria-describedby="flag-select-description"
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
    </FormControl>
  );
}

export const FlagSelector = React.memo(FlagSelectorComponent);
