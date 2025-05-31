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
  // Use exact pixel coordinates without rounding
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
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
  
  // Updated grid color to match header/footer (#ddd)
  const gridColor = '#ddd';
  
  // Use exact pixel coordinates
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  const lineWidth = 1;
  
  // Draw four separate filled rectangles for each border
  ctx.fillStyle = gridColor;
  
  // Top border
  ctx.fillRect(roundedX, roundedY, size, lineWidth);
  
  // Right border
  ctx.fillRect(roundedX + size - lineWidth, roundedY, lineWidth, size);
  
  // Bottom border
  ctx.fillRect(roundedX, roundedY + size - lineWidth, size, lineWidth);
  
  // Left border
  ctx.fillRect(roundedX, roundedY, lineWidth, size);
};

// Draw a border for the outer edge tiles (x=0,y=0 and x=299,y=299)
export const drawOuterBorder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gridX: number,
  gridY: number,
  canvasSize: number
) => {
  // Updated border color to match header/footer (#ddd)
  const borderColor = '#ddd';
  const borderWidth = 1;
  
  // Use exact pixel coordinates
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  
  ctx.fillStyle = borderColor;
  
  // Left border for x=0 - draw OUTSIDE the tile
  if (gridX === 0) {
    ctx.fillRect(roundedX - borderWidth, roundedY - borderWidth, borderWidth, size + (2 * borderWidth));
  }
  
  // Top border for y=0 - draw OUTSIDE the tile
  if (gridY === 0) {
    ctx.fillRect(roundedX - borderWidth, roundedY - borderWidth, size + (2 * borderWidth), borderWidth);
  }
  
  // Right border for x=canvasSize-1 (299) - draw OUTSIDE the tile
  if (gridX === canvasSize - 1) {
    ctx.fillRect(roundedX + size, roundedY - borderWidth, borderWidth, size + (2 * borderWidth));
  }
  
  // Bottom border for y=canvasSize-1 (299) - draw OUTSIDE the tile
  if (gridY === canvasSize - 1) {
    ctx.fillRect(roundedX - borderWidth, roundedY + size, size + (2 * borderWidth), borderWidth);
  }
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
  ctx.strokeRect(Math.round(x), Math.round(y), size, size);
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
  const tilesWide = Math.ceil(containerWidth / tileSize) + 1;
  const tilesHigh = Math.ceil(containerHeight / tileSize) + 1;
  
  // Calculate the top-left corner of the viewport in grid coordinates
  // Center the view on the position coordinates
  const startX = position.x - (tilesWide / 2);
  const startY = position.y - (tilesHigh / 2);
  
  // Calculate pixel offset for smooth panning (decimal part of the starting position)
  // Use precise decimal values without early rounding
  const offsetX = (startX - Math.floor(startX)) * tileSize;
  const offsetY = (startY - Math.floor(startY)) * tileSize;
  
  return { 
    tilesWide, 
    tilesHigh, 
    startX: Math.floor(startX),
    startY: Math.floor(startY),
    offsetX, 
    offsetY 
  };
};


// Convert screen coordinates to grid coordinates
export const screenToGrid = ({ clientX, clientY, canvasRect, position, zoom }: { clientX: number; clientY: number; canvasRect: DOMRect; position: { x: number; y: number }; zoom: number; }) => {
  const tileSize = zoom;
  const viewport = calculateViewport(canvasRect.width, canvasRect.height, position, tileSize);
  const canvasX = clientX - canvasRect.left;
  const canvasY = clientY - canvasRect.top;
  const gridX = viewport.startX + Math.floor((canvasX + viewport.offsetX) / tileSize);
  const gridY = viewport.startY + Math.floor((canvasY + viewport.offsetY) / tileSize);
  return { gridX, gridY };
};
