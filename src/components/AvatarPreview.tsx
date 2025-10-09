import React from 'react';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export interface AvatarPreviewProps {
  size: number;
  displaySize: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayUrl: string | null;
  isRendering: boolean;
}

/**
 * Avatar preview component with canvas and loading overlay
 */
export function AvatarPreview({
  size,
  displaySize,
  canvasRef,
  overlayUrl,
  isRendering,
}: AvatarPreviewProps) {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Preview
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            width: displaySize,
            height: displaySize,
            border: '1px solid',
            borderColor: theme.palette.divider,
            borderRadius: '50%',
            imageRendering: 'auto',
          }}
          aria-label="Avatar preview canvas"
          role="img"
        />
        {overlayUrl && (
          <img
            src={overlayUrl}
            alt="Generated avatar with flag border"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: displaySize,
              height: displaySize,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        )}
        {isRendering && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: displaySize,
              height: displaySize,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <CircularProgress size={40} sx={{ color: 'white' }} aria-hidden="true" />
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
              Loading...
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
