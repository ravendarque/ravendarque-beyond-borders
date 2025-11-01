import React from 'react';
import { Box, Typography } from '@mui/material';

export interface StepContainerProps {
  /** Step title (h2 heading) */
  title?: string;
  /** Optional description text below title */
  description?: string;
  /** Maximum width constraint (sm, md, lg, xl) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /** Child content to render */
  children: React.ReactNode;
}

/**
 * StepContainer - Consistent wrapper for step content in multi-step workflow
 * 
 * Features:
 * - Semantic heading structure (h2 for step titles)
 * - Optional description text
 * - Responsive width constraints
 * - Consistent padding and spacing
 * - Proper ARIA landmarks for accessibility
 * - Centered layout with max-width
 * 
 * @example
 * ```tsx
 * <StepContainer
 *   title="Upload Your Image"
 *   description="Choose a profile picture to add a border"
 *   maxWidth="md"
 * >
 *   <ImageUploader onUpload={handleUpload} />
 *   <NavigationButtons ... />
 * </StepContainer>
 * ```
 */
export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  maxWidth = 'md',
  children,
}) => {
  // Map maxWidth prop to pixel values
  const maxWidthMap = {
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };

  return (
    <Box
      role="region"
      aria-label={title}
      sx={{
        width: '100%',
        maxWidth: maxWidthMap[maxWidth],
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 4 },
      }}
    >
      {/* Step title */}
      {title && (
        <Typography
          variant="h4"
          component="h2"
          sx={{
            mb: description ? 1 : 3,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
      )}

      {/* Optional description */}
      {description && (
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: 'text.secondary',
          }}
        >
          {description}
        </Typography>
      )}

      {/* Step content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
