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
    // Fetch all pixels in a single request (up to 100k rows)
    const { data, error } = await supabase
      .from('canvas')
      .select('x, y, color, updated_at')
      .range(0, 99999); // 0-based inclusive range for up to 100k pixels

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
    // Fetch all updated pixels in a single request (up to 100k rows)
    const { data, error } = await supabase
      .from('canvas')
      .select('x, y, color, updated_at')
      .gt('updated_at', since) // Only get pixels updated after the given timestamp
      .range(0, 99999); // 0-based inclusive range for up to 100k pixels

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
