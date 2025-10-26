export function FAQ() {
  const faqs = [
    { q: 'How do credits work?', a: 'Each AI itinerary generation uses one credit. Buy more anytime.' },
    { q: 'Do unused credits expire?', a: 'No. Credits never expire.' },
    { q: 'Can I share trips?', a: 'Yes. Public links or password-protected share links are supported.' },
  ]
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">FAQs</h2>
        <div className="space-y-4">
          {faqs.map(f => (
            <div key={f.q} className="rounded-xl border border-sleek-border p-5 bg-white">
              <div className="font-semibold mb-1">{f.q}</div>
              <div className="text-sleek-gray text-sm">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

