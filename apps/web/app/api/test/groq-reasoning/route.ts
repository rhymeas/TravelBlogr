import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createGroqClient } from '@/lib/groq'

// POST /api/test/groq-reasoning
// Body: { prompt: string, model?: string, reasoningEffort?: 'low'|'medium'|'high'|'default'|'none', reasoningFormat?: 'raw'|'parsed'|'hidden', includeReasoning?: boolean, maxTokens?: number, useStructured?: boolean, schemaName?: string, schema?: any, jsonMode?: boolean, twoStage?: boolean, structurizerModel?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      prompt?: string
      model?: string
      reasoningEffort?: 'low' | 'medium' | 'high' | 'default' | 'none'
      reasoningFormat?: 'raw' | 'parsed' | 'hidden'
      includeReasoning?: boolean
      maxTokens?: number
      temperature?: number
      useStructured?: boolean
      schemaName?: string
      schema?: any
      jsonMode?: boolean
      twoStage?: boolean
      structurizerModel?: string
    }

    const prompt = body.prompt?.toString()?.trim()
    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'Missing prompt' }, { status: 400 })
    }

    const model = body.model || 'openai/gpt-oss-120b'
    const max_tokens = typeof body.maxTokens === 'number' ? body.maxTokens : 1200
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.3

    const client: Groq = createGroqClient()

    const startedAt = Date.now()

    // Direct JSON mode: single-stage with json_object format
    if (body.jsonMode && !body.twoStage) {
      const response = await client.chat.completions.create({
        model,
        temperature,
        max_tokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an expert travel planner. Generate a detailed itinerary in valid JSON format. Return only JSON, no other text.' },
          { role: 'user', content: prompt + '\n\nReturn the response as valid JSON.' }
        ]
      })

      const content = response.choices?.[0]?.message?.content || '{}'
      const tookMs = Date.now() - startedAt

      try {
        const parsed = JSON.parse(content)
        return NextResponse.json({
          ok: true,
          mode: 'json-mode',
          message: response.choices?.[0]?.message,
          json: parsed,
          durationMs: tookMs,
          usage: (response as any).usage
        })
      } catch (error) {
        return NextResponse.json({
          ok: true,
          mode: 'json-mode',
          message: response.choices?.[0]?.message,
          json: {},
          durationMs: tookMs,
          error: 'Failed to parse JSON response',
          usage: (response as any).usage
        })
      }
    }

    // Two-stage mode: reason (free-form) → structurize (json)
    if (body.twoStage && body.schema) {
      const reasoner = model // use provided model as stage 1 reasoner
      const structurizer = body.structurizerModel || 'llama-3.3-70b-versatile'

      const stage1 = await client.chat.completions.create({
        model: reasoner,
        temperature,
        max_tokens: Math.min(max_tokens, 2200),
        messages: [
          { role: 'system', content: 'You are an expert travel planner. Think step by step and write a concise, readable day-by-day plan in plain text (not JSON). Include realistic travel times/distances and intermediate stops for long segments.' },
          { role: 'user', content: prompt }
        ]
      })

      const freeform = stage1.choices?.[0]?.message?.content || ''
      console.log('[Stage 1] Freeform output length:', freeform.length, 'First 200 chars:', freeform.substring(0, 200))

      const stage2 = await client.chat.completions.create({
        model: structurizer,
        temperature: 0.0,
        response_format: { type: 'json_object' },
        max_tokens: Math.min(900, max_tokens),
        messages: [
          { role: 'system', content: 'Return only a single valid JSON object matching the provided schema. Do not include code fences or extra text.' },
          { role: 'user', content: `SCHEMA:\n${JSON.stringify(body.schema)}\n\nITINERARY (free-form):\n\n${freeform}` }
        ]
      })

      let finalText = stage2.choices?.[0]?.message?.content || '{}'
      let parsed: any = null
      try {
        parsed = JSON.parse(finalText)
      } catch {
        const fix = await client.chat.completions.create({
          model: structurizer,
          temperature: 0.0,
          response_format: { type: 'json_object' },
          max_tokens: Math.min(900, max_tokens),
          messages: [
            { role: 'system', content: 'Return only a single valid JSON object matching the provided schema. Do not include code fences or extra text.' },
            { role: 'user', content: `Fix to valid JSON matching SCHEMA. Only JSON.\n\nSCHEMA:\n${JSON.stringify(body.schema)}\n\nJSON:\n${finalText}` }
          ]
        })
        finalText = fix.choices?.[0]?.message?.content || '{}'
        parsed = JSON.parse(finalText)
      }

      const tookMs = Date.now() - startedAt
      return NextResponse.json({
        ok: true,
        mode: 'two-stage',
        stage1: { model: reasoner, message: stage1.choices?.[0]?.message, usage: (stage1 as any).usage },
        stage2: { model: structurizer, message: stage2.choices?.[0]?.message, usage: (stage2 as any).usage },
        durationMs: tookMs,
        json: parsed
      })
    }

    // Build request options with safe per-model reasoning params
    const request: any = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens,
      temperature,
    }

    // Structured Outputs or JSON mode
    const supportsStructured = (
      model.startsWith('openai/gpt-oss') ||
      model.startsWith('meta-llama/llama-4-maverick') ||
      model.startsWith('meta-llama/llama-4-scout') ||
      model.startsWith('moonshotai/kimi-k2')
    )

    if (body.useStructured && supportsStructured && body.schema) {
      request.response_format = {
        type: 'json_schema',
        json_schema: {
          name: body.schemaName || 'structured_output',
          schema: body.schema,
        },
      }
    } else if (body.jsonMode) {
      request.response_format = { type: 'json_object' }
    }

    // Apply reasoning knobs based on model families (skip reasoning_format when in JSON/structured mode)
    const jsonOrStructured = !!request.response_format

    // GPT-OSS supports include_reasoning and reasoning_effort (low/medium/high)
    if (model.startsWith('openai/gpt-oss')) {
      if (typeof body.includeReasoning === 'boolean') {
        request.include_reasoning = body.includeReasoning
      }
      if (body.reasoningEffort === 'low' || body.reasoningEffort === 'medium' || body.reasoningEffort === 'high') {
        request.reasoning_effort = body.reasoningEffort
      }
    }

    // Qwen 3 32B supports reasoning_format and reasoning_effort (default/none)
    if (!jsonOrStructured && model.startsWith('qwen/qwen3-32b')) {
      if (body.reasoningFormat === 'raw' || body.reasoningFormat === 'parsed' || body.reasoningFormat === 'hidden') {
        request.reasoning_format = body.reasoningFormat
      }
      if (body.reasoningEffort === 'default' || body.reasoningEffort === 'none') {
        request.reasoning_effort = body.reasoningEffort
      }
    }

    const completion = await client.chat.completions.create(request)

    const tookMs = Date.now() - startedAt

    const choice = completion.choices?.[0]?.message || null
    const usage = (completion as any).usage || null

    return NextResponse.json({
      ok: true,
      model,
      durationMs: tookMs,
      message: choice,
      usage,
      raw: completion,
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

