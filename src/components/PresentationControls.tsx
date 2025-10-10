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
    <FormControl component="fieldset" role="radiogroup" aria-labelledby="presentation-label">
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
          control={<Radio inputProps={{ 'aria-describedby': 'ring-description' }} />} 
          label="Ring"
        />
        <FormControlLabel 
          value="segment" 
          control={<Radio inputProps={{ 'aria-describedby': 'segment-description' }} />} 
          label="Segment"
        />
        <FormControlLabel 
          value="cutout" 
          control={<Radio inputProps={{ 'aria-describedby': 'cutout-description' }} />} 
          label="Cutout"
        />
      </RadioGroup>
      <span id="presentation-description" className="visually-hidden">
        Choose how the flag border appears around your avatar. Ring shows a full circular border, Segment shows a partial arc, and Cutout fills the border area with the flag pattern.
      </span>
      <span id="ring-description" className="visually-hidden">Full circular border around the entire avatar</span>
      <span id="segment-description" className="visually-hidden">Partial arc border on one side of the avatar</span>
      <span id="cutout-description" className="visually-hidden">Flag pattern fills the border area completely</span>
    </FormControl>
  );
}

export const PresentationControls = React.memo(PresentationControlsComponent);
