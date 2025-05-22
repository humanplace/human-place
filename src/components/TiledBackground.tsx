
import React, { useMemo } from 'react';
import { ColorCode, COLORS } from '@/context/canvasTypes';
import { getColorHex } from '@/utils/canvasUtils';

interface TiledBackgroundProps {
  className?: string;
  density?: number; // Controls how many tiles are colored (0-100)
}

const TiledBackground: React.FC<TiledBackgroundProps> = ({ 
  className = "",
  density = 30, // Default 30% of tiles will be colored
}) => {
  // Calculate grid dimensions based on screen size
  // We generate more tiles than we need and let CSS handle the layout
  const gridSize = useMemo(() => {
    return {
      rows: 40,    // Number of rows in our grid
      cols: 40,    // Number of columns in our grid
    };
  }, []);

  // Filter out black (0), brown (6), and grey (10) from our color palette
  const filteredColors = useMemo(() => {
    return COLORS.filter(color => color !== 0 && color !== 6 && color !== 10);
  }, []);

  // Generate the colored tiles with a random seed pattern
  const tiles = useMemo(() => {
    const tiles = [];
    // Generate a random seed for each page load/component mount
    // Seed ranges from 1..2147483646 so we never start at zero
    const seedValue = Math.floor(Math.random() * 2147483646) + 1;
    let seed = seedValue;

    const random = () => {
      // Simple pseudo-random number generator
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Generate tiles for the grid
    for (let i = 0; i < gridSize.rows * gridSize.cols; i++) {
      // Decide if this tile should be colored based on density
      const shouldBeColored = random() * 100 < density;
      
      if (shouldBeColored) {
        // Pick a random color from our filtered palette
        const colorIndex = Math.floor(random() * filteredColors.length);
        const color = filteredColors[colorIndex];
        tiles.push({ id: i, color });
      } else {
        // Push an empty/white tile (using 1 as white from our palette)
        tiles.push({ id: i, color: 1 as ColorCode });
      }
    }

    return tiles;
  }, [gridSize, density, filteredColors]);

  return (
    <div 
      className={`fixed inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(30px,1fr))] h-full w-full">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="aspect-square"
            style={{
              backgroundColor: getColorHex(tile.color),
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TiledBackground;
