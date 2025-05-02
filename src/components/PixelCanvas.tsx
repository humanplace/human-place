
import React, { useRef, useEffect } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';

const PixelCanvas = () => {
  const { state, dispatch } = useCanvas();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track touch events for panning
  const touchInfo = useRef({
    isDragging: false,
    lastTouchX: 0,
    lastTouchY: 0
  });

  // Handle click/tap on canvas to place a pixel
  const handleCanvasClick = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate tile size based on zoom level
    const tileSize = state.zoom;
    
    // Calculate the grid position based on pixel coordinates
    const x = Math.floor((clientX - rect.left) / tileSize);
    const y = Math.floor((clientY - rect.top) / tileSize);
    
    // Adjust for viewport offset
    const viewportX = Math.floor(state.position.x - (rect.width / (2 * tileSize)));
    const viewportY = Math.floor(state.position.y - (rect.height / (2 * tileSize)));
    
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

  const handleClick = (e: React.MouseEvent) => {
    // Only handle actual clicks, not the end of drag operations
    if (!touchInfo.current.isDragging) {
      handleCanvasClick(e.clientX, e.clientY);
    }
  };

  // Render canvas when state changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate tile size in pixels
    const tileSize = state.zoom;
    
    // Calculate visible area
    const container = containerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas dimensions
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Calculate position offset
    const tilesWide = Math.ceil(containerWidth / tileSize);
    const tilesHigh = Math.ceil(containerHeight / tileSize);
    
    // Calculate the top-left corner of the viewport in grid coordinates
    const startX = Math.floor(state.position.x - (tilesWide / 2));
    const startY = Math.floor(state.position.y - (tilesHigh / 2));
    
    // Clear the canvas
    ctx.fillStyle = '#f0f0f0'; // Background color for areas outside canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate pixel offset for smooth panning
    const offsetX = (startX - Math.floor(startX)) * tileSize;
    const offsetY = (startY - Math.floor(startY)) * tileSize;
    
    // Draw the pixels
    for (let y = 0; y < tilesHigh + 1; y++) {
      for (let x = 0; x < tilesWide + 1; x++) {
        const gridX = Math.floor(startX) + x;
        const gridY = Math.floor(startY) + y;
        
        // Skip pixels outside the canvas bounds
        if (gridX < 0 || gridX >= CANVAS_SIZE || gridY < 0 || gridY >= CANVAS_SIZE) {
          continue;
        }
        
        // Draw pixel
        const pixelX = x * tileSize - offsetX;
        const pixelY = y * tileSize - offsetY;
        
        // Draw the actual pixel
        const pixelColor = state.pixels[gridY][gridX];
        ctx.fillStyle = `theme('colors.canvas.${pixelColor}')`;
        
        // Use the Tailwind color values directly
        switch(pixelColor) {
          case 'black': ctx.fillStyle = '#000000'; break;
          case 'white': ctx.fillStyle = '#FFFFFF'; break;
          case 'red': ctx.fillStyle = '#FF4500'; break;
          case 'green': ctx.fillStyle = '#00A550'; break;
          case 'yellow': ctx.fillStyle = '#FFD635'; break;
          case 'blue': ctx.fillStyle = '#3690EA'; break;
          case 'brown': ctx.fillStyle = '#6D482F'; break;
          case 'purple': ctx.fillStyle = '#9C51B6'; break;
          case 'pink': ctx.fillStyle = '#FF99AA'; break;
          case 'orange': ctx.fillStyle = '#FFA800'; break;
          case 'grey': ctx.fillStyle = '#898D90'; break;
          default: ctx.fillStyle = '#FFFFFF';
        }
        
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
        
        // Draw grid lines for zoom levels 8x and above
        if (tileSize >= 8) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#DDDDDD';
          ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
        }
      }
    }
    
    // Draw pending pixel if it exists
    if (state.pendingPixel) {
      const { x, y, color } = state.pendingPixel;
      
      // Check if pending pixel is in the visible area
      if (x >= startX && x < startX + tilesWide && y >= startY && y < startY + tilesHigh) {
        const pixelX = (x - startX) * tileSize - offsetX;
        const pixelY = (y - startY) * tileSize - offsetY;
        
        switch(color) {
          case 'black': ctx.fillStyle = '#000000'; break;
          case 'white': ctx.fillStyle = '#FFFFFF'; break;
          case 'red': ctx.fillStyle = '#FF4500'; break;
          case 'green': ctx.fillStyle = '#00A550'; break;
          case 'yellow': ctx.fillStyle = '#FFD635'; break;
          case 'blue': ctx.fillStyle = '#3690EA'; break;
          case 'brown': ctx.fillStyle = '#6D482F'; break;
          case 'purple': ctx.fillStyle = '#9C51B6'; break;
          case 'pink': ctx.fillStyle = '#FF99AA'; break;
          case 'orange': ctx.fillStyle = '#FFA800'; break;
          case 'grey': ctx.fillStyle = '#898D90'; break;
          default: ctx.fillStyle = '#FFFFFF';
        }
        
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
        
        // Add a highlight border to show it's pending
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
      }
    }
    
  }, [state]);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-hidden touch-none"
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cursor-pointer"
      />
    </div>
  );
};

export default PixelCanvas;
