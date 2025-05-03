
import React, { useEffect, useRef } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';
import { 
  calculateViewport, 
  drawPixel, 
  drawGrid,
  drawPendingPixelBorder
} from '@/utils/canvasUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

type CanvasRendererProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ containerRef, canvasRef }) => {
  const { state } = useCanvas();

  // Display loading indicator when pixels are null or loading is true
  if (state.isLoading || !state.pixels) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
        <div className="w-48 space-y-4">
          <h3 className="text-center font-medium">Loading Canvas...</h3>
          <Progress value={75} className="h-2" />
        </div>
      </div>
    );
  }

  // Render canvas when state changes
  useEffect(() => {
    if (!canvasRef.current || !state.pixels) return;

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
        
        // Draw the pixel only if it has a color (not undefined)
        const pixelColor = state.pixels[gridY][gridX];
        if (pixelColor !== undefined) {
          drawPixel(ctx, pixelX, pixelY, tileSize, pixelColor);
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
      }
    }
    
    // Draw the grid LAST - after all pixels and pending pixels
    // Only for zoom levels 16x and above
    if (tileSize >= 16) {
      // Calculate the grid starting position and size
      const gridStartX = 0;  // Start from the left edge of the visible canvas
      const gridStartY = 0;  // Start from the top edge of the visible canvas
      
      // Draw the grid across the entire visible canvas
      drawGrid(ctx, gridStartX, gridStartY, containerWidth, containerHeight, tileSize);
    }
  }, [state, canvasRef, containerRef]);

  return null;
};

export default CanvasRenderer;
