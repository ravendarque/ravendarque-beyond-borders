import React, { useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Typography from '@mui/material/Typography';
import { ImageUploader } from './ImageUploader';
import { FlagSelector } from './FlagSelector';
import { PresentationControls } from './PresentationControls';
import { SliderControl } from './SliderControl';
import { StepIndicator } from './StepIndicator';
import type { FlagSpec } from '@/flags/schema';
import type { FileValidationError } from '@/types/errors';

export interface ControlPanelProps {
  // File upload
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileError?: (error: FileValidationError) => void;
  hasImage?: boolean; // Track if an image has been uploaded

  // Flag selection
  flagId: string;
  flags: FlagSpec[];
  onFlagChange: (flagId: string) => void;
  flagsLoading?: boolean; // NEW: Track if flags are being loaded

  // Presentation
  presentation: 'ring' | 'segment' | 'cutout';
  onPresentationChange: (value: 'ring' | 'segment' | 'cutout') => void;

  // Sliders
  thickness: number;
  onThicknessChange: (value: number) => void;
  insetPct: number;
  onInsetPctChange: (value: number) => void;
  flagOffsetX: number;
  onFlagOffsetXChange: (value: number) => void;

  // Background
  bg: string | 'transparent';
  onBgChange: (value: string) => void;

  // Download
  onDownload: () => void;
  downloadDisabled: boolean;
  isDownloading?: boolean; // NEW: Track if download is in progress

  // Copy to clipboard
  onCopy?: () => void;
  copyDisabled?: boolean;
  isCopying?: boolean; // NEW: Track if copy is in progress
}

/**
 * Control panel component containing all user controls
 * Optimized with React.memo and useCallback
 */
function ControlPanelComponent({
  onFileChange,
  onFileError,
  hasImage = false,
  flagId,
  flags,
  onFlagChange,
  flagsLoading = false,
  presentation,
  onPresentationChange,
  thickness,
  onThicknessChange,
  insetPct,
  onInsetPctChange,
  flagOffsetX,
  onFlagOffsetXChange,
  bg,
  onBgChange,
  onDownload,
  downloadDisabled,
  isDownloading = false,
  onCopy,
  copyDisabled,
  isCopying = false,
}: ControlPanelProps) {
  // Memoize background change handler
  const handleBgChange = useCallback(
    (event: { target: { value: string } }) => {
      onBgChange(event.target.value);
    },
    [onBgChange]
  );
  
  return (
    <Paper sx={{ p: 4 }} role="form" aria-labelledby="controls-heading">
      <Stack spacing={3}>
        {/* Step 1: Image Upload Section */}
        <Stack spacing={2}>
          <Stack spacing={0}>
            <StepIndicator stepNumber={1} title="Upload Image" isComplete={hasImage} />
            <Typography 
              variant="caption" 
              sx={{ pl: 7, opacity: 0.9, fontSize: '0.8125rem', mt: '-6px !important' }}
            >
              JPG or PNG, max 10 MB, up to 4K resolution
            </Typography>
          </Stack>
          <Stack spacing={2} sx={{ pl: 7 }}>
            <ImageUploader onFileChange={onFileChange} onError={onFileError} />
          </Stack>
        </Stack>

        {/* Step 2: Flag Selection Section */}
        <Stack spacing={2}>
          <StepIndicator stepNumber={2} title="Select Flag" isComplete={!!flagId} />
          <Stack spacing={2} sx={{ pl: 7 }}>
            <FlagSelector value={flagId} flags={flags} onChange={onFlagChange} isLoading={flagsLoading} />
          </Stack>
        </Stack>

        {/* Step 3: Appearance Section */}
        <Stack spacing={2}>
          <StepIndicator 
            stepNumber={3} 
            title="Customize Appearance" 
            isComplete={hasImage && !!flagId} 
          />
          <Stack spacing={2} sx={{ pl: 7 }}>
            <PresentationControls value={presentation} onChange={onPresentationChange} />

            {/* Border Thickness */}
            <SliderControl
              label="Border thickness"
              value={thickness}
              min={3}
              max={20}
              step={1}
              onChange={onThicknessChange}
              unit="%"
            />

            {/* Inset/Outset */}
            <SliderControl
              label="Inset/Outset"
              value={insetPct}
              min={-10}
              max={10}
              step={1}
              onChange={onInsetPctChange}
              unit="%"
            />

            {/* Flag Offset (Cutout mode only) */}
            {presentation === 'cutout' && (
              <SliderControl
                label="Flag Offset"
                value={flagOffsetX}
                min={-200}
                max={200}
                step={5}
                onChange={onFlagOffsetXChange}
                unit="px"
              />
            )}

            {/* Background */}
            <FormControl fullWidth>
              <InputLabel id="background-select-label">Background</InputLabel>
              <Select 
                value={bg} 
                onChange={handleBgChange} 
                label="Background"
                labelId="background-select-label"
                aria-describedby="background-description"
              >
                <MenuItem value="transparent">Transparent</MenuItem>
                <MenuItem value="#ffffff">White</MenuItem>
                <MenuItem value="#000000">Black</MenuItem>
              </Select>
              <span id="background-description" className="visually-hidden">
                Choose the background color for your avatar. Transparent is recommended for most uses.
              </span>
            </FormControl>
          </Stack>
        </Stack>

        {/* Download and Copy Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon aria-hidden="true" />}
            onClick={onDownload}
            disabled={downloadDisabled || isDownloading || isCopying}
            fullWidth
            aria-label={downloadDisabled ? "Download button. Please upload an image and select a flag first." : "Download generated avatar as PNG file"}
            aria-busy={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          {onCopy && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon aria-hidden="true" />}
              onClick={onCopy}
              disabled={copyDisabled || isDownloading || isCopying}
              fullWidth
              aria-label={copyDisabled ? "Copy button. Please upload an image and select a flag first." : "Copy generated avatar to clipboard"}
              aria-busy={isCopying}
            >
              {isCopying ? 'Copying...' : 'Copy'}
            </Button>
          )}
        </Stack>
        <span className="visually-hidden" aria-live="polite">
          {downloadDisabled 
            ? "The download and copy buttons will be enabled after you upload an image and select a flag." 
            : "Click download to save your avatar as a PNG file, or copy to copy it to your clipboard."}
        </span>
      </Stack>
    </Paper>
  );
}

/**
 * Memoized ControlPanel - only re-renders when props change
 */
export const ControlPanel = React.memo(ControlPanelComponent);
