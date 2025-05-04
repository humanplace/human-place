
import React, { useEffect, useState } from 'react';
import { useCanvas, COLORS, COLOR_NAME_MAP } from '@/context/CanvasContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ColorCode } from '@/context/canvasTypes';
import { getColorHex } from '@/utils/canvasUtils';

const ColorPicker = () => {
  const { state, dispatch } = useCanvas();
  const isMobile = useIsMobile();
  const [buttonSize, setButtonSize] = useState(32); // Default size in pixels

  // Calculate button size based on screen width
  useEffect(() => {
    const calculateButtonSize = () => {
      const footerWidth = window.innerWidth;
      const totalColors = COLORS.length;
      const padding = isMobile ? 16 : 40; // Horizontal padding
      const gap = isMobile ? 4 : 8; // Gap between buttons
      
      // Calculate available space and divide by number of colors
      const availableSpace = footerWidth - (padding * 2) - (gap * (totalColors - 1));
      const calculatedSize = Math.floor(availableSpace / totalColors);
      
      // Clamp size between 24px and 40px
      const newSize = Math.max(24, Math.min(40, calculatedSize));
      setButtonSize(newSize);
    };

    calculateButtonSize();
    window.addEventListener('resize', calculateButtonSize);
    
    return () => {
      window.removeEventListener('resize', calculateButtonSize);
    };
  }, [isMobile]);

  const handleSelectColor = (color: ColorCode) => {
    dispatch({ type: 'SELECT_COLOR', color });
  };

  return (
    <footer className="h-20 bg-white border-t shadow-sm py-3 px-2">
      <div className="flex justify-center items-center h-full">
        <div className={`flex ${isMobile ? 'space-x-1' : 'space-x-2'} px-2 md:px-5`}>
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleSelectColor(color)}
              className={`
                rounded-full flex-shrink-0 transition-all
                ${state.selectedColor === color ? 'ring-2 ring-black ring-offset-2' : ''}
                ${color === 1 ? 'border border-gray-300' : ''}
                shadow-sm
              `}
              style={{
                backgroundColor: getColorHex(color),
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
              }}
              aria-label={`Select ${COLOR_NAME_MAP[color]}`}
            />
          ))}
        </div>
      </div>
    </footer>
  );
};

export default ColorPicker;
