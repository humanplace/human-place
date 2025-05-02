
import React from 'react';
import { useCanvas, ZOOM_LEVELS } from '@/context/CanvasContext';
import { RefreshCw, Send, ZoomIn, ZoomOut } from 'lucide-react';

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

  const handleRefresh = () => {
    // Reload the canvas from localStorage
    const savedCanvas = localStorage.getItem('pixelCanvas');
    if (savedCanvas) {
      try {
        const loadedPixels = JSON.parse(savedCanvas);
        dispatch({ type: 'INITIALIZE_CANVAS', pixels: loadedPixels });
      } catch (error) {
        console.error('Failed to reload canvas:', error);
      }
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b shadow-sm">
      <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-100">
        <RefreshCw size={24} />
      </button>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={currentZoomIndex === 0}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <ZoomOut size={24} />
        </button>
        
        <div className="text-sm font-medium min-w-[40px] text-center">
          {state.zoom}x
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={currentZoomIndex === ZOOM_LEVELS.length - 1}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <ZoomIn size={24} />
        </button>
        
        <button
          onClick={handleCommitPixel}
          disabled={!state.pendingPixel}
          className="ml-2 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <Send size={24} className={state.pendingPixel ? "text-blue-500" : "text-gray-400"} />
        </button>
      </div>
    </header>
  );
};

export default Header;
