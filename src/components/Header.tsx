import React from 'react';
import { useCanvas, ZOOM_LEVELS, CANVAS_SIZE } from '@/context/CanvasContext';
import { RefreshCw, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchAllCanvasPixels, fetchUpdatedCanvasPixels, lastUpdateTimestamp } from '@/context/canvasUtils';

const Header = () => {
  const { state, dispatch } = useCanvas();
  
  // Find the current zoom index and calculate next/previous
  const currentZoomIndex = ZOOM_LEVELS.findIndex(zoom => zoom === state.zoom);

  const handleZoomIn = () => {
    if (currentZoomIndex < ZOOM_LEVELS.length - 1) {
      dispatch({ type: 'SET_ZOOM', level: ZOOM_LEVELS[currentZoomIndex + 1] });
    }
  };

  const handleZoomOut = () => {
    if (currentZoomIndex > 0) {
      dispatch({ type: 'SET_ZOOM', level: ZOOM_LEVELS[currentZoomIndex - 1] });
    }
  };

  const handleCommitPixel = () => {
    dispatch({ type: 'COMMIT_PENDING_PIXEL' });
    
    // Add toast notification when pixel is successfully placed
    toast({
      title: "🎨 Pixel Placed!",
    });
  };

  const handleRefresh = async () => {
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
        
        if (data && data.length > 0) {
          // Create a sparse canvas without filling with any default color
          const loadedPixels = Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE));
          
          // Apply all the pixels from Supabase
          data.forEach(pixel => {
            if (pixel.x >= 0 && pixel.x < CANVAS_SIZE && pixel.y >= 0 && pixel.y < CANVAS_SIZE) {
              loadedPixels[pixel.y][pixel.x] = pixel.color;
            }
          });

          // Update the canvas state with loaded pixels
          dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });

          toast({
            title: "✅ Canvas Refreshed!",
          });
        } else {
          // If no data, show an error message
          dispatch({ type: 'SET_LOADING', isLoading: false });
          toast({
            title: "Canvas data missing",
            description: "No pixel data found on the server.",
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
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b shadow-sm">
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
