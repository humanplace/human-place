import React, { useEffect } from 'react';
import { useCanvas, CANVAS_SIZE } from '@/context/CanvasContext';
import { 
  calculateViewport, 
  drawPixel, 
  drawGridLine,
  drawOuterBorder
} from '@/utils/canvasUtils';
import { LoaderCircle } from 'lucide-react';
import { ColorCode } from '@/context/canvasTypes';

type CanvasRendererProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ containerRef, canvasRef }) => {
  const { state } = useCanvas();

  // Display loading indicator when pixels are null or loading is true
  if (state.isLoading || !state.pixels) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white w-full h-full">
        <div className="w-48 space-y-4 flex flex-col items-center">
          <h3 className="text-center font-medium">Loading Canvas...</h3>
          <LoaderCircle size={40} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Render canvas when state changes
  useEffect(() => {
    if (!canvasRef.current || !state.pixels) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Calculate tile size in pixels
    const tileSize = state.zoom;
    
    // Calculate visible area
    const container = containerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas dimensions to match container
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
    
    
    // Draw the pixels - Expand the rendering loop slightly to ensure we cover the whole visible area
    for (let y = 0; y <= viewport.tilesHigh + 1; y++) {
      for (let x = 0; x <= viewport.tilesWide + 1; x++) {
        const gridX = viewport.startX + x;
        const gridY = viewport.startY + y;
        
        // Skip pixels outside the canvas bounds
        if (gridX < 0 || gridX >= CANVAS_SIZE || gridY < 0 || gridY >= CANVAS_SIZE) {
          continue;
        }
        
        // Calculate pixel position on screen with precise coordinates
        // Use exact mathematical position without early rounding to prevent misalignment
        const pixelX = x * tileSize - viewport.offsetX;
        const pixelY = y * tileSize - viewport.offsetY;
        
        // Draw the pixel (all pixels have a color in a fully populated canvas)
        const pixelColor = state.pixels[gridY][gridX] as ColorCode;
        drawPixel(ctx, pixelX, pixelY, tileSize, pixelColor);
        
        // Draw grid lines for each tile when zoom level is 16 or higher
        if (tileSize >= 16) {
          drawGridLine(ctx, pixelX, pixelY, tileSize);
        }
        
        // Always draw the outer border for edge tiles, regardless of zoom level
        drawOuterBorder(ctx, pixelX, pixelY, tileSize, gridX, gridY, CANVAS_SIZE);
      }
    }
    

    
    // Draw pending pixel if it exists
    if (state.pendingPixel) {
      const { x, y, color } = state.pendingPixel;
      
      // Check if pending pixel is in the visible area
      const screenX = (x - viewport.startX) * tileSize - viewport.offsetX;
      const screenY = (y - viewport.startY) * tileSize - viewport.offsetY;
      
      // Only draw if it's in the visible area
      if (x >= viewport.startX && x <= viewport.startX + viewport.tilesWide && 
          y >= viewport.startY && y <= viewport.startY + viewport.tilesHigh) {
        // Draw the pending pixel
        drawPixel(ctx, screenX, screenY, tileSize, color);
        
        // Draw grid lines for pending pixel when zoom level is 16 or higher
        if (tileSize >= 16) {
          drawGridLine(ctx, screenX, screenY, tileSize);
        }
      }
    }
  }, [state, canvasRef, containerRef]);

  return null;
};

export default CanvasRenderer;
