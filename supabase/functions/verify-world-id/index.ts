
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyRequest {
  payload: {
    proof?: string;
    merkle_root?: string;
    nullifier_hash?: string;
    verification_level?: string;
    status?: string;
    version?: number;
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
    // Log raw request information for debugging
    const contentType = req.headers.get('content-type');
    console.log('📥 Incoming request:', { 
      method: req.method, 
      contentType,
      url: req.url
    });
    
    // Get request body as text first
    const bodyText = await req.text();
    console.log('📝 Request body (first 100 chars):', bodyText.substring(0, 100));
    
    let requestData;
    try {
      // Try to parse as JSON
      requestData = JSON.parse(bodyText);
      console.log('✅ Successfully parsed request body as JSON');
    } catch (parseError) {
      console.error('❌ Failed to parse request body as JSON:', parseError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'Invalid request format: Unable to parse JSON' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Extract required data from request
    const { payload, action, signal } = requestData as VerifyRequest;
    
    if (!payload || !action) {
      console.error('❌ Missing required fields in request:', { hasPayload: !!payload, hasAction: !!action });
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'Missing required fields: payload or action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get environment variables
    const appId = Deno.env.get('WORLD_APP_ID')
    const expectedAction = Deno.env.get('WORLD_ACTION_ID')
    
    console.log('🔍 World ID verification request:', {
      appId: appId ? 'Present' : 'Missing',
      action,
      expectedAction,
      signal,
      payloadKeys: payload ? Object.keys(payload) : 'No payload'
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
    
    // Validate payload has required fields
    if (!payload.proof || !payload.merkle_root || !payload.nullifier_hash || !payload.verification_level) {
      console.error('❌ Missing required fields in payload:', {
        hasProof: !!payload.proof,
        hasMerkleRoot: !!payload.merkle_root,
        hasNullifierHash: !!payload.nullifier_hash,
        hasVerificationLevel: !!payload.verification_level
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'Missing required verification data in payload' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call World ID Developer Portal API for verification
    console.log('🚀 Calling World ID verification API...')
    const verifyUrl = 'https://developer.worldcoin.org/api/v1/verify/' + appId
    
    // Log the exact payload being sent to World ID API
    const worldIdRequestBody = {
      nullifier_hash: payload.nullifier_hash,
      merkle_root: payload.merkle_root,
      proof: payload.proof,
      verification_level: payload.verification_level,
      action: action,
      signal: signal || '',
    };
    console.log('📤 World ID API request payload:', worldIdRequestBody);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worldIdRequestBody),
    });
    
    // Check if response is valid before attempting to parse JSON
    const contentTypeHeader = verifyResponse.headers.get('content-type');
    console.log('📦 World ID API response type:', {
      status: verifyResponse.status,
      statusText: verifyResponse.statusText,
      contentType: contentTypeHeader
    });
    
    // Handle non-JSON responses
    if (!contentTypeHeader?.includes('application/json')) {
      const textResponse = await verifyResponse.text();
      console.error('❌ World ID API returned non-JSON response:', {
        status: verifyResponse.status,
        contentType: contentTypeHeader,
        bodyPreview: textResponse.substring(0, 200)
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: `Invalid response from verification service: ${verifyResponse.status} ${verifyResponse.statusText}` 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Parse the JSON response
    const verifyResult = await verifyResponse.json();
    console.log('📡 World ID API response:', { 
      status: verifyResponse.status, 
      result: verifyResult 
    });

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
