import React from 'react';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

export interface AvatarPreviewProps {
  size: number;
  displaySize: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayUrl: string | null;
  isRendering: boolean;
  hasImage?: boolean; // NEW: Track if image is uploaded
}

/**
 * Avatar preview component with canvas and loading overlay
 * Memoized to prevent re-renders when props unchanged
 */
function AvatarPreviewComponent({
  size,
  displaySize,
  canvasRef,
  overlayUrl,
  isRendering,
  hasImage = false,
}: AvatarPreviewProps) {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 3 }} role="region" aria-labelledby="preview-canvas-label">
      <Typography variant="h6" gutterBottom id="preview-canvas-label" className="visually-hidden">
        Avatar Preview Canvas
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
          aria-label={overlayUrl ? "Avatar with flag border applied" : "Empty avatar canvas, awaiting image upload"}
          role="img"
          aria-busy={isRendering}
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
        {/* Empty State - Show when no image uploaded */}
        {!hasImage && !isRendering && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: displaySize,
              height: displaySize,
              borderRadius: '50%',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1.5,
            }}
            role="status"
            aria-label="No image uploaded yet. Upload an image to get started."
          >
            <ImageOutlinedIcon 
              sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              }} 
              aria-hidden="true"
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                fontWeight: 500,
                textAlign: 'center',
                px: 2,
              }}
            >
              Upload an image
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                px: 2,
              }}
            >
              to get started
            </Typography>
          </Box>
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
            aria-label="Rendering avatar with flag border, please wait"
          >
            <CircularProgress 
              size={40} 
              sx={{ color: 'white' }} 
              aria-hidden="true"
              aria-label="Loading progress indicator"
            />
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }} aria-hidden="true">
              Loading...
            </Typography>
            <span className="visually-hidden">Rendering in progress. This may take a few seconds.</span>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export const AvatarPreview = React.memo(AvatarPreviewComponent);
