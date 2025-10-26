export function Features() {
  const features = [
    { title: 'AI Itinerary', desc: 'Smart routes, must-sees, and timing.' },
    { title: 'Global Locations', desc: 'Works for any place worldwide.' },
    { title: 'Photo Editing', desc: 'Fast image search and editing UI.' },
    { title: 'Share & Collaborate', desc: 'Simple links, passworded shares.' },
  ]
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="rounded-xl border border-sleek-border p-6 bg-white">
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sleek-gray text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

