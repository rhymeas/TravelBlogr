'use client'

export const dynamic = 'force-dynamic'


import React, { useCallback, useMemo, useState } from 'react'

const MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (reasoning)' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B (reasoning)' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B 128E (Instruct)' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B 16E (Instruct)' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
  { id: 'qwen/qwen3-32b', label: 'Qwen 3 32B (reasoning format)' },
]

type ReasoningEffort = 'low' | 'medium' | 'high' | 'default' | 'none'
type ReasoningFormat = 'raw' | 'parsed' | 'hidden'

export default function GroqReasoningTestPage() {
  const [prompt, setPrompt] = useState(
    'Plan a 10-day overland adventure from Rio de Janeiro to Buenos Aires with day-by-day stops, travel times, and 3 activities per stay day.'
  )
  const [model, setModel] = useState(MODELS[0].id)
  const [temperature, setTemperature] = useState(0.3)
  const [maxTokens, setMaxTokens] = useState(1200)

  // Reasoning controls
  const [includeReasoning, setIncludeReasoning] = useState(true)
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium')
  const [reasoningFormat, setReasoningFormat] = useState<ReasoningFormat>('parsed')

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Structured outputs
  const [useStructured, setUseStructured] = useState(false)
  const [schemaName, setSchemaName] = useState('itinerary_plan')
  const [schemaText, setSchemaText] = useState<string>(() => JSON.stringify({
    type: 'object',
    properties: {
      summary: { type: 'string' },
      total_days: { type: 'integer', minimum: 1 },
      route_overview: { type: 'string' },
      days: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day_number: { type: 'integer', minimum: 1 },
            date: { type: 'string' },
            type: { type: 'string', enum: ['travel','stay'] },
            start: { type: 'string' },
            end: { type: 'string' },
            travel_time_hours: { type: 'number' },
            distance_km: { type: 'number' },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  provider: { type: 'string' }
                },
                required: ['title']
              }
            }
          },
          required: ['day_number','type']
        }
      }
    },
    required: ['total_days','days'],
    additionalProperties: false
  }, null, 2))
  const [jsonMode, setJsonMode] = useState(false)


  // Two-stage pipeline (Reason -> Structurize)
  const [twoStage, setTwoStage] = useState(false)
  const [structModel, setStructModel] = useState('llama-3.3-70b-versatile')

  const modelGroup = useMemo<'gptoss' | 'qwen' | 'deepseek' | 'llama'>(() => {
    if (model.startsWith('openai/gpt-oss')) return 'gptoss'
    if (model.startsWith('qwen/qwen3-32b')) return 'qwen'
    if (model.startsWith('deepseek')) return 'deepseek'
    return 'llama'
  }, [model])

  const canSetIncludeReasoning = modelGroup === 'gptoss'
  const canSetEffort = modelGroup === 'gptoss' || modelGroup === 'qwen'
  const canSetFormat = modelGroup === 'qwen'

  const runTest = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/test/groq-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          temperature,
          maxTokens,
          includeReasoning: canSetIncludeReasoning ? includeReasoning : undefined,
          reasoningEffort: canSetEffort ? reasoningEffort : undefined,
          reasoningFormat: canSetFormat ? reasoningFormat : undefined,
          useStructured: useStructured || undefined,
          schemaName: useStructured ? schemaName : undefined,
          schema: (useStructured || twoStage) ? ((): any => { try { return JSON.parse(schemaText) } catch { return undefined } })() : undefined,
          jsonMode: !useStructured && jsonMode ? true : undefined,
          twoStage: twoStage || undefined,
          structurizerModel: twoStage ? structModel : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Request failed')
      }
      setResult(json)
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
    } finally { setIsLoading(false) }

  }, [prompt, model, temperature, maxTokens, includeReasoning, reasoningEffort, reasoningFormat, useStructured, schemaName, schemaText, jsonMode, twoStage, structModel, canSetIncludeReasoning, canSetEffort, canSetFormat])


  const analysis = useMemo(() => {
    try {
      // Prefer structured JSON when two-stage is used
      const content = result?.mode === 'two-stage' ? JSON.stringify(result?.json || {}) : result?.message?.content
      if (!content || typeof content !== 'string') return null
      const json = JSON.parse(content)
      const days = Array.isArray(json?.days) ? json.days : []
      const totalDays = typeof json?.total_days === 'number' ? json.total_days : days.length
      let missingDayFields = 0
      let stayDays = 0
      let totalActivities = 0
      let extraKeys: Record<string, number> = {}
      for (const d of days) {
        const required = ['day_number','type']
        for (const key of required) {
          if (!(key in d)) missingDayFields++
        }
        if (d?.type === 'stay') {
          stayDays++
        }
        const acts = Array.isArray(d?.activities) ? d.activities : []
        totalActivities += acts.length
        const known = new Set(['day_number','date','type','start','end','travel_time_hours','distance_km','activities'])
        for (const k of Object.keys(d)) {
          if (!known.has(k)) extraKeys[k] = (extraKeys[k] || 0) + 1
        }
      }
      const avgActs = stayDays ? (totalActivities / stayDays) : 0
      return {
        parsed: true,
        totalDays,
        daysLen: days.length,
        missingDayFields,
        stayDays,
        avgActs: Number(avgActs.toFixed(2)),
        extraKeys,
      }
    } catch {
      return null
    }
  }, [result])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Groq Reasoning Test</h1>
      <p className="text-sm text-muted-foreground">Quickly compare standard vs reasoning-capable Groq models on a complex itinerary task.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Prompt</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Model</label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Temperature ({temperature})</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Max tokens</label>
            <input
              type="number"
              className="w-full border rounded-md p-2 text-sm"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value || '0', 10))}
              min={256}
              max={4000}
            />
          </div>

          <div className={canSetIncludeReasoning ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm mb-1">Include reasoning (GPT-OSS)</label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={includeReasoning ? 'true' : 'false'}
              onChange={(e) => setIncludeReasoning(e.target.value === 'true')}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>

          <div className={canSetEffort ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm mb-1">Reasoning effort</label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={reasoningEffort}
              onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
            >
              {/* GPT-OSS supports low/medium/high; Qwen supports default/none */}
              {modelGroup === 'gptoss' && (
                <>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </>
              )}
              {modelGroup === 'qwen' && (
                <>
                  <option value="default">default</option>
                  <option value="none">none</option>
                </>
              )}
              {modelGroup !== 'gptoss' && modelGroup !== 'qwen' && (
                <option value="medium">medium</option>

              )}
            </select>
          </div>
        </div>

        {/* Structured outputs / JSON mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Structured Outputs</label>
            <div className="flex items-center gap-2">
              <input id="so-toggle" type="checkbox" checked={useStructured} onChange={(e) => setUseStructured(e.target.checked)} />
              <label htmlFor="so-toggle" className="text-sm">use response_format=json_schema</label>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Schema name</label>
            <input
              type="text"
              className="w-full border rounded-md p-2 text-sm"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              disabled={!useStructured}
            />
          </div>
          <div>
        {/* Two-stage mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Two-stage pipeline</label>
            <div className="flex items-center gap-2">
              <input id="twostage-toggle" type="checkbox" checked={twoStage} onChange={(e) => setTwoStage(e.target.checked)} />
              <label htmlFor="twostage-toggle" className="text-sm">Reason (model above) → Structurize (JSON)</label>
            </div>
          </div>
          <div className={twoStage ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm mb-1">Structurizer model</label>
            <input
              type="text"
              className="w-full border rounded-md p-2 text-sm"
              value={structModel}
              onChange={(e) => setStructModel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: llama-3.3-70b-versatile</p>
          </div>
        </div>

            <label className="block text-sm mb-1">JSON Mode</label>
            <div className="flex items-center gap-2">
              <input id="json-toggle" type="checkbox" checked={jsonMode} onChange={(e) => setJsonMode(e.target.checked)} />
              <label htmlFor="json-toggle" className="text-sm">response_format=json_object</label>
            </div>
          </div>
        </div>

        {(useStructured || twoStage) && (
          <div>
            <label className="block text-sm mb-1">JSON Schema</label>
            <textarea
              className="w-full border rounded-md p-2 text-xs font-mono"
              rows={10}
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Supported models: GPT-OSS 20B/120B, Llama 4 Maverick/Scout, Kimi K2. Streaming/tool use not supported with structured outputs.</p>
          </div>
        )}


        <div className={canSetFormat ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-sm mb-1">Reasoning format (Qwen only)</label>
          <select
            className="w-full border rounded-md p-2 text-sm"
            value={reasoningFormat}
            onChange={(e) => setReasoningFormat(e.target.value as ReasoningFormat)}
          >
            <option value="parsed">parsed</option>
            <option value="raw">raw</option>
            <option value="hidden">hidden</option>
          </select>
        </div>

        <button
          onClick={runTest}
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-50"
        >
          {isLoading ? 'Running…' : 'Run test'}
        </button>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-900 rounded-md p-3 text-sm">{error}</div>
      )}

      {result && (
        <div className="border rounded-md p-4 space-y-3">
          {result.mode === 'two-stage' ? (
            <>
              <div className="text-sm text-muted-foreground">
                Two-stage • Stage1: <span className="font-mono">{result.stage1?.model}</span> → Stage2: <span className="font-mono">{result.stage2?.model}</span> • Duration: {result.durationMs}ms
              </div>
              {(result.stage1?.usage || result.stage2?.usage) && (
                <div className="text-xs text-muted-foreground">
                  usage: {JSON.stringify({ stage1: result.stage1?.usage, stage2: result.stage2?.usage })}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold mb-1">Stage 1 (free-form plan)</div>
                <pre className="whitespace-pre-wrap text-sm">{result.stage1?.message?.content || ''}</pre>
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">Stage 2 (structured JSON)</div>
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(result.json, null, 2)}</pre>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Model: <span className="font-mono">{result.model}</span> • Duration: {result.durationMs}ms
              </div>
              {result.usage && (
                <div className="text-xs text-muted-foreground">
                  usage: {JSON.stringify(result.usage)}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold mb-1">Assistant Message</div>
                <pre className="whitespace-pre-wrap text-sm">{result?.message?.content || ''}</pre>
              </div>
              {result?.message?.reasoning && (
                <div>
                  <div className="text-sm font-semibold mb-1">Reasoning</div>
                  <pre className="whitespace-pre-wrap text-xs opacity-80">{result?.message?.reasoning}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {analysis && (
        <div className="border rounded-md p-4 space-y-2 mt-4">
          <div className="text-sm font-semibold">Analysis</div>
          <div className="text-sm">
            Days: {analysis.daysLen} (declared total_days: {analysis.totalDays})
          </div>
          <div className="text-sm">Missing required fields across days: {analysis.missingDayFields}</div>
          <div className="text-sm">Stay days: {analysis.stayDays} • Avg activities/stay day: {analysis.avgActs}</div>
          {analysis.extraKeys && Object.keys(analysis.extraKeys).length > 0 && (
            <div className="text-xs text-muted-foreground">
              Extra keys: {Object.entries(analysis.extraKeys).map(([k,v]) => `${k} (${v})`).join(', ')}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

