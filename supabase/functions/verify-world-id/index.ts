import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { verifyCloudProof, type IVerifyResponse, type ISuccessResult } from "npm:@worldcoin/minikit-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payload, action, signal }: RequestPayload = await req.json()
    
    // Get environment variables
    const app_id = Deno.env.get('WORLD_APP_ID') as `app_${string}`
    const expected_action = Deno.env.get('WORLD_ACTION_ID')
    
    // Validate configuration
    if (!app_id) {
      console.error('WORLD_APP_ID not configured')
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

    if (!expected_action) {
      console.error('WORLD_ACTION_ID not configured')
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

    // Validate action matches expected value
    if (action !== expected_action) {
      console.error(`Action mismatch: received "${action}", expected "${expected_action}"`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid verification request' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the proof with World ID Cloud API
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal) as IVerifyResponse

    if (verifyRes.success) {
      return new Response(
        JSON.stringify({ 
          success: true,
          nullifier_hash: payload.nullifier_hash,
          verification_level: payload.verification_level 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Log technical details but return user-friendly message
      console.error('World ID verification failed:', verifyRes)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification failed. Please ensure you are Orb verified.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Service temporarily unavailable. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 