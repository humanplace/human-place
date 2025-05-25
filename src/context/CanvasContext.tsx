
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

const CANVAS_CACHE_KEY = 'canvas-data-cache';

// Provider component
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  
  // Load canvas data from cache or Supabase on mount
  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        // Check for cached data first before setting any loading state
        const cachedData = sessionStorage.getItem(CANVAS_CACHE_KEY);
        let hasCachedData = false;
        
        if (cachedData) {
          try {
            const data = JSON.parse(cachedData);
            
            if (data && data.length > 0) {
              if (import.meta.env.DEV) {
                console.log(`Using cached canvas data (${data.length} pixels)`);
              }
              
              // Use cached data and initialize canvas immediately
              const loadedPixels = Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE));
              data.forEach((pixel: any) => {
                if (pixel.x >= 0 && pixel.x < CANVAS_SIZE && pixel.y >= 0 && pixel.y < CANVAS_SIZE) {
                  loadedPixels[pixel.y][pixel.x] = pixel.color;
                }
              });
              
              dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
              hasCachedData = true;
              return; // Exit early, no need for network request
            }
          } catch (error) {
            console.error('Error parsing cached data:', error);
            sessionStorage.removeItem(CANVAS_CACHE_KEY);
          }
        }
        
        // Only set loading state to true if we don't have cached data and need to fetch from network
        if (!hasCachedData) {
          dispatch({ type: 'SET_LOADING', isLoading: true });
        }
        
        // No valid cache, fetch from Supabase
        const data = await fetchAllCanvasPixels();

        if (import.meta.env.DEV) {
          console.log(`Successfully fetched ${data.length} pixels from Supabase`);
        }
        
        // Cache the data (without timestamp - cache lasts entire session)
        try {
          sessionStorage.setItem(CANVAS_CACHE_KEY, JSON.stringify(data));
        } catch (error) {
          console.error('Error caching canvas data:', error);
        }
        
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
