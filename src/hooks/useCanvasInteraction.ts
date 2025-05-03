
import { useRef, useState } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';

export const useCanvasInteraction = () => {
  const { state, dispatch } = useCanvas();
  
  // Track touch events for panning and tapping
  const touchInfo = useRef({
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0,
    startTouchX: 0, // Track initial touch position
    startTouchY: 0,
    isTap: true // Flag to track if the interaction is a tap or drag
  });

  // Handle click/tap on canvas to place a pixel
  const handleCanvasClick = (clientX: number, clientY: number, canvasRect: DOMRect) => {
    // Calculate tile size based on zoom level
    const tileSize = state.zoom;
    
    // Calculate the grid position based on pixel coordinates
    const x = Math.floor((clientX - canvasRect.left) / tileSize);
    const y = Math.floor((clientY - canvasRect.top) / tileSize);
    
    // Adjust for viewport offset
    const viewportX = Math.floor(state.position.x - (canvasRect.width / (2 * tileSize)));
    const viewportY = Math.floor(state.position.y - (canvasRect.height / (2 * tileSize)));
    
    const gridX = x + viewportX;
    const gridY = y + viewportY;
    
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
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const tileSize = state.zoom;
    
    // Set isDragging to true once the user starts moving their finger
    if (!touchInfo.current.isDragging) {
      touchInfo.current.isDragging = true;
      
      // If there is significant movement, it's not a tap
      touchInfo.current.isTap = false;
    }
    
    // Calculate the distance moved
    const deltaX = touch.clientX - touchInfo.current.lastTouchX;
    const deltaY = touch.clientY - touchInfo.current.lastTouchY;
    
    // Update last position
    touchInfo.current.lastTouchX = touch.clientX;
    touchInfo.current.lastTouchY = touch.clientY;
    
    // Calculate new position (move in opposite direction of drag)
    const newX = state.position.x - (deltaX / tileSize);
    const newY = state.position.y - (deltaY / tileSize);
    
    // Dispatch position change, clamping handled in reducer
    dispatch({ type: 'SET_POSITION', x: newX, y: newY });
  };

  const handleTouchEnd = (e: React.TouchEvent, canvasRect: DOMRect) => {
    // If it was a tap (minimal movement), place a pixel
    if (touchInfo.current.isTap) {
      // Use the starting touch position for accurate placement
      handleCanvasClick(
        touchInfo.current.startTouchX, 
        touchInfo.current.startTouchY, 
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
