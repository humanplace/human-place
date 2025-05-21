
import React from 'react';
import { COLORS } from '@/context/canvasTypes';
import { getColorHex } from '@/utils/canvasUtils';

interface PixelBorderButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const PixelBorderButton = ({ onClick, children, className = '' }: PixelBorderButtonProps) => {
  // Create arrays of pixel tiles for each edge of the button
  const topPixels = COLORS.slice(0, 12);  // Use first colors for top
  const rightPixels = COLORS.slice(0, 8); // Use some colors for right side
  const bottomPixels = COLORS.slice(0, 12); // Use first colors for bottom
  const leftPixels = COLORS.slice(0, 8);  // Use some colors for left side

  return (
    <div className="relative">
      {/* The actual button */}
      <button 
        onClick={onClick}
        className={`w-full bg-black text-white py-6 px-4 text-xl font-medium transition-all 
          relative border-0 z-10 ${className}`}
      >
        {children}
      </button>

      {/* Pixel border overlay - top row */}
      <div className="absolute top-[-4px] left-0 w-full flex justify-between pointer-events-none">
        {topPixels.map((color, i) => (
          <div 
            key={`top-${i}`} 
            className="w-[8px] h-[8px] transform translate-y-[-2px]"
            style={{ backgroundColor: getColorHex(color) }}
          />
        ))}
      </div>

      {/* Pixel border overlay - bottom row */}
      <div className="absolute bottom-[-4px] left-0 w-full flex justify-between pointer-events-none">
        {bottomPixels.map((color, i) => (
          <div 
            key={`bottom-${i}`} 
            className="w-[8px] h-[8px] transform translate-y-[2px]"
            style={{ backgroundColor: getColorHex(color) }}
          />
        ))}
      </div>

      {/* Pixel border overlay - left column */}
      <div className="absolute top-0 left-[-4px] h-full flex flex-col justify-between pointer-events-none">
        {leftPixels.map((color, i) => (
          <div 
            key={`left-${i}`} 
            className="h-[8px] w-[8px] transform translate-x-[-2px]"
            style={{ backgroundColor: getColorHex(color) }}
          />
        ))}
      </div>

      {/* Pixel border overlay - right column */}
      <div className="absolute top-0 right-[-4px] h-full flex flex-col justify-between pointer-events-none">
        {rightPixels.map((color, i) => (
          <div 
            key={`right-${i}`} 
            className="h-[8px] w-[8px] transform translate-x-[2px]"
            style={{ backgroundColor: getColorHex(color) }}
          />
        ))}
      </div>
      
      {/* Corner pixels */}
      <div 
        className="absolute top-[-4px] left-[-4px] w-[8px] h-[8px] pointer-events-none" 
        style={{ backgroundColor: getColorHex(COLORS[2]) }} // Red for top-left
      />
      <div 
        className="absolute top-[-4px] right-[-4px] w-[8px] h-[8px] pointer-events-none" 
        style={{ backgroundColor: getColorHex(COLORS[3]) }} // Green for top-right
      />
      <div 
        className="absolute bottom-[-4px] left-[-4px] w-[8px] h-[8px] pointer-events-none" 
        style={{ backgroundColor: getColorHex(COLORS[4]) }} // Yellow for bottom-left
      />
      <div 
        className="absolute bottom-[-4px] right-[-4px] w-[8px] h-[8px] pointer-events-none" 
        style={{ backgroundColor: getColorHex(COLORS[5]) }} // Blue for bottom-right
      />
    </div>
  );
};

export default PixelBorderButton;
