import React from 'react';
import { useCanvas, COLORS, COLOR_NAME_MAP } from '@/context/CanvasContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ColorCode } from '@/context/canvasTypes';
import { getColorHex } from '@/utils/canvasUtils';
import { haptics } from '@/utils/haptics';

const ColorPicker = () => {
  const { state, dispatch } = useCanvas();
  const isMobile = useIsMobile();

  const handleSelectColor = (color: ColorCode) => {
    haptics.colorSelect();
    dispatch({ type: 'SELECT_COLOR', color });
  };

  return (
    <footer className="h-20 bg-white shadow-sm py-3 px-2">
      <div className="flex justify-center items-center h-full">
        <div className={`color-picker-grid ${isMobile ? 'mobile' : 'desktop'} w-full max-w-md`}>
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleSelectColor(color)}
              className={`
                color-picker-button
                rounded-full flex-shrink-0 transition-all
                ${state.selectedColor === color ? 'ring-2 ring-black' : ''}
                ${color === 1 ? 'border border-gray-300' : ''}
                shadow-sm
              `}
              style={{
                backgroundColor: getColorHex(color),
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
