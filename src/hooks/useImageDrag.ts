import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { ImagePosition, PositionLimits } from '@/utils/imagePosition';

export interface UseImageDragOptions {
  /** Current position */
  position: ImagePosition;
  /** Position limits */
  limits: PositionLimits;
  /** Callback when position changes */
  onPositionChange: (position: ImagePosition) => void;
  /** Whether dragging is enabled */
  enabled?: boolean;
}

/**
 * Hook for handling drag interactions to reposition image
 * 
 * Supports both mouse and touch events for repositioning the profile picture
 * in step 1. Updates position state and calls onPositionChange callback.
 */
export function useImageDrag({
  position,
  limits,
  onPositionChange,
  enabled = true,
}: UseImageDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragStart, setHasDragStart] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startPosition: ImagePosition } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const getEventPosition = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!enabled) return;
      
      // Don't prevent default on mousedown - let clicks through for file selection
      // Only prevent default when we detect actual movement
      
      const bounds = elementRef.current?.getBoundingClientRect();
      if (!bounds) return;
      
      const eventPos = getEventPosition(e.nativeEvent);
      
      dragStartRef.current = {
        x: eventPos.x,
        y: eventPos.y,
        startPosition: { ...position },
      };
      
      // Set flag to trigger useEffect for event listeners
      setHasDragStart(true);
    },
    [enabled, position, getEventPosition]
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !enabled) return;
      
      // Prevent default once we start moving (it's definitely a drag)
      e.preventDefault();
      
      // Set dragging state on first movement
      if (!isDragging) {
        setIsDragging(true);
      }
      
      const bounds = elementRef.current?.getBoundingClientRect();
      if (!bounds) return;
      
      const eventPos = getEventPosition(e);
      
      // Calculate movement in pixels
      const deltaX = eventPos.x - dragStartRef.current.x;
      const deltaY = eventPos.y - dragStartRef.current.y;
      
      // Convert pixel movement to percentage
      // Movement is relative to circle radius
      const radius = bounds.width / 2;
      const deltaXPercent = (deltaX / radius) * 100;
      const deltaYPercent = (deltaY / radius) * 100;
      
      // Invert direction: dragging right should show more of the right side (decrease x)
      // Dragging left should show more of the left side (increase x)
      // Dragging down should show more of the bottom (decrease y)
      // Dragging up should show more of the top (increase y)
      
      // Check if axes are disabled (min === max === 0 means no movement allowed)
      const horizontalDisabled = limits.minX === 0 && limits.maxX === 0;
      const verticalDisabled = limits.minY === 0 && limits.maxY === 0;
      
      // Only update position for enabled axes
      const newX = horizontalDisabled 
        ? dragStartRef.current.startPosition.x 
        : dragStartRef.current.startPosition.x - deltaXPercent;
      const newY = verticalDisabled 
        ? dragStartRef.current.startPosition.y 
        : dragStartRef.current.startPosition.y - deltaYPercent;
      
      const newPosition: ImagePosition = {
        x: newX,
        y: newY,
        zoom: dragStartRef.current.startPosition.zoom,
      };
      
      // Clamp to fixed range (-50 to +50), not to limits
      // Position is stored as a fixed percentage independent of zoom
      // Limits are only used for display mapping, not for constraining the stored value
      const clampedX = Math.max(-50, Math.min(50, newPosition.x));
      const clampedY = Math.max(-50, Math.min(50, newPosition.y));
      
      onPositionChange({
        x: clampedX,
        y: clampedY,
        zoom: newPosition.zoom,
      });
    },
    [isDragging, limits, onPositionChange, enabled, getEventPosition]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setHasDragStart(false);
    dragStartRef.current = null;
  }, []);

  // Set up global event listeners when drag starts
  useEffect(() => {
    if (!hasDragStart) return;
    
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = () => {
      handleEnd();
    };
    const handleTouchMove = (e: TouchEvent) => {
      handleMove(e);
    };
    const handleTouchEnd = () => {
      handleEnd();
    };
    
    // Prevent text selection during drag
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('selectstart', handleSelectStart);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [hasDragStart, handleMove, handleEnd]);

  const setElementRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  return {
    isDragging,
    dragHandlers: {
      onMouseDown: handleStart,
      onTouchStart: handleStart,
    },
    setElementRef,
  };
}
