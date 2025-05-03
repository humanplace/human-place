
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Canvas dimensions and constants
export const CANVAS_SIZE = 100;
export const MAX_ZOOM_LEVEL = 64;
export const MIN_ZOOM_LEVEL = 1;
export const ZOOM_LEVELS = [1, 2, 4, 8, 16, 32, 64];

// Color options for the pixel canvas
export type PixelColor = 'black' | 'white' | 'red' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple' | 'pink' | 'orange' | 'grey';

export const COLORS: PixelColor[] = ['black', 'white', 'red', 'green', 'yellow', 'blue', 'brown', 'purple', 'pink', 'orange', 'grey'];

// Canvas state interface
interface CanvasState {
  pixels: PixelColor[][];
  pendingPixel: { x: number; y: number; color: PixelColor } | null;
  position: { x: number; y: number };
  zoom: number;
  selectedColor: PixelColor;
}

// Actions for our reducer
type CanvasAction =
  | { type: 'SET_PIXEL'; x: number; y: number; color: PixelColor }
  | { type: 'SET_PENDING_PIXEL'; x: number; y: number; color: PixelColor }
  | { type: 'COMMIT_PENDING_PIXEL' }
  | { type: 'CLEAR_PENDING_PIXEL' }
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'SET_ZOOM'; level: number }
  | { type: 'SELECT_COLOR'; color: PixelColor }
  | { type: 'INITIALIZE_CANVAS'; pixels: PixelColor[][] };

// Initial state - Changed to initialize with black pixels instead of white
const initialState: CanvasState = {
  pixels: Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('black')),
  pendingPixel: null,
  position: { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
  zoom: MIN_ZOOM_LEVEL,
  selectedColor: 'black'
};

// Helper function to update a pixel in Supabase
async function updatePixelInSupabase(x: number, y: number, color: PixelColor) {
  try {
    // Use upsert to implement "last write wins" logic
    const { error } = await supabase
      .from('pixels')
      .upsert(
        { x, y, color },
        { onConflict: 'x,y' } // The composite primary key columns
      );
    
    if (error) {
      console.error('Failed to save pixel to Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving pixel to Supabase:', error);
    // We're not going to block the UI or show an error to the user here
    // since the pixel is still saved locally, and they can try again later
  }
}

// Reducer function to handle all canvas-related actions
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_PIXEL':
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
      if (!state.pendingPixel) return state;
      
      const updatedPixels = [...state.pixels];
      const { x, y, color } = state.pendingPixel;
      updatedPixels[y][x] = color;
      
      // Save the canvas to localStorage after committing
      const canvasData = JSON.stringify(updatedPixels);
      localStorage.setItem('pixelCanvas', canvasData);
      
      // Save to Supabase (async, won't block UI)
      updatePixelInSupabase(x, y, color)
        .catch((error) => {
          toast({
            title: "Failed to save pixel",
            description: "Your pixel was saved locally but not on the server. Try refreshing later.",
            variant: "destructive",
          });
        });
      
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
      // Only allow zoom levels in our defined array
      const validZoomIndex = ZOOM_LEVELS.findIndex(z => z === action.level);
      if (validZoomIndex === -1) return state;
      
      return { ...state, zoom: action.level };
    }
    
    case 'SELECT_COLOR':
      return { ...state, selectedColor: action.color };
      
    case 'INITIALIZE_CANVAS':
      return { ...state, pixels: action.pixels };
      
    default:
      return state;
  }
}

// Create the context
interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Provider component
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  
  // Load canvas data from localStorage on mount
  useEffect(() => {
    const loadCanvasData = () => {
      try {
        const savedCanvas = localStorage.getItem('pixelCanvas');
        if (savedCanvas) {
          const loadedPixels = JSON.parse(savedCanvas) as PixelColor[][];
          // Verify the loaded data is valid
          if (Array.isArray(loadedPixels) && 
              loadedPixels.length === CANVAS_SIZE && 
              loadedPixels[0].length === CANVAS_SIZE) {
            dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
          }
        }
      } catch (error) {
        console.error('Failed to load canvas data:', error);
      }
    };
    
    loadCanvasData();
  }, []);
  
  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
}

// Custom hook to use the canvas context
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}
