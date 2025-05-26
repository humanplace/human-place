import React from 'react';
import { useCanvas, COLORS, COLOR_NAME_MAP } from '@/context/CanvasContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ColorCode } from '@/context/canvasTypes';
import { getColorHex } from '@/utils/canvasUtils';

const ColorPicker = () => {
  const { state, dispatch } = useCanvas();
  const isMobile = useIsMobile();

  const handleSelectColor = (color: ColorCode) => {
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
                ${state.selectedColor === color ? 'ring-2 ring-black shadow-[0_4px_12px_rgba(0,0,0,0.25)]' : 'shadow-sm'}
                ${color === 1 ? 'border border-gray-300' : ''}
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
