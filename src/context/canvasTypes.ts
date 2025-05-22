
// Canvas dimensions and constants
export const CANVAS_SIZE = 100;
export const MAX_ZOOM_LEVEL = 64;
export const MIN_ZOOM_LEVEL = 1;
export const ZOOM_LEVELS = [1, 2, 4, 8, 16, 32, 64];

// Color definitions using numeric codes
export type ColorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Map numeric codes to color names for reference
export const COLOR_NAME_MAP: Record<ColorCode, string> = {
  0: 'black',
  1: 'white',
  2: 'red',
  3: 'green',
  4: 'yellow',
  5: 'blue',
  6: 'brown',
  7: 'purple',
  8: 'pink',
  9: 'orange',
  10: 'grey'
};

// Colors available for selection
export const COLORS: ColorCode[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Canvas state interface
export interface CanvasState {
  pixels: (ColorCode | undefined)[][] | null;  // Sparse array with undefined for pixels not in the database
  isLoading: boolean;  // Loading state flag
  pendingPixel: { x: number; y: number; color: ColorCode } | null;
  position: { x: number; y: number };
  zoom: number;
  selectedColor: ColorCode;
  isUserVerified: boolean;  // Track if user has completed World ID verification
}

// Actions for our reducer
export type CanvasAction =
  | { type: 'SET_PIXEL'; x: number; y: number; color: ColorCode }
  | { type: 'SET_PENDING_PIXEL'; x: number; y: number; color: ColorCode }
  | { type: 'COMMIT_PENDING_PIXEL' }
  | { type: 'CLEAR_PENDING_PIXEL' }
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'SET_ZOOM'; level: number }
  | { type: 'SELECT_COLOR'; color: ColorCode }
  | { type: 'INITIALIZE_CANVAS'; pixels: (ColorCode | undefined)[][] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_USER_VERIFIED'; verified: boolean };
