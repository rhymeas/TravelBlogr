import { NextRequest, NextResponse } from 'next/server'
import { getStorageStats } from '@/lib/services/smartDataHandler'
import { createServiceSupabase } from '@/lib/supabase-server'

/**
 * GET /api/admin/storage-stats
 * Returns storage statistics for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // Get basic storage stats
    const stats = await getStorageStats(true)
    
    // Get cache breakdown by type
    const supabase = createServiceSupabase()
    
    const { data: cacheData, error } = await supabase
      .from('cache')
      .select('cache_type, data')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching cache data:', error)
      return NextResponse.json({ error: 'Failed to fetch cache data' }, { status: 500 })
    }
    
    // Calculate breakdown by cache type
    const breakdown: Record<string, { count: number; size: number }> = {}
    let totalSize = 0

    cacheData?.forEach((item: any) => {
      const type = item.cache_type || 'unknown'
      const size = JSON.stringify(item.data).length
      
      if (!breakdown[type]) {
        breakdown[type] = { count: 0, size: 0 }
      }
      
      breakdown[type].count++
      breakdown[type].size += size
      totalSize += size
    })
    
    // Get GROQ usage stats (if available)
    const { data: groqStats } = await supabase
      .from('api_usage')
      .select('*')
      .eq('api_name', 'groq')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const groqUsage = {
      calls: groqStats?.length || 0,
      estimatedCost: (groqStats?.length || 0) * 0.00001, // Rough estimate
    }
    
    // Get API rate limit stats
    const { data: rateLimitStats } = await supabase
      .from('api_usage')
      .select('api_name, count')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
    
    const rateLimits: Record<string, number> = {}
    rateLimitStats?.forEach((stat: any) => {
      rateLimits[stat.api_name] = stat.count || 0
    })
    
    return NextResponse.json({
      storage: {
        ...stats,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        breakdown,
      },
      groq: groqUsage,
      rateLimits,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return NextResponse.json(
      { error: 'Failed to get storage stats' },
      { status: 500 }
    )
  }
}

