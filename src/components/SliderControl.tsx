import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
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
  /** Optional icon to show at the start (left) of the slider */
  startIcon?: React.ReactNode;
  /** Optional icon to show at the end (right) of the slider */
  endIcon?: React.ReactNode;
  /** Accessible label for the start icon */
  startIconLabel?: string;
  /** Accessible label for the end icon */
  endIconLabel?: string;
}

/**
 * A reusable slider control component with label and value display
 * Optimized with React.memo and debounced onChange for smooth performance
 * Enhanced with increment/decrement buttons and optional icons
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
  startIcon,
  endIcon,
  startIconLabel,
  endIconLabel,
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
  
  // Handle increment/decrement buttons
  const handleDecrement = useCallback(() => {
    const newVal = Math.max(min, localValue - step);
    setLocalValue(newVal);
    onChange(newVal);
  }, [localValue, min, step, onChange]);
  
  const handleIncrement = useCallback(() => {
    const newVal = Math.min(max, localValue + step);
    setLocalValue(newVal);
    onChange(newVal);
  }, [localValue, max, step, onChange]);
  
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
      {/* Label with centered text and value */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        <Typography id={labelId} sx={{ textAlign: 'center', fontWeight: 500 }}>
          {label}: {localValue}{unit}
        </Typography>
      </Box>
      
      {/* Slider with icons and increment/decrement buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Start icon (optional) */}
        {startIcon && (
          <Box
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'text.secondary',
              minWidth: 24,
            }}
            aria-label={startIconLabel}
            role="img"
          >
            {startIcon}
          </Box>
        )}
        
        {/* Decrement button */}
        <IconButton
          onClick={handleDecrement}
          disabled={localValue <= min}
          size="small"
          aria-label={`Decrease ${label.toLowerCase()} by ${step}${unit}`}
          sx={{
            color: 'primary.main',
            '&:disabled': {
              color: 'action.disabled',
            },
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        
        {/* Slider */}
        <Box sx={{ flex: 1, px: 1 }}>
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
        </Box>
        
        {/* Increment button */}
        <IconButton
          onClick={handleIncrement}
          disabled={localValue >= max}
          size="small"
          aria-label={`Increase ${label.toLowerCase()} by ${step}${unit}`}
          sx={{
            color: 'primary.main',
            '&:disabled': {
              color: 'action.disabled',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        
        {/* End icon (optional) */}
        {endIcon && (
          <Box
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'text.secondary',
              minWidth: 24,
            }}
            aria-label={endIconLabel}
            role="img"
          >
            {endIcon}
          </Box>
        )}
      </Box>
      
      <span id={descriptionId} className="visually-hidden">
        Use left and right arrow keys to adjust {label.toLowerCase()}. Current value is {localValue}{unit}. Range is from {min} to {max}. Use increment and decrement buttons to change by {step}{unit}.
      </span>
    </Box>
  );
}

/**
 * Memoized SliderControl - only re-renders when props change
 */
export const SliderControl = React.memo(SliderControlComponent);
