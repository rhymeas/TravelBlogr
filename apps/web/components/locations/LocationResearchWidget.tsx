"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

type Citation = {
  url: string
  title: string
  publisher?: string
  type?: string
  snippet?: string
}

type ResearchResult = {
  summary: string
  facts: string[]
  citations: Citation[]
}

interface Props {
  locationSlug: string
  locationName: string
  limit?: number
  className?: string
}

export function LocationResearchWidget({ locationSlug, locationName, limit = 5, className }: Props) {
  const [data, setData] = useState<ResearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`/api/research/citations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: locationSlug, name: locationName, limit }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok || !j.success) throw new Error(j.error || 'Failed to load research')
        return j as { success: true } & ResearchResult
      })
      .then((j) => setData({ summary: j.summary, facts: j.facts || [], citations: j.citations || [] }))
      .catch((e) => { if (!ctrl.signal.aborted) setError(e.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [locationSlug, locationName, limit])

  const topCitations = useMemo(() => (data?.citations || []).slice(0, 4), [data])
  const fallbackCitations = useMemo(() => {
    const name = locationName || locationSlug.replace(/[-_]/g, ' ')
    return [
      {
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`,
        title: `Search “${name}”`,
        publisher: 'Wikipedia'
      },
      {
        url: `https://en.wikivoyage.org/wiki/Special:Search?search=${encodeURIComponent(name)}`,
        title: `Search “${name}”`,
        publisher: 'Wikivoyage'
      }
    ] as Citation[]
  }, [locationName, locationSlug])

  return (
    <Card className={`border border-gray-200 rounded-xl bg-white ${className || ''}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-widest text-gray-500">Research</span>
          {/* Minimal mono dot */}
          <span className="w-2 h-2 rounded-full bg-gray-900/80" aria-hidden />
        </div>

        {/* Summary */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2">What to know about {locationName}</h3>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-xs text-gray-600">No research available yet.</p>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{data?.summary || '—'}</p>
        )}

        {/* Facts */}
        {(!loading && data?.facts?.length) ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {data!.facts.slice(0, 2).map((f, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400" />
                <p className="text-sm text-gray-700">{f}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Divider */}
        <div className="my-4 h-px bg-gray-100" />

        {/* Citations */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-6 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-6 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-6 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : topCitations.length ? (
            topCitations.map((c, i) => (
              <CitationRow key={i} url={c.url} title={c.title} publisher={c.publisher} />
            ))
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Citations coming soon. Try these quick sources:</p>
              {fallbackCitations.map((c, i) => (
                <CitationRow key={`fallback-${i}`} url={c.url} title={c.title} publisher={c.publisher} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function CitationRow({ url, title, publisher }: { url: string; title: string; publisher?: string }) {
  const host = useMemo(() => {
    try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
  }, [url])

  const display = publisher || host || 'Source'

  return (
    <div className="group flex items-center gap-3">
      {/* Bubbly mono badge */}
      <div className="shrink-0 rounded-full bg-gray-100 text-gray-800 border border-gray-200 px-2.5 py-1 text-[11px] font-medium">
        {display}
      </div>
      <Link href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 text-sm text-gray-900 hover:underline truncate">
        {title || url}
      </Link>
    </div>
  )
}

