
import React, { useEffect, useRef } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';
import { 
  calculateViewport, 
  drawPixel, 
  drawGridLine,
  drawPendingPixelBorder
} from '@/utils/canvasUtils';

type CanvasRendererProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ containerRef, canvasRef }) => {
  const { state } = useCanvas();

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
    
    // Clear the canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate viewport settings
    const viewport = calculateViewport(
      containerWidth,
      containerHeight,
      state.position,
      tileSize
    );
    
    // Draw the pixels
    for (let y = 0; y < viewport.tilesHigh + 1; y++) {
      for (let x = 0; x < viewport.tilesWide + 1; x++) {
        const gridX = Math.floor(viewport.startX) + x;
        const gridY = Math.floor(viewport.startY) + y;
        
        // Skip pixels outside the canvas bounds
        if (gridX < 0 || gridX >= CANVAS_SIZE || gridY < 0 || gridY >= CANVAS_SIZE) {
          continue;
        }
        
        // Calculate pixel position
        const pixelX = x * tileSize - viewport.offsetX;
        const pixelY = y * tileSize - viewport.offsetY;
        
        // Draw the actual pixel
        const pixelColor = state.pixels[gridY][gridX];
        drawPixel(ctx, pixelX, pixelY, tileSize, pixelColor);
        
        // Draw grid lines for zoom levels 16x and above (changed from 8x)
        if (tileSize >= 16) {
          drawGridLine(ctx, pixelX, pixelY, tileSize);
        }
      }
    }
    
    // Draw pending pixel if it exists
    if (state.pendingPixel) {
      const { x, y, color } = state.pendingPixel;
      
      // Check if pending pixel is in the visible area
      if (x >= viewport.startX && x < viewport.startX + viewport.tilesWide && 
          y >= viewport.startY && y < viewport.startY + viewport.tilesHigh) {
        
        const pixelX = (x - viewport.startX) * tileSize - viewport.offsetX;
        const pixelY = (y - viewport.startY) * tileSize - viewport.offsetY;
        
        // Draw the pending pixel
        drawPixel(ctx, pixelX, pixelY, tileSize, color);
        drawPendingPixelBorder(ctx, pixelX, pixelY, tileSize);
      }
    }
  }, [state, canvasRef, containerRef]);

  return null;
};

export default CanvasRenderer;
