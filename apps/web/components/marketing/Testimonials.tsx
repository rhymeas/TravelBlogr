export function Testimonials() {
  const items = [
    { name: 'Ava', text: 'Planned a 7-day Canada road trip in minutes. Stunning results.' },
    { name: 'Liam', text: 'The credits model is perfect. Pay when I need it.' },
    { name: 'Maya', text: 'Images and POIs feel curated, not generic.' },
  ]
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Loved by travelers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(t => (
            <div key={t.name} className="bg-white rounded-xl p-6 border border-sleek-border">
              <p className="text-sleek-dark-gray mb-4">“{t.text}”</p>
              <div className="text-sm text-sleek-gray">— {t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

