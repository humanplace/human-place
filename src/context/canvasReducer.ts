import { CanvasState, CanvasAction } from './canvasTypes';
import { updatePixelInSupabase } from './canvasUtils';
import { CANVAS_SIZE } from './canvasTypes';

// Initial state - we start with null pixels array (loading state)
export const initialState: CanvasState = {
  pixels: null,  // Start with null, will be populated from database
  isLoading: true,  // Start in loading state
  pendingPixel: null,
  position: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
  zoom: 1,
  selectedColor: 0 // Default to black (0)
};

// Reducer function to handle all canvas-related actions
export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_PIXEL':
      // Ensure pixels array exists before updating
      if (!state.pixels) return state;
      
      const newPixels = [...state.pixels];
      newPixels[action.y][action.x] = action.color;
      return { ...state, pixels: newPixels };
      
    case 'SET_PENDING_PIXEL':
      return { 
        ...state, 
        pendingPixel: { 
          x: action.x, 
          y: action.y, 
          color: state.selectedColor 
        }
      };
      
    case 'COMMIT_PENDING_PIXEL':
      if (!state.pendingPixel || !state.pixels) return state;
      
      const updatedPixels = [...state.pixels];
      const { x, y, color } = state.pendingPixel;
      updatedPixels[y][x] = color;
      
      // Save to Supabase (async, won't block UI)
      updatePixelInSupabase(x, y, color);
      
      return {
        ...state,
        pixels: updatedPixels,
        pendingPixel: null
      };
      
    case 'CLEAR_PENDING_PIXEL':
      return { ...state, pendingPixel: null };
      
    case 'SET_POSITION': {
      // Clamp position to valid range based on canvas size
      const maxOffset = CANVAS_SIZE - 1;
      const x = Math.max(0, Math.min(action.x, maxOffset));
      const y = Math.max(0, Math.min(action.y, maxOffset));
      return { ...state, position: { x, y } };
    }
    
    case 'SET_ZOOM': {
      return { ...state, zoom: action.level };
    }
    
    case 'SELECT_COLOR':
      return { ...state, selectedColor: action.color };
      
    case 'INITIALIZE_CANVAS':
      return { 
        ...state, 
        pixels: action.pixels,
        isLoading: false  // Set loading to false when canvas is initialized
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
      
    default:
      return state;
  }
}
