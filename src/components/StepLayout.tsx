import React from 'react';

export interface StepLayoutProps {
  /** Main content slot (image circle, flag selector, or adjust preview) */
  mainContent: React.ReactNode;
  /** Optional controls slot (sliders, mode toggles); empty for step 2 */
  controls?: React.ReactNode;
}

/**
 * StepLayout - Shared layout for all three steps (Image, Flag, Adjust).
 * Renders a main content slot and an optional controls slot so structure,
 * spacing, and gap-from-edge are defined once (fixes #172).
 */
export function StepLayout({ mainContent, controls }: StepLayoutProps) {
  return (
    <div className="step-layout">
      <div className="step-layout__main">{mainContent}</div>
      {controls != null && <div className="step-layout__controls">{controls}</div>}
    </div>
  );
}
