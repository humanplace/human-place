
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { canvasReducer, initialState } from './canvasReducer';
import { fetchAllCanvasPixels } from './canvasUtils';
import { CanvasState, CanvasAction, CANVAS_SIZE } from './canvasTypes';

// Export necessary types and constants from the types file
export { CANVAS_SIZE, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, ZOOM_LEVELS, COLORS, COLOR_NAME_MAP } from './canvasTypes';
export type { ColorCode } from './canvasTypes';

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
        
        // Fetch ALL the pixels from Supabase using our helper function
        const data = await fetchAllCanvasPixels();

        console.log(`Successfully fetched ${data.length} pixels`);
        
        // If data exists, convert the flat array of pixels to our sparse format
        if (data && data.length > 0) {
          // Create a sparse canvas without filling with default colors
          const loadedPixels = Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE));
          
          // Apply all the pixels from Supabase
          data.forEach(pixel => {
            if (pixel.x >= 0 && pixel.x < CANVAS_SIZE && pixel.y >= 0 && pixel.y < CANVAS_SIZE) {
              loadedPixels[pixel.y][pixel.x] = pixel.color;
            }
          });

          // Update the canvas state with loaded pixels
          dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
          
          // Toast notification removed from here
        } else {
          // If no data, show an error message
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
