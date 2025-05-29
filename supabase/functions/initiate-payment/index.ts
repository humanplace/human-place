import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  pixel_x: number
  pixel_y: number
  pixel_color: number
  user_nullifier_hash?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pixel_x, pixel_y, pixel_color, user_nullifier_hash }: RequestPayload = await req.json()
    
    // Validate pixel coordinates
    if (pixel_x < 0 || pixel_x >= 100 || pixel_y < 0 || pixel_y >= 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid pixel coordinates' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate color
    if (pixel_color < 0 || pixel_color > 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid color value' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate reference ID (UUID without dashes as per World docs)
    const reference_id = crypto.randomUUID().replace(/-/g, '')

    // Create payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        reference_id,
        pixel_x,
        pixel_y,
        pixel_color,
        user_nullifier_hash,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment record:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create payment record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reference_id,
        payment_id: data.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Payment initiation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Service error. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 