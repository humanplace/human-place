import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyRequest {
  payload: {
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: string;
    version: number;
  };
  action: string;
  signal?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payload, action, signal }: VerifyRequest = await req.json()
    
    // Get environment variables
    const appId = Deno.env.get('WORLD_APP_ID')
    const expectedAction = Deno.env.get('WORLD_ACTION_ID')
    
    console.log('🔍 World ID verification request:', {
      appId: appId ? 'Present' : 'Missing',
      action,
      expectedAction,
      signal,
      payloadKeys: Object.keys(payload)
    })

    // Validate environment variables
    if (!appId) {
      console.error('❌ WORLD_APP_ID environment variable missing')
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'Server configuration error: Missing WORLD_APP_ID' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate action matches expected
    if (action !== expectedAction) {
      console.error('❌ Action mismatch:', { received: action, expected: expectedAction })
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'Invalid action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call World ID Developer Portal API for verification
    console.log('🚀 Calling World ID verification API...')
    const verifyUrl = 'https://developer.worldcoin.org/api/v1/verify/' + appId
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nullifier_hash: payload.nullifier_hash,
        merkle_root: payload.merkle_root,
        proof: payload.proof,
        verification_level: payload.verification_level,
        action: action,
        signal: signal || '',
      }),
    })

    const verifyResult = await verifyResponse.json()
    console.log('📡 World ID API response:', { 
      status: verifyResponse.status, 
      result: verifyResult 
    })

    if (verifyResponse.ok && verifyResult.success) {
      console.log('✅ World ID verification successful!')
      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true, 
          message: 'User is orb verified',
          nullifier_hash: payload.nullifier_hash
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.error('❌ World ID verification failed:', verifyResult)
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: `Verification failed: ${verifyResult.detail || 'Unknown error'}`,
          error_code: verifyResult.code
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('💥 Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false, 
        message: `Server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 