import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function verifyWorldIdProof(requestPayload: IRequestPayload) {
  const { payload, action, signal } = requestPayload
  const app_id = import.meta.env.VITE_WORLD_APP_ID as `app_${string}`
  
  if (!app_id) {
    throw new Error('VITE_WORLD_APP_ID environment variable is not set')
  }

  try {
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal) as IVerifyResponse

    if (verifyRes.success) {
      // Verification successful - user is orb verified
      return { success: true, verified: true, message: 'User is orb verified' }
    } else {
      // Verification failed 
      return { success: false, verified: false, message: 'Verification failed' }
    }
  } catch (error) {
    console.error('Error verifying World ID proof:', error)
    return { success: false, verified: false, message: 'Verification error' }
  }
} 