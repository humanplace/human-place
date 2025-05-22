import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function verifyWorldIdProof(requestPayload: IRequestPayload) {
  console.log('🔍 verifyWorldIdProof called with:', requestPayload)
  
  const { payload, action, signal } = requestPayload
  const app_id = import.meta.env.VITE_WORLD_APP_ID as `app_${string}`
  
  console.log('📝 Verification parameters:', {
    app_id,
    action,
    signal,
    payloadKeys: Object.keys(payload)
  })
  
  if (!app_id) {
    console.error('❌ VITE_WORLD_APP_ID environment variable is not set')
    throw new Error('VITE_WORLD_APP_ID environment variable is not set')
  }

  try {
    console.log('🚀 Calling verifyCloudProof...')
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal) as IVerifyResponse
    
    console.log('📡 verifyCloudProof response:', verifyRes)

    if (verifyRes.success) {
      // Verification successful - user is orb verified
      console.log('✅ Cloud proof verification successful!')
      return { success: true, verified: true, message: 'User is orb verified' }
    } else {
      // Verification failed 
      console.error('❌ Cloud proof verification failed:', verifyRes)
      return { success: false, verified: false, message: `Verification failed: ${JSON.stringify(verifyRes)}` }
    }
  } catch (error) {
    console.error('💥 Error verifying World ID proof:', error)
    return { success: false, verified: false, message: `Verification error: ${error}` }
  }
} 