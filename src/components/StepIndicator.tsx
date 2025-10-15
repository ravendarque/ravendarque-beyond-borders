import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface StepIndicatorProps {
  stepNumber: number;
  title: string;
  isComplete?: boolean;
}

/**
 * Step header component with numbered circle
 * Used as section divider/header in the control panel
 * Memoized to prevent re-renders when props unchanged
 */
function StepIndicatorComponent({ stepNumber, title, isComplete = false }: StepIndicatorProps) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mb: 2
      }}
      role="heading"
      aria-level={3}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'background.paper',
          border: '2px solid',
          borderColor: isComplete 
            ? 'success.main' 
            : 'primary.main',
          color: isComplete 
            ? 'success.main' 
            : 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.125rem',
          flexShrink: 0,
          '@media (prefers-reduced-motion: no-preference)': {
            transition: 'all 0.3s ease-in-out',
          }
        }}
      >
        {stepNumber}
      </Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600,
          fontSize: '1.125rem',
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

export const StepIndicator = React.memo(StepIndicatorComponent);
