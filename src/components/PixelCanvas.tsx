
import React, { useRef } from 'react';
import CanvasRenderer from './canvas/CanvasRenderer';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';

const PixelCanvas = () => {
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
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden touch-none flex items-center justify-center relative"
      style={{ border: "1px solid #ddd", background: '#fff' }}
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
  );
};

export default PixelCanvas;
