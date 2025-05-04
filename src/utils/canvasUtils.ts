
import { ColorCode, COLOR_NAME_MAP } from "@/context/canvasTypes";

// Draw a pixel on the canvas
export const drawPixel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: ColorCode
) => {
  ctx.fillStyle = getColorHex(color);
  ctx.fillRect(x, y, size, size);
};

// Draw a grid line around a pixel (for zoom levels 8x and above)
export const drawGridLine = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  // Disable anti-aliasing for crisp lines
  ctx.imageSmoothingEnabled = false;
  
  // Set composite operation to ensure full replacement
  ctx.globalCompositeOperation = 'source-over';
  
  // Use a darker color for better visibility
  const gridColor = '#333333';
  
  // Draw four separate filled rectangles for each border
  const lineWidth = 1;
  
  // Top border
  ctx.fillStyle = gridColor;
  ctx.fillRect(x, y, size, lineWidth);
  
  // Right border
  ctx.fillRect(x + size - lineWidth, y, lineWidth, size);
  
  // Bottom border
  ctx.fillRect(x, y + size - lineWidth, size, lineWidth);
  
  // Left border
  ctx.fillRect(x, y, lineWidth, size);
};

// Draw a highlight border around a pending pixel
export const drawPendingPixelBorder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x, y, size, size);
};

// Helper function to convert color names to hex values
export const getColorHex = (color: ColorCode): string => {
  switch(color) {
    case 0: return '#000000'; // black
    case 1: return '#FFFFFF'; // white
    case 2: return '#FF4500'; // red
    case 3: return '#00A550'; // green
    case 4: return '#FFD635'; // yellow
    case 5: return '#3690EA'; // blue
    case 6: return '#6D482F'; // brown
    case 7: return '#9C51B6'; // purple
    case 8: return '#FF99AA'; // pink
    case 9: return '#FFA800'; // orange
    case 10: return '#898D90'; // grey
    default: return '#FFFFFF'; // fallback to white
  }
};

// Helper function to get color name from code (for accessibility and logging)
export const getColorName = (colorCode: ColorCode): string => {
  return COLOR_NAME_MAP[colorCode];
};

// Calculate viewport settings based on container and zoom
export const calculateViewport = (
  containerWidth: number,
  containerHeight: number,
  position: { x: number, y: number },
  tileSize: number
) => {
  // Calculate how many tiles can fit in the container
  const tilesWide = Math.ceil(containerWidth / tileSize) + 1; // Add 1 extra tile to prevent gaps
  const tilesHigh = Math.ceil(containerHeight / tileSize) + 1; // Add 1 extra tile to prevent gaps
  
  // Calculate the top-left corner of the viewport in grid coordinates
  // Center the view on the position coordinates
  const startX = position.x - (tilesWide / 2);
  const startY = position.y - (tilesHigh / 2);
  
  // Calculate pixel offset for smooth panning (decimal part of the starting position)
  const offsetX = (startX - Math.floor(startX)) * tileSize;
  const offsetY = (startY - Math.floor(startY)) * tileSize;
  
  return { 
    tilesWide, 
    tilesHigh, 
    startX: Math.floor(startX),  // Floor to get the integer grid position
    startY: Math.floor(startY),  // Floor to get the integer grid position
    offsetX, 
    offsetY 
  };
};
