import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    // Revalidate the specific path
    revalidatePath(path)
    
    // Also revalidate the locations list page
    revalidatePath('/locations')

    console.log(`✅ Revalidated cache for: ${path}`)

    return NextResponse.json({
      success: true,
      revalidated: true,
      path
    })

  } catch (error) {
    console.error('Revalidate error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}

