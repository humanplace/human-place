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
    
    // Get app ID from environment variables
    const app_id = Deno.env.get('WORLD_APP_ID') as `app_${string}`
    
    if (!app_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'World App ID not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the proof with World ID Cloud API
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal) as IVerifyResponse

    if (verifyRes.success) {
      // Verification successful
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
      // Verification failed
      console.error('World ID verification failed:', verifyRes)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: verifyRes.detail || 'Verification failed',
          code: verifyRes.code
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error in verify-world-id function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 