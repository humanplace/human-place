
import React, { useRef } from 'react';
import { useCanvas } from '@/context/CanvasContext';
import CanvasRenderer from './canvas/CanvasRenderer';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';

const PixelCanvas = () => {
  const { state, dispatch } = useCanvas();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get canvas interaction handlers
  const { 
    handleClick, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd 
  } = useCanvasInteraction();

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div 
        className="border-2 border-[#333333]"
        style={{ width: "95%", height: "95%" }}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full overflow-hidden touch-none flex items-center justify-center relative"
          style={{ background: '#fff' }}
        >
          <CanvasRenderer 
            containerRef={containerRef} 
            canvasRef={canvasRef} 
          />
          <canvas
            ref={canvasRef}
            onClick={(e) => handleClick(e, canvasRef.current?.getBoundingClientRect() || new DOMRect())}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, canvasRef.current?.getBoundingClientRect() || new DOMRect())}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default PixelCanvas;
