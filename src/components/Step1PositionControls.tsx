import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { ImagePosition, PositionLimits } from '@/utils/imagePosition';

const EPSILON = 0.001;

export interface Step1PositionControlsProps {
  position: ImagePosition;
  limits: PositionLimits;
  onPositionChange: (position: ImagePosition) => void;
}

/**
 * Step 1 position/zoom sliders for the shared step layout controls slot.
 * Renders move left/right, move up/down, and zoom sliders.
 */
export function Step1PositionControls({
  position,
  limits,
  onPositionChange,
}: Step1PositionControlsProps) {
  const horizontalEnabled = position.zoom > 0 || Math.abs(limits.maxX - limits.minX) > EPSILON;
  const verticalEnabled = position.zoom > 0 || Math.abs(limits.maxY - limits.minY) > EPSILON;

  return (
    <div className="adjust-controls step1-controls">
      <div className="control-group">
        <div className="slider-container">
          <div className="slider-labels-row">
            <span className="slider-end-label">Move left</span>
            <span className="slider-value">{Math.round(position.x)}%</span>
            <span className="slider-end-label">Move right</span>
          </div>
          <div className="slider-with-icons">
            <span className="slider-icon" aria-label="Move left">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <Slider.Root
              className="slider-root"
              value={[-position.x]}
              onValueChange={([value]) => {
                const invertedValue = -value;
                const clampedX = Math.max(-50, Math.min(50, invertedValue));
                onPositionChange({ ...position, x: clampedX });
              }}
              min={-50}
              max={50}
              step={1}
              disabled={!horizontalEnabled}
              aria-label="Horizontal position"
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
            <span className="slider-icon" aria-label="Move right">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="control-group">
        <div className="slider-container">
          <div className="slider-labels-row">
            <span className="slider-end-label">Move up</span>
            <span className="slider-value">{Math.round(position.y)}%</span>
            <span className="slider-end-label">Move down</span>
          </div>
          <div className="slider-with-icons">
            <span className="slider-icon" aria-label="Move up">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 15L12 9L6 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <Slider.Root
              className="slider-root"
              value={[-position.y]}
              onValueChange={([value]) => {
                const invertedValue = -value;
                const clampedY = Math.max(-50, Math.min(50, invertedValue));
                onPositionChange({ ...position, y: clampedY });
              }}
              min={-50}
              max={50}
              step={1}
              disabled={!verticalEnabled}
              aria-label="Vertical position"
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
            <span className="slider-icon" aria-label="Move down">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="control-group">
        <div className="slider-container">
          <div className="slider-labels-row">
            <span className="slider-end-label">Zoom Out</span>
            <span className="slider-value">{Math.round(position.zoom)}%</span>
            <span className="slider-end-label">Zoom In</span>
          </div>
          <div className="slider-with-icons">
            <span className="slider-icon" aria-label="Zoom out">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <Slider.Root
              className="slider-root"
              value={[position.zoom]}
              onValueChange={([value]) => {
                const clampedZoom = Math.max(0, Math.min(200, value));
                onPositionChange({ ...position, zoom: clampedZoom });
              }}
              min={0}
              max={200}
              step={1}
              aria-label="Zoom level"
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
            <span className="slider-icon" aria-label="Zoom in">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 8V16M8 12H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
