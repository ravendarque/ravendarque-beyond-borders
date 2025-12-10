import React from 'react';

export type PresentationMode = 'ring' | 'segment' | 'cutout';

export interface PresentationModeSelectorProps {
  /** Current presentation mode */
  mode: PresentationMode;
  /** Callback when mode changes */
  onModeChange: (mode: PresentationMode) => void;
}

/**
 * PresentationModeSelector - Toggle buttons for ring/segment/cutout modes
 * 
 * Single Responsibility: Presentation mode selection UI
 */
export function PresentationModeSelector({ mode, onModeChange }: PresentationModeSelectorProps) {
  return (
    <div className="presentation-controls">
      <div className="presentation-toggle-group" role="radiogroup" aria-label="Presentation style">
        <button
          type="button"
          className={`presentation-toggle ${mode === 'ring' ? 'selected' : ''}`}
          onClick={() => onModeChange('ring')}
          aria-pressed={mode === 'ring'}
          aria-label="Ring - Full circular border around the entire avatar"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Ring</span>
        </button>
        <button
          type="button"
          className={`presentation-toggle ${mode === 'segment' ? 'selected' : ''}`}
          onClick={() => onModeChange('segment')}
          aria-pressed={mode === 'segment'}
          aria-label="Segment - Partial arc border on one side of the avatar"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="16" y1="22" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="4" y1="16" x2="10" y2="16" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="22" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Segment</span>
        </button>
        <button
          type="button"
          className={`presentation-toggle ${mode === 'cutout' ? 'selected' : ''}`}
          onClick={() => onModeChange('cutout')}
          aria-pressed={mode === 'cutout'}
          aria-label="Cutout - Flag pattern fills the border area completely"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="4" width="30" height="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Cutout</span>
        </button>
      </div>
    </div>
  );
}

