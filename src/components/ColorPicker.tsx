
import React from 'react';
import { useCanvas, COLORS, PixelColor } from '@/context/CanvasContext';

const ColorPicker = () => {
  const { state, dispatch } = useCanvas();

  const handleSelectColor = (color: PixelColor) => {
    dispatch({ type: 'SELECT_COLOR', color });
  };

  return (
    <footer className="h-16 bg-white border-t shadow-sm py-2 px-1">
      <div className="flex justify-center items-center h-full overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2 px-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleSelectColor(color)}
              className={`
                w-8 h-8 rounded-full flex-shrink-0
                ${state.selectedColor === color ? 'ring-2 ring-black ring-offset-2' : ''}
                ${color === 'white' ? 'border border-gray-300' : ''}
                shadow-sm
              `}
              style={{
                backgroundColor: getColorHex(color),
              }}
              aria-label={`Select ${color}`}
            />
          ))}
        </div>
      </div>
    </footer>
  );
};

// Helper function to convert color names to hex values
function getColorHex(color: PixelColor): string {
  switch (color) {
    case 'black': return '#000000';
    case 'white': return '#FFFFFF';
    case 'red': return '#FF4500';
    case 'green': return '#00A550';
    case 'yellow': return '#FFD635';
    case 'blue': return '#3690EA';
    case 'brown': return '#6D482F';
    case 'purple': return '#9C51B6';
    case 'pink': return '#FF99AA';
    case 'orange': return '#FFA800';
    case 'grey': return '#898D90';
    default: return '#FFFFFF';
  }
}

export default ColorPicker;
