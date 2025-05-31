import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all canvas pixels
    const { data, error } = await supabase
      .from('canvas')
      .select('x, y, color')
      .order('y')
      .order('x')
      .range(0, 89999) // 0-based inclusive range for 90k pixels

    if (error) {
      if (Deno.env.get('ENVIRONMENT') !== 'production') {
        console.error('Failed to fetch canvas data:', error)
      }
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch canvas data' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate we have complete canvas data
    if (!data || data.length !== 90000) {
      if (Deno.env.get('ENVIRONMENT') !== 'production') {
        console.error(`Expected 90000 pixels, got ${data?.length || 0}`)
      }
      return new Response(
        JSON.stringify({ 
          error: 'Incomplete canvas data' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create binary array (300x300 pixels, 1 byte per pixel)
    const binaryData = new Uint8Array(90000)
    
    // Initialize with white (color 1) as default
    binaryData.fill(1)
    
    // Fill in pixel data in row-major order
    // Since we ordered by y,x in the query, we can iterate directly
    for (let i = 0; i < data.length; i++) {
      const pixel = data[i]
      const index = pixel.y * 300 + pixel.x
      
      // Validate color is in valid range (0-10)
      if (pixel.color >= 0 && pixel.color <= 10) {
        binaryData[index] = pixel.color
      }
    }

    // Calculate simple checksum for data integrity
    let checksum = 0
    for (let i = 0; i < binaryData.length; i++) {
      checksum = (checksum + binaryData[i]) & 0xFFFF // 16-bit checksum
    }

    // Return binary data with appropriate headers
    return new Response(binaryData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Length': '90000',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'X-Canvas-Size': '300',
        'X-Canvas-Checksum': checksum.toString(),
        'X-Canvas-Version': '1', // Version for future format changes
      }
    })
  } catch (error) {
    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.error('Canvas binary error:', error)
    }
    return new Response(
      JSON.stringify({ 
        error: 'Service error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 