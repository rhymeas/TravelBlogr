'use client'

import { useState } from 'react'

type Pack = { name: string; credits: number; priceCents: number; featured?: boolean; description?: string }

const PACKS: Pack[] = [
  { name: 'Starter', credits: 10, priceCents: 1000, description: 'Great to try out AI trips' },
  { name: 'Explorer', credits: 30, priceCents: 3000, featured: true, description: 'Plan multiple trips' },
  { name: 'Adventurer', credits: 100, priceCents: 10000, description: 'For power users and teams' },
]

export default function CreditsPage() {
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  const buy = async (pack: Pack) => {
    try {
      setLoadingPack(pack.name)
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: pack.credits }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to create checkout')
      if (json?.url) window.location.href = json.url
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoadingPack(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-sleek-black mb-3">Buy Credits</h1>
      <p className="text-sleek-gray mb-10">Pay-as-you-go credits for AI itinerary generations. No subscriptions.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKS.map((p) => (
          <div key={p.name} className={`rounded-lg border ${p.featured ? 'border-rausch-500 shadow-lg' : 'border-sleek-border'} p-6 flex flex-col`}>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{p.name}</h2>
              <p className="text-sleek-gray mb-4">{p.description}</p>
              <div className="text-4xl font-extrabold mb-2">${(p.priceCents/100).toFixed(0)}</div>
              <div className="text-sm text-sleek-gray">{p.credits} credits</div>
            </div>
            <button
              onClick={() => buy(p)}
              disabled={!!loadingPack}
              className={`mt-6 inline-flex justify-center items-center rounded-md px-4 py-2 text-white ${p.featured ? 'bg-rausch-600 hover:bg-rausch-700' : 'bg-sleek-black hover:bg-sleek-dark'}`}
            >
              {loadingPack === p.name ? 'Redirecting…' : 'Buy now'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

