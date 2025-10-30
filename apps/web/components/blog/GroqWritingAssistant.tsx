'use client'

/**
 * GROQ Writing Assistant
 * 
 * AI-powered writing assistant for blog post creation and enhancement.
 * Helps users with:
 * - Improving existing text
 * - Generating creative descriptions
 * - Suggesting titles and headlines
 * - Creating engaging introductions
 * - Enhancing storytelling
 * - SEO optimization
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Copy, 
  Check,
  Lightbulb,
  PenTool,
  Zap
} from 'lucide-react'

interface GroqWritingAssistantProps {
  onInsertText?: (text: string) => void
  className?: string
}

type AssistantMode = 
  | 'improve' 
  | 'creative' 
  | 'title' 
  | 'introduction' 
  | 'seo'
  | 'storytelling'

export function GroqWritingAssistant({ onInsertText, className = '' }: GroqWritingAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>('improve')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const modes = [
    { id: 'improve' as const, label: 'Improve Text', icon: Wand2, description: 'Enhance clarity and flow' },
    { id: 'creative' as const, label: 'Make Creative', icon: Sparkles, description: 'Add vivid descriptions' },
    { id: 'title' as const, label: 'Generate Title', icon: PenTool, description: 'Create catchy titles' },
    { id: 'introduction' as const, label: 'Write Intro', icon: Lightbulb, description: 'Engaging openings' },
    { id: 'storytelling' as const, label: 'Storytelling', icon: Zap, description: 'Add narrative flow' },
    { id: 'seo' as const, label: 'SEO Optimize', icon: RefreshCw, description: 'Optimize for search' }
  ]

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setOutputText('')

    try {
      const response = await fetch('/api/groq/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          text: inputText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setOutputText(data.result)
    } catch (error) {
      console.error('Error generating content:', error)
      setOutputText('Error generating content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = () => {
    if (onInsertText && outputText) {
      onInsertText(outputText)
    }
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-rausch-500 to-kazan-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Writing Assistant</h3>
            <p className="text-sm text-gray-600">Enhance your blog post with AI-powered suggestions</p>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {modes.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  mode === m.id
                    ? 'border-rausch-500 bg-rausch-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${mode === m.id ? 'text-rausch-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${mode === m.id ? 'text-rausch-900' : 'text-gray-900'}`}>
                    {m.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{m.description}</p>
              </button>
            )
          })}
        </div>

        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'title' ? 'Topic or keywords' : 'Your text'}
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'title' 
                ? 'e.g., 7 days in Tokyo, family adventure'
                : mode === 'introduction'
                ? 'Brief description of your trip or topic'
                : 'Paste your text here to improve it...'
            }
            rows={4}
            className="w-full"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!inputText.trim() || isLoading}
          className="w-full bg-gradient-to-r from-rausch-500 to-kazan-500 hover:from-rausch-600 hover:to-kazan-600"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get-Suggestions
            </>
          )}
        </Button>

        {/* Output */}
        {outputText && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              AI Suggestion
            </label>
            <div className="relative">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px] whitespace-pre-wrap">
                {outputText}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                {onInsertText && (
                  <Button
                    onClick={handleInsert}
                    size="sm"
                    className="flex-1 bg-rausch-500 hover:bg-rausch-600"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Insert into Editor
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Pro Tips:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Be specific with your input for better results</li>
                <li>• Try different modes to find the best fit</li>
                <li>• Use "Improve Text" to refine existing content</li>
                <li>• Generate multiple versions and pick the best</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

