'use client'

export const dynamic = 'force-dynamic'


import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/lib/utils/adminCheck'
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

export default function LocationCleanupTestPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [limit, setLimit] = useState('50')
  const [verbose, setVerbose] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const isAdminUser = isAdmin(user?.email)

  const handleCleanup = async () => {
    if (!isAdminUser) {
      setError('Admin access required')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams()
      params.append('dryRun', dryRun.toString())
      if (limit) params.append('limit', limit)
      params.append('verbose', verbose.toString())

      const response = await fetch(`/api/admin/cleanup-locations?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cleanup locations')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h2 className="font-semibold">Admin Access Required</h2>
                <p className="text-sm">You need admin permissions to access this page.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🧹 Location Name Cleanup</h1>
        <p className="text-gray-600 mb-8">
          Remove region/country concatenation from location names
        </p>

        {/* Controls */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cleanup Options</h2>

          <div className="space-y-4">
            {/* Dry Run Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Dry Run (preview only)</span>
              </label>
              <span className="text-sm text-gray-600">
                {dryRun ? '🔍 Preview changes without modifying database' : '✏️ Apply changes to database'}
              </span>
            </div>

            {/* Limit Input */}
            <div className="flex items-center gap-4">
              <label className="font-medium w-24">Limit:</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
                max="10000"
                className="px-3 py-2 border border-gray-300 rounded-lg w-32"
              />
              <span className="text-sm text-gray-600">
                Leave empty to process all locations
              </span>
            </div>

            {/* Verbose Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verbose}
                  onChange={(e) => setVerbose(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Verbose Output</span>
              </label>
              <span className="text-sm text-gray-600">
                Show detailed logs for each location
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleCleanup}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {dryRun ? 'Preview Cleanup' : 'Apply Cleanup'}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold">{result.message}</h2>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold">{result.results.total}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Need Cleanup</div>
                <div className="text-2xl font-bold text-blue-600">{result.results.needsCleanup}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Already Clean</div>
                <div className="text-2xl font-bold text-green-600">{result.results.alreadyClean}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Updated</div>
                <div className="text-2xl font-bold text-purple-600">{result.results.updated}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-2xl font-bold text-red-600">{result.results.failed}</div>
              </div>
            </div>

            {/* Changes Preview */}
            {result.results.changes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Sample Changes</h3>
                <div className="space-y-3">
                  {result.results.changes.map((change: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-mono">
                        <span className="text-red-600">- {change.oldName}</span>
                      </div>
                      <div className="text-sm font-mono">
                        <span className="text-green-600">+ {change.newName}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{change.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dry Run Notice */}
            {result.dryRun && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>🔍 Dry Run:</strong> No changes were made. Uncheck "Dry Run" and click "Apply Cleanup" to make changes.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Info Box */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">ℹ️ How It Works</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Removes country suffix: "Banff Lake Louise Canada" → "Banff Lake Louise"</li>
            <li>✅ Removes region suffix: "Banff, Alberta Canada" → "Banff"</li>
            <li>✅ Cleans trailing commas and spaces</li>
            <li>✅ Preserves already-clean names</li>
            <li>✅ Always preview with dry run first</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

