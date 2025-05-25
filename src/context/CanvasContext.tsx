
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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

// Helper to initialize state from sessionStorage before first render
function getInitialCanvasState(): { state: CanvasState; hasCache: boolean } {
  try {
    const cached = sessionStorage.getItem(CANVAS_CACHE_KEY);
    if (cached) {
        const data: { x: number; y: number; color: ColorCode }[] = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          const loadedPixels = Array(CANVAS_SIZE)
            .fill(null)
            .map(() => Array(CANVAS_SIZE));
        data.forEach((pixel) => {
          if (
            pixel.x >= 0 &&
            pixel.x < CANVAS_SIZE &&
            pixel.y >= 0 &&
            pixel.y < CANVAS_SIZE
          ) {
            loadedPixels[pixel.y][pixel.x] = pixel.color;
          }
        });
        return { state: { ...initialState, pixels: loadedPixels, isLoading: false }, hasCache: true };
      }
    }
  } catch (error) {
    console.error('Error parsing cached canvas data:', error);
    sessionStorage.removeItem(CANVAS_CACHE_KEY);
  }
  return { state: initialState, hasCache: false };
}

// Provider component
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  // Determine initial state and whether cached data was used
  const initRef = useRef(getInitialCanvasState());
  const [state, dispatch] = useReducer(canvasReducer, initRef.current.state);
  const hasCache = initRef.current.hasCache;
  
  // Fetch canvas data from Supabase if no cache was loaded
  useEffect(() => {
    if (hasCache) return;

    const loadCanvasData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', isLoading: true });

        const data = await fetchAllCanvasPixels();

        if (import.meta.env.DEV) {
          console.log(`Successfully fetched ${data.length} pixels from Supabase`);
        }

        try {
          sessionStorage.setItem(CANVAS_CACHE_KEY, JSON.stringify(data));
        } catch (error) {
          console.error('Error caching canvas data:', error);
        }

        if (data && data.length > 0) {
          const loadedPixels = Array(CANVAS_SIZE)
            .fill(null)
            .map(() => Array(CANVAS_SIZE));

          data.forEach((pixel: { x: number; y: number; color: ColorCode }) => {
            if (
              pixel.x >= 0 &&
              pixel.x < CANVAS_SIZE &&
              pixel.y >= 0 &&
              pixel.y < CANVAS_SIZE
            ) {
              loadedPixels[pixel.y][pixel.x] = pixel.color;
            }
          });

          dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
        } else {
          toast({
            title: 'Canvas data missing',
            description: 'No pixel data found on the server.',
            variant: 'destructive',
          });
          dispatch({ type: 'SET_LOADING', isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load canvas data:', error);

        dispatch({ type: 'SET_LOADING', isLoading: false });
        toast({
          title: 'Failed to load canvas',
          description: "Couldn't connect to the database. Please try again later.",
          variant: 'destructive',
        });
      }
    };

    loadCanvasData();
  }, [hasCache]);
  
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
