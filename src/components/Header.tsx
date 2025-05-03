
import React from 'react';
import { useCanvas, ZOOM_LEVELS, CANVAS_SIZE } from '@/context/CanvasContext';
import { RefreshCw, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  };

  const handleRefresh = async () => {
    try {
      // Show loading toast
      toast({
        title: "Loading canvas...",
        description: "Fetching the latest canvas data from the server.",
      });

      // Fetch the pixels from Supabase
      const { data, error } = await supabase.from('canvas').select('x, y, color');
      
      if (error) {
        throw error;
      }

      // Convert the flat array of pixels to our 2D array format
      if (data && data.length > 0) {
        // Create a canvas with default black pixels
        const canvasSize = CANVAS_SIZE;
        const loadedPixels = Array(canvasSize).fill(null).map(() => Array(canvasSize).fill('black'));
        
        // Apply all the pixels from Supabase
        data.forEach(pixel => {
          if (pixel.x >= 0 && pixel.x < canvasSize && pixel.y >= 0 && pixel.y < canvasSize) {
            loadedPixels[pixel.y][pixel.x] = pixel.color;
          }
        });

        // Update the canvas state with loaded pixels
        dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });

        // Show success toast
        toast({
          title: "Canvas loaded!",
          description: `Successfully loaded ${data.length} pixels from the server.`,
        });
      } else {
        // If no data, show an error message
        toast({
          title: "Canvas data missing",
          description: "No pixel data found on the server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to reload canvas:', error);
      
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
      <button onClick={handleRefresh} className="p-2">
        <RefreshCw size={24} />
      </button>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={currentZoomIndex === 0}
          className="p-2 disabled:opacity-50"
        >
          <ZoomOut size={24} />
        </button>
        
        <div className="text-sm font-medium min-w-[40px] text-center">
          {state.zoom}x
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={currentZoomIndex === ZOOM_LEVELS.length - 1}
          className="p-2 disabled:opacity-50"
        >
          <ZoomIn size={24} />
        </button>
        
        <button
          onClick={handleCommitPixel}
          disabled={!state.pendingPixel}
          className="ml-2 p-2 disabled:opacity-50"
        >
          <Send size={24} className={state.pendingPixel ? "text-blue-500" : "text-gray-400"} />
        </button>
      </div>
    </header>
  );
};

export default Header;
