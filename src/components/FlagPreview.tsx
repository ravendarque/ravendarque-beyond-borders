import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { FlagSpec } from '@/flags/schema';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { getAssetUrl } from '@/config';

export interface FlagPreviewProps {
  /** Flag to preview */
  flag: FlagSpec | null;
  
  /** Size of the preview */
  size?: 'small' | 'large';
  
  /** Whether to animate the preview on load */
  animate?: boolean;
  
  /** Click handler (makes preview interactive) */
  onClick?: () => void;
}

export const FlagPreview: React.FC<FlagPreviewProps> = ({
  flag,
  size = 'large',
  animate = true,
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
    
    if (!filename) return '';
    
    // Use getAssetUrl to ensure proper base path for GitHub Pages deployment
    return getAssetUrl(`flags/${filename}`);
  };

  // Size in pixels - rectangular flag preview
  const width = size === 'small' ? 144 : 288;  // 3:2 aspect ratio for flags
  const height = size === 'small' ? 96 : 192;

  if (!flag) {
    return (
      <Box
        aria-label="Flag preview"
        data-size={size}
        sx={{
          width: width,
          height: height,
          borderRadius: 1,
          border: 3,
          borderColor: 'grey.300',
          borderStyle: 'dashed',
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <Box
          component="svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          sx={{ 
            width: 48, 
            height: 48, 
            color: 'grey.400',
          }}
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2, fontWeight: 'medium' }}>
          Choose a flag
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
        gap: 0,
        mb: 3,
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
          width: width,
          height: height,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s',
          '&:hover': onClick ? {
            transform: 'scale(1.05)',
          } : {},
          mb: 2,
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
              borderRadius: 1,
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
            width: width,
            height: height,
            borderRadius: 1,
            objectFit: 'cover',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s',
            boxShadow: 1,
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
              borderRadius: 1,
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
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{ fontWeight: 'medium', textAlign: 'center', mb: 0.5 }}
      >
        {flag.name}
      </Typography>

      {/* Reason */}
      {flag.reason && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: '28rem', px: 1 }}
        >
          {flag.reason}
        </Typography>
      )}
    </Box>
  );
};
