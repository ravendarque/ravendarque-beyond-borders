import React, { useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DownloadIcon from '@mui/icons-material/Download';
import { ImageUploader } from './ImageUploader';
import { FlagSelector } from './FlagSelector';
import { PresentationControls } from './PresentationControls';
import { SliderControl } from './SliderControl';
import type { FlagSpec } from '@/flags/schema';
import type { FileValidationError } from '@/types/errors';

export interface ControlPanelProps {
  // File upload
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileError?: (error: FileValidationError) => void;

  // Flag selection
  flagId: string;
  flags: FlagSpec[];
  onFlagChange: (flagId: string) => void;

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
}

/**
 * Control panel component containing all user controls
 * Optimized with React.memo and useCallback
 */
function ControlPanelComponent({
  onFileChange,
  onFileError,
  flagId,
  flags,
  onFlagChange,
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
}: ControlPanelProps) {
  // Memoize background change handler
  const handleBgChange = useCallback(
    (event: { target: { value: string } }) => {
      onBgChange(event.target.value);
    },
    [onBgChange]
  );
  
  return (
    <Paper sx={{ p: 3 }} role="form" aria-labelledby="controls-heading">
      <Stack spacing={3}>
        {/* File Upload */}
        <div role="group" aria-labelledby="upload-group-label">
          <span id="upload-group-label" className="visually-hidden">Image Upload</span>
          <ImageUploader onFileChange={onFileChange} onError={onFileError} />
        </div>

        {/* Flag Selection */}
        <div role="group" aria-labelledby="flag-group-label">
          <span id="flag-group-label" className="visually-hidden">Flag Selection</span>
          <FlagSelector value={flagId} flags={flags} onChange={onFlagChange} />
        </div>

        {/* Presentation Style */}
        <div role="group" aria-labelledby="presentation-group-label">
          <span id="presentation-group-label" className="visually-hidden">Border Style</span>
          <PresentationControls value={presentation} onChange={onPresentationChange} />
        </div>

        {/* Border Thickness */}
        <div role="group" aria-labelledby="thickness-group-label">
          <span id="thickness-group-label" className="visually-hidden">Border Appearance</span>
          <SliderControl
            label="Border thickness"
            value={thickness}
            min={3}
            max={20}
            step={1}
            onChange={onThicknessChange}
            unit="%"
          />
        </div>

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

        {/* Download Button */}
        <Button
          variant="outlined"
          startIcon={<DownloadIcon aria-hidden="true" />}
          onClick={onDownload}
          disabled={downloadDisabled}
          fullWidth
          aria-label={downloadDisabled ? "Download button. Please upload an image and select a flag first." : "Download generated avatar as PNG file"}
          aria-describedby="download-description"
        >
          Download
        </Button>
        <span id="download-description" className="visually-hidden">
          {downloadDisabled 
            ? "The download button will be enabled after you upload an image and select a flag." 
            : "Click to download your avatar with the flag border as a PNG file."}
        </span>
      </Stack>
    </Paper>
  );
}

/**
 * Memoized ControlPanel - only re-renders when props change
 */
export const ControlPanel = React.memo(ControlPanelComponent);
