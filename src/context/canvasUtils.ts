
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
      console.error('Failed to save pixel to Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving pixel to Supabase:', error);
    toast({
      title: "Failed to save pixel",
      description: "Your pixel couldn't be saved to the server.",
      variant: "destructive",
    });
  }
}

// Helper function to fetch all canvas pixels from Supabase
export async function fetchAllCanvasPixels() {
  const pixels: { x: number, y: number, color: ColorCode, updated_at: string }[] = [];
  let page = 0;
  const pageSize = 1000; // Supabase default page size
  let hasMoreData = true;

  try {
    // Loop until we've fetched all pixels
    while (hasMoreData) {
      const { data, error } = await supabase
        .from('canvas')
        .select('x, y, color, updated_at')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        pixels.push(...data as { x: number, y: number, color: ColorCode, updated_at: string }[]);
        page++;
        
        // If we got fewer records than the page size, we've reached the end
        hasMoreData = data.length === pageSize;
      } else {
        // No more data
        hasMoreData = false;
      }
    }

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
    console.error('Error fetching all canvas pixels:', error);
    throw error;
  }
}

// Function to fetch only pixels updated since a specific timestamp
export async function fetchUpdatedCanvasPixels(since: string) {
  const pixels: { x: number, y: number, color: ColorCode, updated_at: string }[] = [];
  let page = 0;
  const pageSize = 1000; // Supabase default page size
  let hasMoreData = true;

  try {
    // Loop until we've fetched all updated pixels
    while (hasMoreData) {
      const { data, error } = await supabase
        .from('canvas')
        .select('x, y, color, updated_at')
        .gt('updated_at', since) // Only get pixels updated after the given timestamp
        // No explicit sorting - we just need all pixels updated since the timestamp
        // Removing the descending sort prevents potential issues during pagination
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        pixels.push(...data as { x: number, y: number, color: ColorCode, updated_at: string }[]);
        page++;
        
        // If we got fewer records than the page size, we've reached the end
        hasMoreData = data.length === pageSize;
      } else {
        // No more data
        hasMoreData = false;
      }
    }

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
    console.error('Error fetching updated canvas pixels:', error);
    throw error;
  }
}
