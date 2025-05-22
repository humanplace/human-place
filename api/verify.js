import { verifyCloudProof } from '@worldcoin/minikit-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, action, signal } = req.body;
    const app_id = process.env.WORLD_APP_ID; // Note: No VITE_ prefix in backend

    console.log('🔍 Backend verification called with:', {
      app_id,
      action,
      signal,
      payloadKeys: Object.keys(payload || {})
    });

    if (!app_id) {
      console.error('❌ WORLD_APP_ID environment variable is not set');
      return res.status(500).json({ 
        success: false, 
        verified: false, 
        message: 'Server configuration error' 
      });
    }

    console.log('🚀 Calling verifyCloudProof...');
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal);
    
    console.log('📡 verifyCloudProof response:', verifyRes);

    if (verifyRes.success) {
      console.log('✅ Verification successful!');
      return res.status(200).json({ 
        success: true, 
        verified: true, 
        message: 'User is orb verified' 
      });
    } else {
      console.error('❌ Verification failed:', verifyRes);
      return res.status(400).json({ 
        success: false, 
        verified: false, 
        message: `Verification failed: ${JSON.stringify(verifyRes)}` 
      });
    }
  } catch (error) {
    console.error('💥 Backend verification error:', error);
    return res.status(500).json({ 
      success: false, 
      verified: false, 
      message: `Verification error: ${error.message}` 
    });
  }
} 