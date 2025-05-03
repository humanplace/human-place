import { PixelColor } from "@/context/CanvasContext";

// Draw a pixel on the canvas
export const drawPixel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: PixelColor
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
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#DDDDDD';
  ctx.strokeRect(x, y, size, size);
};

// Draw the entire grid at once to avoid overlapping lines
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number,
  tileSize: number
) => {
  // Use a consistent color for all grid lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#DDDDDD';
  
  // Start at the first visible tile boundary
  const startDrawX = startX;
  const startDrawY = startY;
  
  // Draw vertical lines
  for (let x = 0; x <= width; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(startDrawX + x, startDrawY);
    ctx.lineTo(startDrawX + x, startDrawY + height);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= height; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(startDrawX, startDrawY + y);
    ctx.lineTo(startDrawX + width, startDrawY + y);
    ctx.stroke();
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
  ctx.strokeRect(x, y, size, size);
};

// Helper function to convert color names to hex values
export const getColorHex = (color: PixelColor): string => {
  switch(color) {
    case 'black': return '#000000';
    case 'white': return '#FFFFFF';
    case 'red': return '#FF4500';
    case 'green': return '#00A550';
    case 'yellow': return '#FFD635';
    case 'blue': return '#3690EA';
    case 'brown': return '#6D482F';
    case 'purple': return '#9C51B6';
    case 'pink': return '#FF99AA';
    case 'orange': return '#FFA800';
    case 'grey': return '#898D90';
    default: return '#FFFFFF';
  }
};

// Calculate viewport settings based on container and zoom
export const calculateViewport = (
  containerWidth: number,
  containerHeight: number,
  position: { x: number, y: number },
  tileSize: number
) => {
  const tilesWide = Math.ceil(containerWidth / tileSize);
  const tilesHigh = Math.ceil(containerHeight / tileSize);
  
  // Calculate the top-left corner of the viewport in grid coordinates
  const startX = Math.floor(position.x - (tilesWide / 2));
  const startY = Math.floor(position.y - (tilesHigh / 2));
  
  // Calculate pixel offset for smooth panning
  const offsetX = (startX - Math.floor(startX)) * tileSize;
  const offsetY = (startY - Math.floor(startY)) * tileSize;
  
  return { 
    tilesWide, 
    tilesHigh, 
    startX, 
    startY, 
    offsetX, 
    offsetY 
  };
};
