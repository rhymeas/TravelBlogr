'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface AIQuickHelpButtonProps {
  mode: 'improve' | 'generate' | 'expand' | 'shorten' | 'addresses'
  fieldType: 'description' | 'title' | 'activities' | 'restaurants' | 'highlights'
  currentValue: any
  locationName?: string
  onApply: (newValue: string) => void
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  noteType?: string
}

export function AIQuickHelpButton({
  mode,
  fieldType,
  currentValue,
  locationName,
  onApply,
  className = '',
  size = 'sm',
  noteType
}: AIQuickHelpButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [topic, setTopic] = useState<string>(noteType || 'general')

  const handleGetHelp = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/quick-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          fieldType,
          currentValue,
          locationName,
          context: (topic || noteType) ? { noteType: topic || noteType } : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI help')
      }

      setAiSuggestion(data.result)
      setShowPreview(true)
      toast.success('AI suggestion ready!')

    } catch (error: any) {
      console.error('AI help error:', error)
      toast.error(error.message || 'Failed to get AI help')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    onApply(aiSuggestion)
    setShowPreview(false)
    setAiSuggestion('')
    toast.success('Applied AI suggestion!')
  }

  const handleCancel = () => {
    setShowPreview(false)
    setAiSuggestion('')
  }

  const getButtonText = () => {
    if (mode === 'improve') return 'Improve with AI'
    if (mode === 'generate') return 'Generate with AI'
    if (mode === 'expand') return 'Expand with AI'
    if (mode === 'shorten') return 'Shorten with AI'
    if (mode === 'addresses') return 'Add Addresses'
    return 'AI Help'
  }

  return (
    <>
      {/* AI Help Button */}
      <Button
        onClick={handleGetHelp}
        disabled={loading}
        variant="outline"
        size={size}
        className={`flex items-center gap-1.5 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Thinking...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs">{getButtonText()}</span>
          </>
        )}
      </Button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm md:backdrop-blur animate-in fade-in duration-200">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-2xl w-full max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Suggestion
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Topic chips */}
            <div className="px-4 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {['general','tips','food','culture','outdoor','hidden-gems'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-2.5 py-1 text-xs rounded-full border ${topic === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
                <Button onClick={handleGetHelp} size="sm" className="ml-auto bg-gray-900 hover:bg-black text-white">Regenerate</Button>
              </div>
            </div>

            {/* Content: side-by-side current vs suggestion */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Current Value */}
                {currentValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof currentValue === 'string'
                        ? currentValue
                        : Array.isArray(currentValue)
                        ? currentValue.join('\n')
                        : JSON.stringify(currentValue, null, 2)}
                    </div>
                  </div>
                )}

                {/* AI Suggestion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Suggestion</label>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-sm text-gray-900 whitespace-pre-wrap">
                    {aiSuggestion}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                size="sm"
                className="bg-gray-900 hover:bg-black text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Suggestion
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

