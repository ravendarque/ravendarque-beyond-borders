import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { PresentationMode } from './PresentationModeSelector';
import type { FlagSpec } from '@/flags/schema';

export interface AdjustControlsProps {
  /** Border thickness (5-15) */
  thickness: number;
  /** Thickness change handler */
  onThicknessChange: (value: number) => void;
  /** Flag horizontal offset in percentage (-50 to +50) */
  flagOffsetPct: number;
  /** Flag offset change handler */
  onFlagOffsetChange: (value: number) => void;
  /** Current presentation mode */
  presentation: PresentationMode;
  /** Segment rotation in degrees (0-360) */
  segmentRotation: number;
  /** Segment rotation change handler */
  onSegmentRotationChange: (value: number) => void;
  /** Selected flag (to check if horizontal offset is meaningful) */
  selectedFlag: FlagSpec | null;
}

/**
 * AdjustControls - Slider controls for adjusting avatar border
 *
 * Single Responsibility: Render and handle slider controls for:
 * - Border thickness
 * - Flag horizontal offset (cutout mode only)
 */
export function AdjustControls({
  thickness,
  onThicknessChange,
  flagOffsetPct,
  onFlagOffsetChange,
  presentation,
  segmentRotation,
  onSegmentRotationChange,
  selectedFlag,
}: AdjustControlsProps) {
  return (
    <div className="adjust-controls">
      {/* Thickness Slider */}
      <div className="control-group">
        <div className="slider-container">
          <div className="slider-labels-row">
            <span className="slider-end-label">Thinner</span>
            <span className="slider-value">{thickness}%</span>
            <span className="slider-end-label">Thicker</span>
          </div>
          <div className="slider-with-icons">
            <span className="slider-icon" aria-label="Thinner border">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </span>
            <Slider.Root
              className="slider-root"
              value={[thickness]}
              onValueChange={([value]) => onThicknessChange(value)}
              min={5}
              max={15}
              step={1}
              aria-label="Border thickness"
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
            <span className="slider-icon" aria-label="Thicker border">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Rotation Slider - Only for Segment Mode */}
      {presentation === 'segment' && (
        <div className="control-group">
          <div className="slider-container">
            <div className="slider-labels-row">
              <span className="slider-end-label">Rotate R</span>
              <span className="slider-value">{Math.round(segmentRotation)}°</span>
              <span className="slider-end-label">Rotate L</span>
            </div>
            <div className="slider-with-icons">
              <span className="slider-icon" aria-label="Rotate counter-clockwise">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 7 A8 8 0 1 0 7 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M22.5 7 L17.5 10 L21.5 12.5 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <Slider.Root
                className="slider-root"
                value={[segmentRotation]}
                onValueChange={([value]) => onSegmentRotationChange(value)}
                min={-180}
                max={180}
                step={5}
                aria-label="Segment rotation"
              >
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" />
              </Slider.Root>
              <span className="slider-icon" aria-label="Rotate clockwise">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7 A8 8 0 1 1 17 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M1.5 7 L6.5 10 L2.5 12.5 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Offset Slider - Only for Cutout Mode when offsetEnabled is true */}
      {presentation === 'cutout' && selectedFlag?.modes?.cutout?.offsetEnabled && (
        <div className="control-group">
          <div className="slider-container">
            <div className="slider-labels-row">
              <span className="slider-end-label">Flag L</span>
              <span className="slider-value">{Math.round(flagOffsetPct)}%</span>
              <span className="slider-end-label">Flag R</span>
            </div>
            <div className="slider-with-icons">
              <span className="slider-icon" aria-label="Left offset">
                <svg
                  width="26"
                  height="20"
                  viewBox="0 0 26 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="2"
                    width="24"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    fill="none"
                  />
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
              <Slider.Root
                className="slider-root"
                value={[flagOffsetPct]}
                onValueChange={([value]) => onFlagOffsetChange(value)}
                min={-50}
                max={50}
                step={1}
                aria-label="Flag horizontal offset"
              >
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" />
              </Slider.Root>
              <span className="slider-icon" aria-label="Right offset">
                <svg
                  width="26"
                  height="20"
                  viewBox="0 0 26 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="2"
                    width="24"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    fill="none"
                  />
                  <circle cx="16" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
