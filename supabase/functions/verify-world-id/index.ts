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
  console.log('Edge Function called:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing World ID verification request')
    const requestBody = await req.text()
    console.log('Request body:', requestBody)
    
    const { payload, action, signal }: RequestPayload = JSON.parse(requestBody)
    console.log('Parsed payload:', { action, signal, payloadKeys: Object.keys(payload) })
    
    // Get app ID from environment variables
    const app_id = Deno.env.get('WORLD_APP_ID') as `app_${string}`
    console.log('App ID found:', !!app_id, app_id?.substring(0, 10) + '...')
    
    if (!app_id) {
      console.error('WORLD_APP_ID not found in environment')
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

    console.log('Calling verifyCloudProof...')
    // Verify the proof with World ID Cloud API
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal) as IVerifyResponse
    console.log('verifyCloudProof result:', verifyRes)

    if (verifyRes.success) {
      console.log('Verification successful!')
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
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 