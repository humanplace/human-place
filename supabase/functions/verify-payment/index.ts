import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Store payment address as constant (can be moved to env var later)
const PAYMENT_ADDRESS = '0xfe9eea1447587de22651b390efd4ba9ba1a5e344'

interface RequestPayload {
  reference_id: string
  transaction_id: string
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
    const { reference_id, transaction_id, pixel_x, pixel_y, pixel_color, user_nullifier_hash }: RequestPayload = await req.json()
    
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

    // Check if payment already exists (idempotency)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('reference_id', reference_id)
      .single()

    if (existingPayment) {
      // Payment already processed
      if (existingPayment.status === 'completed') {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Payment already processed' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Get environment variables
    const APP_ID = Deno.env.get('WORLD_APP_ID')
    const DEV_PORTAL_API_KEY = Deno.env.get('DEV_PORTAL_API_KEY')

    if (!APP_ID || !DEV_PORTAL_API_KEY) {
      if (Deno.env.get('ENVIRONMENT') !== 'production') {
        console.error('Missing environment variables')
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify payment with Developer Portal API
    const verifyResponse = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transaction_id}?app_id=${APP_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DEV_PORTAL_API_KEY}`,
        },
      }
    )

    if (!verifyResponse.ok) {
      if (Deno.env.get('ENVIRONMENT') !== 'production') {
        console.error('Failed to verify transaction:', verifyResponse.status)
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to verify payment' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const transaction = await verifyResponse.json()

    // Optimistic acceptance - accept if not failed
    if (transaction.reference === reference_id && transaction.status !== 'failed') {
      // Create or update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .upsert({
          reference_id,
          transaction_id,
          pixel_x,
          pixel_y,
          pixel_color,
          user_nullifier_hash,
          status: 'completed',
          amount: 0.1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'reference_id'
        })

      if (paymentError) {
        if (Deno.env.get('ENVIRONMENT') !== 'production') {
          console.error('Failed to save payment record:', paymentError)
        }
        // Continue anyway - payment was verified
      }

      // Update pixel in canvas table
      const { error: pixelError } = await supabase
        .from('canvas')
        .upsert({
          x: pixel_x,
          y: pixel_y,
          color: pixel_color
        }, {
          onConflict: 'x,y'
        })

      if (pixelError) {
        if (Deno.env.get('ENVIRONMENT') !== 'production') {
          console.error('Failed to update pixel:', pixelError)
        }
        // Don't fail the payment, log for investigation
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment verified and pixel updated',
          pixel: {
            x: pixel_x,
            y: pixel_y,
            color: pixel_color
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Payment failed - create failed record for audit
      await supabase
        .from('payments')
        .insert({
          reference_id,
          transaction_id,
          pixel_x,
          pixel_y,
          pixel_color,
          user_nullifier_hash,
          status: 'failed',
          amount: 0.1
        })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment verification failed' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.error('Payment verification error:', error)
    }
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Service error during verification' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 