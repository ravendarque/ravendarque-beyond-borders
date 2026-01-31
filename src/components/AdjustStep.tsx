import React from 'react';
import { StepLayout } from './StepLayout';
import { PresentationModeSelector, type PresentationMode } from './PresentationModeSelector';
import { AdjustControls } from './AdjustControls';
import type { FlagSpec } from '@/flags/schema';

export interface AdjustStepProps {
  /** Rendered avatar overlay URL */
  overlayUrl: string | null;
  /** Whether avatar is currently rendering */
  isRendering: boolean;
  /** Selected flag for alt text */
  selectedFlag: FlagSpec | null;
  /** Presentation mode */
  presentation: PresentationMode;
  /** Presentation mode change handler */
  onPresentationChange: (mode: PresentationMode) => void;
  /** Border thickness */
  thickness: number;
  /** Thickness change handler */
  onThicknessChange: (value: number) => void;
  /** Flag horizontal offset in percentage (-50 to +50) */
  flagOffsetPct: number;
  /** Flag offset change handler */
  onFlagOffsetChange: (value: number) => void;
  /** Segment rotation in degrees (0-360) */
  segmentRotation: number;
  /** Segment rotation change handler */
  onSegmentRotationChange: (value: number) => void;
}

/**
 * AdjustStep - Step 3 content: Avatar preview and adjustment controls
 *
 * Single Responsibility: Render step 3 UI (preview + controls)
 */
export function AdjustStep({
  overlayUrl,
  isRendering,
  selectedFlag,
  presentation,
  onPresentationChange,
  thickness,
  onThicknessChange,
  flagOffsetPct,
  onFlagOffsetChange,
  segmentRotation,
  onSegmentRotationChange,
}: AdjustStepProps) {
  return (
    <StepLayout
      mainContent={
        <div className="avatar-preview">
          {overlayUrl ? (
            <img
              src={overlayUrl}
              alt={
                selectedFlag ? `Avatar with ${selectedFlag.displayName} border` : 'Avatar preview'
              }
              className="avatar-preview-image"
            />
          ) : (
            <div className="avatar-preview-placeholder">
              {isRendering ? 'Rendering...' : 'Loading preview...'}
            </div>
          )}
        </div>
      }
      controls={
        <>
          <PresentationModeSelector mode={presentation} onModeChange={onPresentationChange} />
          <AdjustControls
            thickness={thickness}
            onThicknessChange={onThicknessChange}
            flagOffsetPct={flagOffsetPct}
            onFlagOffsetChange={onFlagOffsetChange}
            presentation={presentation}
            segmentRotation={segmentRotation}
            onSegmentRotationChange={onSegmentRotationChange}
            selectedFlag={selectedFlag}
          />
        </>
      }
    />
  );
}
