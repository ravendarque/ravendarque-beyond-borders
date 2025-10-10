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
      <FormLabel component="legend" id="presentation-label">
        Presentation Style
      </FormLabel>
      <RadioGroup
        row
        value={value}
        onChange={(e) => onChange(e.target.value as 'ring' | 'segment' | 'cutout')}
        aria-labelledby="presentation-label"
        aria-describedby="presentation-description"
      >
        <FormControlLabel 
          value="ring" 
          control={<Radio />} 
          label="Ring"
          aria-label="Ring style: Full circular border"
        />
        <FormControlLabel 
          value="segment" 
          control={<Radio />} 
          label="Segment"
          aria-label="Segment style: Partial arc border"
        />
        <FormControlLabel 
          value="cutout" 
          control={<Radio />} 
          label="Cutout"
          aria-label="Cutout style: Flag fills the border area"
        />
      </RadioGroup>
      <span id="presentation-description" className="visually-hidden">
        Choose how the flag border appears around your avatar
      </span>
    </FormControl>
  );
}

export const PresentationControls = React.memo(PresentationControlsComponent);
