import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { PresentationMode } from './PresentationModeSelector';

export interface AdjustControlsProps {
  /** Border thickness (5-15) */
  thickness: number;
  /** Thickness change handler */
  onThicknessChange: (value: number) => void;
  /** Inset/outset percentage (-10 to 10) */
  insetPct: number;
  /** Inset change handler */
  onInsetChange: (value: number) => void;
  /** Flag horizontal offset in pixels (full flag width range) */
  flagOffsetX: number;
  /** Flag offset change handler */
  onFlagOffsetChange: (value: number) => void;
  /** Current presentation mode */
  presentation: PresentationMode;
}

/**
 * AdjustControls - Slider controls for adjusting avatar border
 * 
 * Single Responsibility: Render and handle slider controls for:
 * - Border thickness
 * - Border inset/outset
 * - Flag horizontal offset (cutout mode only)
 */
export function AdjustControls({
  thickness,
  onThicknessChange,
  insetPct,
  onInsetChange,
  flagOffsetX,
  onFlagOffsetChange,
  presentation,
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none"/>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Inset Slider */}
      <div className="control-group">
        <div className="slider-container">
          <div className="slider-labels-row">
            <span className="slider-end-label">Inset</span>
            <span className="slider-value">{insetPct}%</span>
            <span className="slider-end-label">Outset</span>
          </div>
          <div className="slider-with-icons">
            <span className="slider-icon" aria-label="Inset (inside frame)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </span>
            <Slider.Root
              className="slider-root"
              value={[insetPct]}
              onValueChange={([value]) => onInsetChange(value)}
              min={-10}
              max={10}
              step={1}
              aria-label="Border inset/outset"
            >
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
            <span className="slider-icon" aria-label="Outset (more visible)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none"/>
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Offset Slider - Only for Cutout Mode */}
      {presentation === 'cutout' && (
        <div className="control-group">
          <div className="slider-container">
            <div className="slider-labels-row">
              <span className="slider-end-label">Flag L</span>
              <span className="slider-value">{Math.round((flagOffsetX / 512) * 100)}%</span>
              <span className="slider-end-label">Flag R</span>
            </div>
            <div className="slider-with-icons">
              <span className="slider-icon" aria-label="Left offset">
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="2" width="24" height="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
                </svg>
              </span>
              <Slider.Root
                className="slider-root"
                value={[flagOffsetX]}
                onValueChange={([value]) => onFlagOffsetChange(value)}
                min={-256}
                max={256}
                step={1}
                aria-label="Flag horizontal offset"
              >
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" />
              </Slider.Root>
              <span className="slider-icon" aria-label="Right offset">
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="2" width="24" height="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
                  <circle cx="16" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

