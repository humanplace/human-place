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
  pixels: PixelColor[][] | null;  // Null when data is loading
  isLoading: boolean;  // New loading state flag
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
  | { type: 'INITIALIZE_CANVAS'; pixels: PixelColor[][] }
  | { type: 'SET_LOADING'; isLoading: boolean };  // New action to set loading state

// Initial state - we start with null pixels array (loading state)
const initialState: CanvasState = {
  pixels: null,  // Start with null, will be populated from database
  isLoading: true,  // Start in loading state
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
      .from('canvas')
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
    toast({
      title: "Failed to save pixel",
      description: "Your pixel couldn't be saved to the server.",
      variant: "destructive",
    });
  }
}

// Reducer function to handle all canvas-related actions
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
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
      // Only allow zoom levels in our defined array
      const validZoomIndex = ZOOM_LEVELS.findIndex(z => z === action.level);
      if (validZoomIndex === -1) return state;
      
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

// Create the context
interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Provider component
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  
  // Load canvas data from Supabase on mount
  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        // Set loading state to true
        dispatch({ type: 'SET_LOADING', isLoading: true });
        
        // Fetch the pixels from Supabase
        const { data, error } = await supabase.from('canvas').select('x, y, color');
        
        if (error) {
          throw error;
        }

        // If data exists, convert the flat array of pixels to our 2D array format
        if (data && data.length > 0) {
          // Create an empty canvas of the correct size
          const canvasSize = CANVAS_SIZE;
          const loadedPixels = Array(canvasSize).fill(null).map(() => Array(canvasSize).fill('black' as PixelColor));
          
          // Apply all the pixels from Supabase
          data.forEach(pixel => {
            if (pixel.x >= 0 && pixel.x < canvasSize && pixel.y >= 0 && pixel.y < canvasSize) {
              loadedPixels[pixel.y][pixel.x] = pixel.color as PixelColor;
            }
          });

          // Update the canvas state with loaded pixels
          dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
        } else {
          // If no data, show an error message and keep in loading state
          toast({
            title: "Canvas data missing",
            description: "No pixel data found on the server.",
            variant: "destructive",
          });
          dispatch({ type: 'SET_LOADING', isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load canvas data:', error);
        
        // Set loading to false and display error toast
        dispatch({ type: 'SET_LOADING', isLoading: false });
        toast({
          title: "Failed to load canvas",
          description: "Couldn't connect to the database. Please try again later.",
          variant: "destructive",
        });
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
