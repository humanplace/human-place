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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference_id, transaction_id }: RequestPayload = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('reference_id', reference_id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment record not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if payment is already processed
    if (payment.status === 'completed') {
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

    // Update payment status to verifying
    await supabase
      .from('payments')
      .update({ 
        status: 'verifying',
        transaction_id,
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', reference_id)

    // Get environment variables
    const APP_ID = Deno.env.get('WORLD_APP_ID')
    const DEV_PORTAL_API_KEY = Deno.env.get('DEV_PORTAL_API_KEY')

    if (!APP_ID || !DEV_PORTAL_API_KEY) {
      console.error('Missing environment variables')
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
      console.error('Failed to verify transaction:', verifyResponse.status)
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', reference_id)

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
      // Update pixel in canvas table
      const { error: pixelError } = await supabase
        .from('canvas')
        .upsert({
          x: payment.pixel_x,
          y: payment.pixel_y,
          color: payment.pixel_color
        }, {
          onConflict: 'x,y'
        })

      if (pixelError) {
        console.error('Failed to update pixel:', pixelError)
        // Don't fail the payment, log for investigation
      }

      // Mark payment as completed
      await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', reference_id)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment verified and pixel updated',
          pixel: {
            x: payment.pixel_x,
            y: payment.pixel_y,
            color: payment.pixel_color
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Payment failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', reference_id)

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
    console.error('Payment verification error:', error)
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