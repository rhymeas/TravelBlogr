import { NextResponse } from 'next/server'

/**
 * Debug API route to check AdSense configuration
 * 
 * This route helps diagnose why Google Ads are not showing by checking:
 * 1. If NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID is set
 * 2. If it's a valid AdSense Client ID format
 * 3. Environment information
 * 
 * Access: /api/debug/adsense-config
 */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID
  const nodeEnv = process.env.NODE_ENV
  
  // Check if client ID is set
  const isSet = !!clientId
  
  // Check if it's a valid format (ca-pub-XXXXXXXXXXXXXXXXX)
  const isValidFormat = clientId ? /^ca-pub-\d{16}$/.test(clientId) : false
  
  // Check if it's not a placeholder
  const isNotPlaceholder = clientId !== 'ca-pub-your_adsense_client_id_here'
  
  // Overall configuration status
  const isConfigured = isSet && isValidFormat && isNotPlaceholder
  
  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    environment: nodeEnv,
    checks: {
      isSet,
      isValidFormat,
      isNotPlaceholder,
      isConfigured,
    },
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET',
    fullClientId: clientId || 'NOT SET', // Only for debugging - remove in production
    message: isConfigured
      ? '✅ Google AdSense is properly configured'
      : '❌ Google AdSense is NOT configured - ads will not show',
    nextSteps: isConfigured
      ? [
          'Ads should be visible on the site',
          'Check Google AdSense dashboard for approval status',
          'Replace placeholder slot IDs with actual slot IDs from AdSense',
        ]
      : [
          'Add NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID to Railway environment variables',
          'Trigger a rebuild in Railway (not just restart)',
          'Wait for deployment to complete',
          'Test again',
        ],
  })
}

