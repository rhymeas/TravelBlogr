/**
 * Serve ads.txt for Google AdSense verification
 * This ensures Railway serves the file correctly
 */
export async function GET() {
  const adsTxt = `google.com, pub-5985120367077865, DIRECT, f08c47fec0942fa0`

  return new Response(adsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}

