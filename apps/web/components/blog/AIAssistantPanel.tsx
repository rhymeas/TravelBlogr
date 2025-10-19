'use client'

/**
 * AI Assistant Panel for Blog Editor
 * 
 * Provides GROQ-powered content suggestions:
 * - SEO score and keyword suggestions
 * - Headline variations
 * - Meta description generation
 * - Content improvement tips
 */

import { useState } from 'react'
import { X, Sparkles, Loader2, TrendingUp, FileText, Tag, CheckCircle } from 'lucide-react'
import { 
  analyzeSEO, 
  generateHeadlineVariations, 
  generateMetaDescription,
  getContentSuggestions,
  SEOAnalysis,
  HeadlineVariation,
  MetaDescription,
  ContentSuggestion
} from '@/lib/services/aiContentAssistant'

interface AIAssistantPanelProps {
  title: string
  content: string
  destination: string
  onSelectHeadline: (headline: string) => void
  onSelectMetaDescription: (description: string) => void
  onClose: () => void
}

export function AIAssistantPanel({ 
  title, 
  content, 
  destination, 
  onSelectHeadline, 
  onSelectMetaDescription,
  onClose 
}: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<'seo' | 'headlines' | 'meta' | 'suggestions'>('seo')
  const [isLoading, setIsLoading] = useState(false)
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null)
  const [headlines, setHeadlines] = useState<HeadlineVariation[]>([])
  const [metaDesc, setMetaDesc] = useState<MetaDescription | null>(null)
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])

  const contentText = typeof content === 'string' ? content : JSON.stringify(content)

  const runSEOAnalysis = async () => {
    setIsLoading(true)
    try {
      const analysis = await analyzeSEO(title, contentText)
      setSeoAnalysis(analysis)
    } catch (error) {
      console.error('SEO analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateHeadlines = async () => {
    setIsLoading(true)
    try {
      const variations = await generateHeadlineVariations(title, destination)
      setHeadlines(variations)
    } catch (error) {
      console.error('Headline generation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMeta = async () => {
    setIsLoading(true)
    try {
      const meta = await generateMetaDescription(title, contentText)
      setMetaDesc(meta)
    } catch (error) {
      console.error('Meta description error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSuggestions = async () => {
    setIsLoading(true)
    try {
      const tips = await getContentSuggestions(title, contentText, destination)
      setSuggestions(tips)
    } catch (error) {
      console.error('Suggestions error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed left-0 top-0 h-full w-96 bg-white shadow-2xl border-r border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl font-bold">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-purple-100">GROQ-powered content optimization</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-[120px] z-10">
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'seo'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="h-4 w-4 mx-auto mb-1" />
          SEO
        </button>
        <button
          onClick={() => setActiveTab('headlines')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'headlines'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 mx-auto mb-1" />
          Headlines
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'meta'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="h-4 w-4 mx-auto mb-1" />
          Meta
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4 mx-auto mb-1" />
          Tips
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            {!seoAnalysis ? (
              <button
                onClick={runSEOAnalysis}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Analyze SEO
                  </>
                )}
              </button>
            ) : (
              <>
                {/* SEO Score */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
                    {seoAnalysis.score}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">SEO Score</div>
                </div>

                {/* Keywords */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Top Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {seoAnalysis.keywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Improvements</h3>
                  <div className="space-y-2">
                    {seoAnalysis.suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.wordCount}</div>
                    <div className="text-sm text-gray-600">Words</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.readabilityScore}</div>
                    <div className="text-sm text-gray-600">Readability</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Headlines Tab */}
        {activeTab === 'headlines' && (
          <div className="space-y-4">
            {headlines.length === 0 ? (
              <button
                onClick={generateHeadlines}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Headlines
                  </>
                )}
              </button>
            ) : (
              headlines.map((headline, i) => (
                <button
                  key={i}
                  onClick={() => onSelectHeadline(headline.headline)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 group-hover:text-purple-600">
                      {headline.headline}
                    </h4>
                    <span className={`text-sm font-bold ${getScoreColor(headline.score)}`}>
                      {headline.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{headline.reason}</p>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {headline.type}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Meta Description Tab */}
        {activeTab === 'meta' && (
          <div className="space-y-4">
            {!metaDesc ? (
              <button
                onClick={generateMeta}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Tag className="h-5 w-5" />
                    Generate Meta Description
                  </>
                )}
              </button>
            ) : (
              <>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <p className="text-gray-900 mb-3">{metaDesc.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className={metaDesc.length <= 160 ? 'text-green-600' : 'text-red-600'}>
                      {metaDesc.length} characters
                    </span>
                    <div className="flex gap-2">
                      {metaDesc.includesKeywords && (
                        <span className="text-green-600">✓ Keywords</span>
                      )}
                      {metaDesc.callToAction && (
                        <span className="text-green-600">✓ CTA</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onSelectMetaDescription(metaDesc.description)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
                >
                  Use This Description
                </button>
              </>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <button
                onClick={generateSuggestions}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Get Suggestions
                  </>
                )}
              </button>
            ) : (
              suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-l-4 ${
                    suggestion.priority === 'high'
                      ? 'border-red-500 bg-red-50'
                      : suggestion.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-gray-600">
                      {suggestion.section}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      suggestion.type === 'add' ? 'bg-green-100 text-green-700' :
                      suggestion.type === 'improve' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {suggestion.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{suggestion.suggestion}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

