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
  return (
    <FormControl fullWidth>
      <InputLabel>Select a flag</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value)} label="Select a flag">
        <MenuItem value="">None</MenuItem>
        {flags.map((flag) => (
          <MenuItem key={flag.id} value={flag.id}>
            {flag.displayName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export const FlagSelector = React.memo(FlagSelectorComponent);
