
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
  // Disable anti-aliasing for crisp lines
  ctx.imageSmoothingEnabled = false;
  
  // Use a fully opaque color for grid lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(221, 221, 221, 1.0)';
  
  // Start at the first visible tile boundary
  const startDrawX = startX;
  const startDrawY = startY;
  
  // Draw all vertical lines in a single path
  ctx.beginPath();
  for (let x = 0; x <= width; x += tileSize) {
    // Use 0.5 offset for crisp 1px lines
    const xPos = Math.floor(startDrawX + x) + 0.5;
    ctx.moveTo(xPos, startDrawY);
    ctx.lineTo(xPos, startDrawY + height);
  }
  ctx.stroke();
  
  // Draw all horizontal lines in a single path
  ctx.beginPath();
  for (let y = 0; y <= height; y += tileSize) {
    // Use 0.5 offset for crisp 1px lines
    const yPos = Math.floor(startDrawY + y) + 0.5;
    ctx.moveTo(startDrawX, yPos);
    ctx.lineTo(startDrawX + width, yPos);
  }
  ctx.stroke();
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
