import React from 'react';
import { useCanvas, ZOOM_LEVELS, CANVAS_SIZE, type ColorCode } from '@/context/CanvasContext';
import { RefreshCw, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchAllCanvasPixels, fetchUpdatedCanvasPixels, lastUpdateTimestamp } from '@/context/canvasUtils';
import { haptics } from '@/utils/haptics';

const CANVAS_CACHE_KEY = 'canvas-data-cache';

const Header = () => {
  const { state, dispatch } = useCanvas();
  
  // Find the current zoom index and calculate next/previous
  const currentZoomIndex = ZOOM_LEVELS.findIndex(zoom => zoom === state.zoom);

  // Helper function to update the cache with current pixel data
  const updateCache = (pixelData: { x: number; y: number; color: number; updated_at: string }[]) => {
    try {
      sessionStorage.setItem(CANVAS_CACHE_KEY, JSON.stringify(pixelData));
      if (import.meta.env.DEV) {
        console.log(`Cache updated with ${pixelData.length} pixels`);
      }
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  };

  // Helper function to convert current state to cache format
  const convertStateToCache = () => {
    const cacheData: { x: number; y: number; color: number; updated_at: string }[] = [];
    
    if (state.pixels) {
      // Convert all 10,000 pixels from the fully populated canvas
      for (let y = 0; y < CANVAS_SIZE; y++) {
        for (let x = 0; x < CANVAS_SIZE; x++) {
          const color = state.pixels[y][x];
          cacheData.push({
            x,
            y,
            color: color as number,
            updated_at: new Date().toISOString() // Use current time for cache updates
          });
        }
      }
    }
    
    return cacheData;
  };

  const handleZoomIn = () => {
    if (currentZoomIndex < ZOOM_LEVELS.length - 1) {
      haptics.buttonPress();
      dispatch({ type: 'SET_ZOOM', level: ZOOM_LEVELS[currentZoomIndex + 1] });
    }
  };

  const handleZoomOut = () => {
    if (currentZoomIndex > 0) {
      haptics.buttonPress();
      dispatch({ type: 'SET_ZOOM', level: ZOOM_LEVELS[currentZoomIndex - 1] });
    }
  };

  const handleCommitPixel = () => {
    haptics.buttonPress();
    dispatch({ type: 'COMMIT_PENDING_PIXEL' });
    
    // Add toast notification when pixel is successfully placed
    toast({
      title: "🎨 Pixel Placed!",
    });
  };

  const handleRefresh = async () => {
    haptics.buttonPress();
    try {
      // Set loading state
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      let data;
      
      // Check if we have a lastUpdateTimestamp to do a differential update
      if (lastUpdateTimestamp) {
        // Fetch only updated pixels since lastUpdateTimestamp
        data = await fetchUpdatedCanvasPixels(lastUpdateTimestamp);
        
        if (import.meta.env.DEV) {
          console.log(`Refresh: fetched ${data.length} updated pixels since ${lastUpdateTimestamp}`);
        }
        
        // If we have updated pixels, apply them to the canvas
        if (data && data.length > 0) {
          // Apply updates to the canvas
          data.forEach(pixel => {
            if (pixel.x >= 0 && pixel.x < CANVAS_SIZE && pixel.y >= 0 && pixel.y < CANVAS_SIZE) {
              dispatch({ 
                type: 'SET_PIXEL',
                x: pixel.x,
                y: pixel.y,
                color: pixel.color
              });
            }
          });

          // Convert the updated state to cache format (more efficient than fetching all pixels again)
          // We need to do this in a setTimeout to ensure state has been updated
          setTimeout(() => {
            const cacheData = convertStateToCache();
            updateCache(cacheData);
          }, 0);
        }
        
        // Finished updating the canvas
        dispatch({ type: 'SET_LOADING', isLoading: false });
        
        // Simple toast message regardless of number of pixels
        toast({
          title: "✅ Canvas Refreshed!",
        });
      } else {
        // No lastUpdateTimestamp, fall back to fetching all pixels
        data = await fetchAllCanvasPixels();
        
        if (import.meta.env.DEV) {
          console.log(`Initial Refresh: fetched ${data.length} pixels`);
        }
        
        if (data && data.length === CANVAS_SIZE * CANVAS_SIZE) {
          // Initialize fully populated canvas
          const loadedPixels: ColorCode[][] = Array(CANVAS_SIZE)
            .fill(null)
            .map(() => Array(CANVAS_SIZE).fill(1)); // Default to white if pixel missing
          
          // Apply all pixels from Supabase
          data.forEach(pixel => {
            if (pixel.x >= 0 && pixel.x < CANVAS_SIZE && pixel.y >= 0 && pixel.y < CANVAS_SIZE) {
              loadedPixels[pixel.y][pixel.x] = pixel.color;
            }
          });

          // Update the canvas state with loaded pixels
          dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });

          // Update cache with the fresh data
          updateCache(data);

          toast({
            title: "✅ Canvas Refreshed!",
          });
        } else {
          // If data is incomplete, show an error message
          dispatch({ type: 'SET_LOADING', isLoading: false });
          toast({
            title: "Incomplete canvas data",
            description: `Expected ${CANVAS_SIZE * CANVAS_SIZE} pixels but got ${data?.length || 0}.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Failed to reload canvas:', error);
      
      // Set loading to false on error
      dispatch({ type: 'SET_LOADING', isLoading: false });
      
      // Show error toast
      toast({
        title: "Failed to load canvas",
        description: "Could not fetch the latest canvas data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white shadow-sm">
      <button 
        onClick={handleRefresh} 
        className="p-2"
        disabled={state.isLoading}
      >
        <RefreshCw size={24} />
      </button>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={currentZoomIndex === 0 || state.isLoading}
          className="p-2 disabled:opacity-50"
        >
          <ZoomOut size={24} />
        </button>
        
        <div className="text-sm font-medium min-w-[40px] text-center">
          {state.zoom}x
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={currentZoomIndex === ZOOM_LEVELS.length - 1 || state.isLoading}
          className="p-2 disabled:opacity-50"
        >
          <ZoomIn size={24} />
        </button>
        
        <button
          onClick={handleCommitPixel}
          disabled={!state.pendingPixel || state.isLoading}
          className="ml-2 p-2 disabled:opacity-50"
        >
          <Send size={24} className={state.pendingPixel ? "text-blue-500" : "text-gray-400"} />
        </button>
      </div>
    </header>
  );
};

export default Header;
