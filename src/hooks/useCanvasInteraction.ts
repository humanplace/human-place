
import { useRef } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';

export const useCanvasInteraction = () => {
  const { state, dispatch } = useCanvas();
  
  // Track touch events for panning
  const touchInfo = useRef({
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0
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

  // Touch event handlers for panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchInfo.current.isDragging = true;
      touchInfo.current.lastTouchX = e.touches[0].clientX;
      touchInfo.current.lastTouchY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchInfo.current.isDragging || e.touches.length !== 1) return;

    const tileSize = state.zoom;
    const touch = e.touches[0];
    
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

  const handleTouchEnd = () => {
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
