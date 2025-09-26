'use client'

import { Card } from '@/components/ui/Card'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

const blogPosts = [
  {
    id: 1,
    title: 'Lost Temples of Cambodia',
    excerpt: 'Discovering ancient Khmer architecture hidden deep within the jungle canopy, where time stands still and history whispers through stone.',
    image: 'https://images.unsplash.com/photo-1658011803589-515657cb23ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw1fHx0ZW1wbGUlMjBydWlucyUyMGp1bmdsZSUyMGFuY2llbnR8ZW58MHwwfHxncmVlbnwxNzU4ODU5MjU5fDA&ixlib=rb-4.1.0&q=85',
    attribution: 'Tulip Sunflower on Unsplash',
    date: '2024-01-15',
    readTime: '8 min read',
    category: 'Adventure',
    featured: true
  },
  {
    id: 2,
    title: 'Mediterranean Cliff Walks',
    excerpt: 'Breathtaking coastal paths where azure waters meet dramatic limestone cliffs.',
    image: 'https://images.unsplash.com/photo-1604663822328-029edd35b324?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxjbGlmZiUyMG9jZWFuJTIwY29hc3RsaW5lJTIwd2F2ZXN8ZW58MHwwfHxibHVlfDE3NTg4NTkyNjF8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Johannes Mändle on Unsplash',
    date: '2024-01-10',
    readTime: '6 min read',
    category: 'Nature'
  },
  {
    id: 3,
    title: 'Desert Solitude',
    excerpt: 'Finding peace in the endless golden dunes of the Sahara.',
    image: 'https://images.unsplash.com/photo-1599514812243-d6027a99a4a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxkZXNlcnQlMjBzYW5kJTIwZHVuZXMlMjBzdW5zZXQlMjBnb2xkZW58ZW58MHwyfHxvcmFuZ2V8MTc1ODg1OTI2Mnww&ixlib=rb-4.1.0&q=85',
    attribution: 'roberto zuniga on Unsplash',
    date: '2024-01-05',
    readTime: '5 min read',
    category: 'Culture'
  }
]

export function RecentAdventures() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Recent
            <span className="text-gradient block">Adventures</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Latest stories from the road, capturing moments of wonder and discovery
          </p>
        </div>

        {/* Magazine-Style Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Featured Post */}
          <div className="lg:col-span-8 animate-fade-in-up">
            <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full">
              <div className="relative h-96 lg:h-[500px]">
                <img
                  src={blogPosts[0].image}
                  alt={`${blogPosts[0].title} - ${blogPosts[0].attribution}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  width="800"
                  height="500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold">
                    {blogPosts[0].category}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center text-white/80 mb-4 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">Jan 15, 2024</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{blogPosts[0].readTime}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                    {blogPosts[0].title}
                  </h3>
                  
                  <p className="text-white/90 text-lg mb-6 leading-relaxed">
                    {blogPosts[0].excerpt}
                  </p>

                  <button className="flex items-center text-white font-semibold group-hover:text-blue-300 transition-colors duration-300">
                    Read Full Story
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Posts */}
          <div className="lg:col-span-4 space-y-8">
            {blogPosts.slice(1).map((post, index) => (
              <Card 
                key={post.id}
                className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 0.2}s` }}
              >
                <div className="relative h-48">
                  <img
                    src={post.image}
                    alt={`${post.title} - ${post.attribution}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    width="400"
                    height="200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center text-white/80 mb-3 space-x-3 text-xs">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Jan {post.date.split('-')[2]}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                      {post.title}
                    </h3>
                    
                    <p className="text-white/90 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {/* View All Button */}
            <div className="pt-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <button className="w-full glass-effect rounded-2xl p-6 text-center group hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center text-gray-700 font-semibold group-hover:text-blue-600 transition-colors duration-300">
                  View All Adventures
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}