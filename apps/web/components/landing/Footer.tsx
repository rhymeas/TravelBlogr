'use client'

import { Instagram, Twitter, Mail, MapPin, Heart } from 'lucide-react'

const footerLinks = {
  explore: [
    { name: 'Destinations', href: '#' },
    { name: 'Travel Guides', href: '#' },
    { name: 'Photography', href: '#' },
    { name: 'Adventures', href: '#' }
  ],
  connect: [
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Newsletter', href: '#' },
    { name: 'Collaborate', href: '#' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'Disclaimer', href: '#' }
  ]
}

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: '#', color: 'hover:text-pink-500' },
  { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
  { name: 'Email', icon: Mail, href: '#', color: 'hover:text-green-500' }
]

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-light mb-4 tracking-tight">
                Wanderlust
                <span className="text-gradient-elegant block font-normal">Chronicles</span>
              </h3>
              <p className="text-gray-400 leading-relaxed font-light">
                Inspiring wanderlust through authentic stories, breathtaking photography, 
                and genuine travel experiences from around the world.
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-400 mb-6">
              <MapPin className="h-4 w-4 mr-2 text-rose-400" />
              <span className="text-sm font-light">Currently exploring Southeast Asia</span>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gray-700 transform hover:scale-110 ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="font-medium text-lg mb-6">Explore</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Links */}
          <div>
            <h4 className="font-medium text-lg mb-6">Connect</h4>
            <ul className="space-y-3">
              {footerLinks.connect.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 className="font-medium text-lg mb-6">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4 font-light">
              Get the latest travel stories and photography tips delivered to your inbox.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-blue-500 text-sm"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-r-lg transition-all duration-300 transform hover:scale-[1.02]">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center text-gray-400 text-sm">
              <span>© 2024 Wanderlust Chronicles. Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500 animate-pulse" />
              <span>for fellow travelers.</span>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6">
              {footerLinks.legal.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600" />
    </footer>
  )
}