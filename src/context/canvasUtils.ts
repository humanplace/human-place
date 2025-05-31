import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ColorCode } from './canvasTypes';

// Store last update timestamp to support differential updates
// Export it so it can be accessed by other components
export let lastUpdateTimestamp: string | null = null;

// Helper function to update a pixel in Supabase
export async function updatePixelInSupabase(x: number, y: number, color: ColorCode) {
  try {
    // Use upsert to implement "last write wins" logic
    // Let Supabase set the updated_at timestamp automatically using the database default
    const { error } = await supabase
      .from('canvas')
      .upsert(
        { 
          x, 
          y, 
          color
          // No longer manually setting updated_at - letting Supabase handle it
        },
        { onConflict: 'x,y' } // The composite primary key columns
      );
    
    if (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save pixel to Supabase:', error);
      }
      throw new Error('Failed to save pixel');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error saving pixel to Supabase:', error);
    }
    throw error;
  }
}

// Helper function to fetch all canvas pixels from Supabase
export async function fetchAllCanvasPixels() {
  try {
    // Fetch all pixels in a single request (up to 90k pixels for 300x300 canvas)
    const { data, error } = await supabase
      .from('canvas')
      .select('x, y, color, updated_at')
      .range(0, 89999); // 0-based inclusive range for up to 90k pixels

    if (error) {
      throw error;
    }

    const pixels = data as { x: number, y: number, color: ColorCode, updated_at: string }[];

    if (import.meta.env.DEV) {
      console.log(`Total pixels fetched: ${pixels.length}`);
    }
    
    // Update the last update timestamp if data was returned
    if (pixels.length > 0) {
      const timestamps = pixels.map(pixel => new Date(pixel.updated_at).getTime());
      lastUpdateTimestamp = new Date(Math.max(...timestamps)).toISOString();
      
      if (import.meta.env.DEV) {
        console.log(`Setting last update timestamp to ${lastUpdateTimestamp}`);
      }
    }
    
    return pixels;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching all canvas pixels:', error);
    }
    throw error;
  }
}

// Function to fetch only pixels updated since a specific timestamp
export async function fetchUpdatedCanvasPixels(since: string) {
  try {
    // Fetch all updated pixels in a single request (up to 90k pixels for 300x300 canvas)
    const { data, error } = await supabase
      .from('canvas')
      .select('x, y, color, updated_at')
      .gt('updated_at', since) // Only get pixels updated after the given timestamp
      .range(0, 89999); // 0-based inclusive range for up to 90k pixels

    if (error) {
      throw error;
    }

    const pixels = data as { x: number, y: number, color: ColorCode, updated_at: string }[];

    if (import.meta.env.DEV) {
      console.log(`Updated pixels fetched since ${since}: ${pixels.length}`);
    }
    
    // Update the last update timestamp if data was returned
    if (pixels.length > 0) {
      const timestamps = pixels.map(pixel => new Date(pixel.updated_at).getTime());
      lastUpdateTimestamp = new Date(Math.max(...timestamps)).toISOString();
      
      if (import.meta.env.DEV) {
        console.log(`Setting last update timestamp to ${lastUpdateTimestamp}`);
      }
    }
    
    return pixels;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching updated canvas pixels:', error);
    }
    throw error;
  }
}

// Helper function to fetch binary canvas data (for initial load)
export async function fetchBinaryCanvasData(): Promise<{ x: number; y: number; color: ColorCode }[] | null> {
  try {
    const response = await fetch(
      'https://dzvsnevhawxdzxuqtdse.supabase.co/functions/v1/canvas-binary',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnNuZXZoYXd4ZHp4dXF0ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTMyNjIsImV4cCI6MjA2MTgyOTI2Mn0.-6dYHXxQ8VfBG6jZnjYC-pQrMx4xT9xhsA_Tav4iGRQ',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnNuZXZoYXd4ZHp4dXF0ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTMyNjIsImV4cCI6MjA2MTgyOTI2Mn0.-6dYHXxQ8VfBG6jZnjYC-pQrMx4xT9xhsA_Tav4iGRQ',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get binary data
    const buffer = await response.arrayBuffer();
    const binaryData = new Uint8Array(buffer);

    // Validate size
    if (binaryData.length !== 90000) {
      throw new Error(`Invalid binary data size: ${binaryData.length}`);
    }

    // Get checksum from header and validate
    const checksumHeader = response.headers.get('X-Canvas-Checksum');
    if (checksumHeader) {
      let calculatedChecksum = 0;
      for (let i = 0; i < binaryData.length; i++) {
        calculatedChecksum = (calculatedChecksum + binaryData[i]) & 0xFFFF;
      }
      
      if (calculatedChecksum.toString() !== checksumHeader) {
        if (import.meta.env.DEV) {
          console.warn('Checksum mismatch, but continuing:', calculatedChecksum, checksumHeader);
        }
      }
    }

    // Convert binary data to pixel array format
    const pixels: { x: number; y: number; color: ColorCode }[] = [];
    
    for (let y = 0; y < 300; y++) {
      for (let x = 0; x < 300; x++) {
        const index = y * 300 + x;
        const color = binaryData[index] as ColorCode;
        
        // Validate color is in valid range
        if (color >= 0 && color <= 10) {
          pixels.push({ x, y, color });
        } else {
          // Default to white for invalid colors
          pixels.push({ x, y, color: 1 });
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log('Successfully loaded binary canvas data');
    }

    // Since this is initial load, we don't have timestamps, but we can set a base timestamp
    lastUpdateTimestamp = new Date().toISOString();

    return pixels;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching binary canvas data:', error);
    }
    // Return null to trigger fallback to JSON
    return null;
  }
}
