import React from 'react';
import { RENDER_SIZES } from '@/constants';

interface AvatarPreviewCanvasProps {
  /** Ref created by useAvatarPreview, attached to the canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** True while a render is in progress — shows subtle loading state */
  isRendering: boolean;
  /** Render resolution to use as canvas width/height attributes */
  size?: number;
}

/**
 * AvatarPreviewCanvas — Step 3 live preview display
 *
 * Renders a <canvas> element that the WebGL live renderer draws to directly.
 * No background-image, no blob URL, no CSS transitions — the canvas IS the preview.
 *
 * The canvas fills the avatar-circle-wrapper and is clipped to a circle via CSS.
 * The renderer paints the full composition (image + flag border) into it each frame.
 */
export function AvatarPreviewCanvas({
  canvasRef,
  isRendering,
  size = RENDER_SIZES.PREVIEW,
}: AvatarPreviewCanvasProps) {
  return (
    <div className="avatar-circle-wrapper readonly" data-testid="avatar-preview-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`avatar-preview-canvas${isRendering ? ' avatar-preview-canvas--rendering' : ''}`}
        role="img"
        aria-label="Profile picture preview"
      />
    </div>
  );
}
