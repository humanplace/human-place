
// Canvas dimensions and constants
export const CANVAS_SIZE = 100;
export const MAX_ZOOM_LEVEL = 64;
export const MIN_ZOOM_LEVEL = 1;
export const ZOOM_LEVELS = [1, 2, 4, 8, 16, 32, 64];

// Color options for the pixel canvas
export type PixelColor = 'black' | 'white' | 'red' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple' | 'pink' | 'orange' | 'grey';

export const COLORS: PixelColor[] = ['black', 'white', 'red', 'green', 'yellow', 'blue', 'brown', 'purple', 'pink', 'orange', 'grey'];

// Canvas state interface
export interface CanvasState {
  pixels: (PixelColor | undefined)[][] | null;  // Sparse array with undefined for pixels not in the database
  isLoading: boolean;  // Loading state flag
  pendingPixel: { x: number; y: number; color: PixelColor } | null;
  position: { x: number; y: number };
  zoom: number;
  selectedColor: PixelColor;
}

// Actions for our reducer
export type CanvasAction =
  | { type: 'SET_PIXEL'; x: number; y: number; color: PixelColor }
  | { type: 'SET_PENDING_PIXEL'; x: number; y: number; color: PixelColor }
  | { type: 'COMMIT_PENDING_PIXEL' }
  | { type: 'CLEAR_PENDING_PIXEL' }
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'SET_ZOOM'; level: number }
  | { type: 'SELECT_COLOR'; color: PixelColor }
  | { type: 'INITIALIZE_CANVAS'; pixels: (PixelColor | undefined)[][] }
  | { type: 'SET_LOADING'; isLoading: boolean };
