import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/locations/[slug]/pixel.gif
 * Returns a 1x1 transparent GIF tracking pixel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // 1x1 transparent GIF in base64
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

