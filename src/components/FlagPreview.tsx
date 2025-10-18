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
    
    // Construct full path to flag image in public/flags/
    const filename = size === 'small' && flag.png_preview 
      ? flag.png_preview 
      : flag.png_full;
    
    return `/flags/${filename}`;
  };

  // Size in pixels
  const sizePx = size === 'small' ? 96 : 192;

  if (!flag) {
    return (
      <Box
        aria-label="Flag preview"
        data-size={size}
        sx={{
          width: sizePx,
          height: sizePx,
          borderRadius: '50%',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
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
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
      data-size={size}
      data-animate={shouldAnimate}
    >
      <Box
        component={PreviewContainer}
        {...containerProps}
        aria-label="Flag preview"
        aria-busy={isLoading}
        data-clickable={!!onClick}
        sx={{
          position: 'relative',
          width: sizePx,
          height: sizePx,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s',
          '&:hover': onClick ? {
            transform: 'scale(1.05)',
          } : {},
        }}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'grey.100',
            }}
          >
            <CircularProgress size={size === 'small' ? 24 : 40} />
          </Box>
        )}

        {/* Flag image */}
        <Box
          component="img"
          src={getImageSrc()}
          alt={`${flag.displayName} flag`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sx={{
            width: sizePx,
            height: sizePx,
            borderRadius: '50%',
            objectFit: 'cover',
            border: 4,
            borderColor: 'grey.200',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        />

        {/* Error state */}
        {hasError && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'grey.200',
            }}
          >
            <Typography variant="body2" color="error" sx={{ textAlign: 'center', px: 2 }}>
              Failed to load
            </Typography>
          </Box>
        )}
      </Box>

      {/* Flag name */}
      <Typography
        variant={size === 'small' ? 'body2' : 'h6'}
        sx={{ fontWeight: 'medium', textAlign: 'center' }}
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
      {showDescription && flag.sources?.authorNote && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: '28rem' }}
        >
          {flag.sources.authorNote}
        </Typography>
      )}
    </Box>
  );
};
