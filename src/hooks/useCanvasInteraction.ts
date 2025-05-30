import * as React from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';
import { screenToGrid } from '@/utils/canvasUtils';
import { haptics } from '@/utils/haptics';

export const useCanvasInteraction = () => {
  const { state, dispatch } = useCanvas();
  
  // Track touch events for panning and tapping
  const touchInfo = React.useRef({
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0,
    startTouchX: 0, // Track initial touch position
    startTouchY: 0,
    isTap: true // Flag to track if the interaction is a tap or drag
  });

  // Handle click/tap on canvas to place a pixel
  const handleCanvasClick = (clientX: number, clientY: number, canvasRect: DOMRect) => {
    if (!state.pixels) return;

    const { gridX, gridY } = screenToGrid({
      clientX,
      clientY,
      canvasRect,
      position: state.position,
      zoom: state.zoom
    });

    const canvasX = clientX - canvasRect.left;
    const canvasY = clientY - canvasRect.top;
    
    // Check if the coordinates are within canvas bounds
    if (gridX >= 0 && gridX < CANVAS_SIZE && gridY >= 0 && gridY < CANVAS_SIZE) {
      dispatch({ 
        type: 'SET_PENDING_PIXEL',
        x: gridX,
        y: gridY,
        color: state.selectedColor
      });
    }
  };

  // Handle mouse click
  const handleClick = (e: React.MouseEvent, canvasRect: DOMRect) => {
    // Only handle actual clicks, not the end of drag operations
    if (!touchInfo.current.isDragging) {
      handleCanvasClick(e.clientX, e.clientY, canvasRect);
    }
  };

  // Touch event handlers for panning and tapping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchInfo.current = {
        isDragging: false,
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY,
        startTouchX: touch.clientX, // Store initial touch position
        startTouchY: touch.clientY,
        isTap: true // Start assuming it's a tap
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      // Multi-touch gestures should never be treated as a tap
      touchInfo.current.isTap = false;
      return;
    }

    const touch = e.touches[0];
    const tileSize = state.zoom;

    // Mark as dragging once movement occurs
    if (!touchInfo.current.isDragging) {
      touchInfo.current.isDragging = true;
    }

    // Recalculate tap status on every move relative to the starting point
    const startDeltaX = Math.abs(touch.clientX - touchInfo.current.startTouchX);
    const startDeltaY = Math.abs(touch.clientY - touchInfo.current.startTouchY);
    touchInfo.current.isTap = !(startDeltaX > 5 || startDeltaY > 5);
    
    // Calculate the distance moved
    const deltaX = touch.clientX - touchInfo.current.lastTouchX;
    const deltaY = touch.clientY - touchInfo.current.lastTouchY;
    
    // Update last position
    touchInfo.current.lastTouchX = touch.clientX;
    touchInfo.current.lastTouchY = touch.clientY;
    
    // Calculate new position (move in opposite direction of drag)
    // Use precise calculations without early rounding
    const newX = state.position.x - (deltaX / tileSize);
    const newY = state.position.y - (deltaY / tileSize);
    
    // Dispatch position change, clamping handled in reducer
    dispatch({ type: 'SET_POSITION', x: newX, y: newY });
  };

  const handleTouchEnd = (e: React.TouchEvent, canvasRect: DOMRect) => {
    // If it was a tap (minimal movement), place a pixel using the last touch position
    if (touchInfo.current.isTap) {
      // Add haptic feedback only for touch events
      haptics.pixelPreview();
      handleCanvasClick(
        touchInfo.current.lastTouchX,
        touchInfo.current.lastTouchY,
        canvasRect
      );
    }
    
    // Reset touch tracking state
    touchInfo.current.isDragging = false;
  };

  return {
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    touchInfo
  };
};
