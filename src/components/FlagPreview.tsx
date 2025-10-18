import React, { useState } from 'react';
import { Box, CircularProgress, Chip, Typography } from '@mui/material';
import type { FlagSpec } from '@/flags/schema';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface FlagPreviewProps {
  /** Flag to preview */
  flag: FlagSpec | null;
  
  /** Size of the preview */
  size?: 'small' | 'large';
  
  /** Whether to animate the preview on load */
  animate?: boolean;
  
  /** Whether to show flag description */
  showDescription?: boolean;
  
  /** Whether to show category badge */
  showCategory?: boolean;
  
  /** Click handler (makes preview interactive) */
  onClick?: () => void;
}

export const FlagPreview: React.FC<FlagPreviewProps> = ({
  flag,
  size = 'large',
  animate = true,
  showDescription = false,
  showCategory = false,
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Respect motion preferences
  const shouldAnimate = animate && !prefersReducedMotion;

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Determine image source (prefer preview for small size)
  const getImageSrc = () => {
    if (!flag) return '';
    if (size === 'small' && flag.png_preview) {
      return flag.png_preview;
    }
    return flag.png_full;
  };

  // Size classes
  const sizeClasses = size === 'small' 
    ? 'w-24 h-24' 
    : 'w-48 h-48 md:w-64 md:h-64';

  // Interactive styling
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-105 transition-transform'
    : '';

  // Animation classes
  const animationClasses = shouldAnimate
    ? 'animate-fade-in'
    : '';

  if (!flag) {
    return (
      <Box
        aria-label="Flag preview"
        data-size={size}
        className={`${sizeClasses} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <Typography variant="body2" color="text.secondary" className="text-center px-4">
          Select a flag to preview
        </Typography>
      </Box>
    );
  }

  const PreviewContainer = onClick ? 'button' : 'div';
  const containerProps = onClick
    ? {
        onClick,
        type: 'button' as const,
        'aria-label': `View ${flag.displayName} flag details`,
      }
    : {};

  return (
    <Box
      className="flex flex-col items-center gap-4"
      data-size={size}
      data-animate={shouldAnimate}
    >
      <PreviewContainer
        {...containerProps}
        aria-label="Flag preview"
        aria-busy={isLoading}
        data-clickable={!!onClick}
        className={`relative ${sizeClasses} ${interactiveClasses} ${animationClasses}`}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Box
            className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <CircularProgress size={size === 'small' ? 24 : 40} />
          </Box>
        )}

        {/* Flag image */}
        <img
          src={getImageSrc()}
          alt={`${flag.displayName} flag`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`
            ${sizeClasses}
            rounded-full
            object-cover
            border-4
            border-gray-200
            dark:border-gray-700
            ${isLoading ? 'opacity-0' : 'opacity-100'}
            transition-opacity
            duration-300
          `}
        />

        {/* Error state */}
        {hasError && (
          <Box
            className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <Typography variant="body2" color="error" className="text-center px-4">
              Failed to load
            </Typography>
          </Box>
        )}
      </PreviewContainer>

      {/* Flag name */}
      <Typography
        variant={size === 'small' ? 'body2' : 'h6'}
        className="font-medium text-center"
      >
        {flag.displayName}
      </Typography>

      {/* Category badge */}
      {showCategory && (
        <Chip
          label={flag.category === 'marginalized' ? 'Pride & Marginalized' : 'National'}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}

      {/* Description */}
      {showDescription && flag.sources.authorNote && (
        <Typography
          variant="body2"
          color="text.secondary"
          className="text-center max-w-md"
        >
          {flag.sources.authorNote}
        </Typography>
      )}
    </Box>
  );
};
