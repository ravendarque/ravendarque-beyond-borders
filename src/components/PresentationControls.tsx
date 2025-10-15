import React from 'react';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

export interface PresentationControlsProps {
  value: 'ring' | 'segment' | 'cutout';
  onChange: (value: 'ring' | 'segment' | 'cutout') => void;
}

/**
 * Presentation mode radio button group component
 * Memoized to prevent re-renders when props unchanged
 */
function PresentationControlsComponent({ value, onChange }: PresentationControlsProps) {
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Presentation</FormLabel>
      <RadioGroup
        row
        value={value}
        onChange={(e) => onChange(e.target.value as 'ring' | 'segment' | 'cutout')}
      >
        <FormControlLabel value="ring" control={<Radio />} label="Ring" />
        <FormControlLabel value="segment" control={<Radio />} label="Segment" />
        <FormControlLabel value="cutout" control={<Radio />} label="Cutout" />
      </RadioGroup>
    </FormControl>
  );
}

export const PresentationControls = React.memo(PresentationControlsComponent);
