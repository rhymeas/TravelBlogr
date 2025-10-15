/**
 * Translation Test Page
 * Demonstrates automatic translation of location names
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { TranslatedLocationName, TranslationBadge } from '@/components/ui/TranslatedLocationName'
import { useLocationTranslation } from '@/hooks/useTranslation'

const TEST_LOCATIONS = [
  '长海县', // Chinese - Changhai County
  '서울특별시', // Korean - Seoul
  '東京', // Japanese - Tokyo
  'Vancouver', // English - should not translate
  'Москва', // Russian - Moscow
  'القاهرة', // Arabic - Cairo
  'Paris', // French - should not translate
  'São Paulo', // Portuguese - should not translate
]

export default function TranslationTestPage() {
  const [customText, setCustomText] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  const handleTest = async () => {
    if (!customText) return

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText })
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('Translation test error:', error)
      setTestResult({ success: false, error: 'Failed to translate' })
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-4xl font-bold">Translation Test Page</h1>

      {/* Demo Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Automatic Translation Demo</h2>
        <p className="mb-6 text-muted-foreground">
          Location names in non-Latin scripts are automatically translated to English.
        </p>

        <div className="space-y-4 rounded-lg border p-6">
          {TEST_LOCATIONS.map((location) => (
            <LocationTestRow key={location} name={location} />
          ))}
        </div>
      </section>

      {/* Custom Test Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Test Custom Text</h2>
        <div className="space-y-4 rounded-lg border p-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter location name in any language..."
              className="flex-1 rounded-md border px-4 py-2"
            />
            <button
              onClick={handleTest}
              className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Translate
            </button>
          </div>

          {testResult && (
            <div className="mt-4 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
              <pre className="text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Component Usage Examples */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Component Usage Examples</h2>
        <div className="space-y-6 rounded-lg border p-6">
          <div>
            <h3 className="mb-2 font-medium">Default (with original in parentheses)</h3>
            <TranslatedLocationName name="长海县" className="text-lg" />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Without original name</h3>
            <TranslatedLocationName name="서울특별시" showOriginal={false} className="text-lg" />
          </div>

          <div>
            <h3 className="mb-2 font-medium">With loading indicator</h3>
            <TranslatedLocationName name="東京" showLoadingIndicator className="text-lg" />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Latin text (no translation needed)</h3>
            <TranslatedLocationName name="Vancouver" className="text-lg" />
          </div>
        </div>
      </section>
    </div>
  )
}

function LocationTestRow({ name }: { name: string }) {
  const { original, translated, needsTranslation, isTranslating } = useLocationTranslation(name)

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex-1">
        <div className="font-medium">
          {original}
          <TranslationBadge show={needsTranslation} />
        </div>
        {needsTranslation && (
          <div className="mt-1 text-sm text-muted-foreground">
            {isTranslating ? (
              <span className="italic">Translating...</span>
            ) : (
              <span>→ {translated}</span>
            )}
          </div>
        )}
      </div>
      <div className="ml-4 text-sm text-muted-foreground">
        {needsTranslation ? '🌐 Needs translation' : '✓ Latin script'}
      </div>
    </div>
  )
}

