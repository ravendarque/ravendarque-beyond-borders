import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import { useDebouncedCallback } from '@/hooks/usePerformance';

export interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Debounce delay in milliseconds (default: 150ms) */
  debounceMs?: number;
}

/**
 * A reusable slider control component with label and value display
 * Optimized with React.memo and debounced onChange for smooth performance
 */
function SliderControlComponent({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  debounceMs = 150,
}: SliderControlProps) {
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes (e.g., reset or external change)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Debounced onChange to reduce re-renders
  const debouncedOnChange = useDebouncedCallback(
    onChange as (...args: unknown[]) => unknown,
    debounceMs
  ) as (value: number) => void;
  
  // Handle slider change with immediate local update + debounced callback
  const handleChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const val = newValue as number;
      setLocalValue(val); // Immediate UI feedback
      debouncedOnChange(val); // Debounced state update
    },
    [debouncedOnChange]
  );
  
  // Memoize label ID to avoid recalculation
  const labelId = React.useMemo(
    () => `${label.replace(/\s+/g, '-').toLowerCase()}-label`,
    [label]
  );
  
  const descriptionId = React.useMemo(
    () => `${label.replace(/\s+/g, '-').toLowerCase()}-description`,
    [label]
  );
  
  return (
    <Box role="group" aria-labelledby={labelId}>
      <Typography gutterBottom id={labelId}>
        {label}: {localValue}{unit}
      </Typography>
      <Slider
        value={localValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        aria-labelledby={labelId}
        aria-valuetext={`${label} ${localValue}${unit}`}
        aria-valuenow={localValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-describedby={descriptionId}
        valueLabelDisplay="auto"
      />
      <span id={descriptionId} className="visually-hidden">
        Use left and right arrow keys to adjust {label.toLowerCase()}. Current value is {localValue}{unit}. Range is from {min} to {max}.
      </span>
    </Box>
  );
}

/**
 * Memoized SliderControl - only re-renders when props change
 */
export const SliderControl = React.memo(SliderControlComponent);
