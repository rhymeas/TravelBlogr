const testimonials = [
  {
    content: "TravelBlogr has completely changed how I share my adventures. I can show my professional network the business side of my travels while sharing intimate family moments privately.",
    author: {
      name: 'Sarah Chen',
      role: 'Travel Photographer',
      imageUrl: '/testimonials/sarah.jpg',
    },
  },
  {
    content: "The audience-specific sharing is genius. My family gets the full story with all the details, while my LinkedIn connections see a polished professional summary.",
    author: {
      name: 'Marcus Rodriguez',
      role: 'Digital Nomad',
      imageUrl: '/testimonials/marcus.jpg',
    },
  },
  {
    content: "Finally, a platform that understands that not everyone needs to see everything. The privacy controls are exactly what I was looking for.",
    author: {
      name: 'Emma Thompson',
      role: 'Travel Blogger',
      imageUrl: '/testimonials/emma.jpg',
    },
  },
]

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by travelers worldwide
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            See what our community of travelers has to say about TravelBlogr.
          </p>
        </div>
        
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, testimonialIdx) => (
              <div
                key={testimonialIdx}
                className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow"
              >
                <blockquote className="text-gray-900">
                  <p className="text-lg leading-7">"{testimonial.content}"</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author.name}</div>
                    <div className="text-gray-600">{testimonial.author.role}</div>
                  </div>
                </figcaption>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-x-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <span>⭐⭐⭐⭐⭐</span>
            <span>4.9/5 from 2,000+ travelers</span>
          </div>
        </div>
      </div>
    </section>
  )
}
