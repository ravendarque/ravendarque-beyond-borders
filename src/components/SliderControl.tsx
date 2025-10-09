import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';

export interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

/**
 * A reusable slider control component with label and value display
 */
export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
}: SliderControlProps) {
  return (
    <Box>
      <Typography gutterBottom id={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}>
        {label}: {value}{unit}
      </Typography>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue as number)}
        min={min}
        max={max}
        step={step}
        aria-labelledby={`${label.replace(/\s+/g, '-').toLowerCase()}-label`}
        aria-valuetext={`${value}${unit}`}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}
