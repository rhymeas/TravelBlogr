# TravelBlogr

> Share your journey with different audiences - from professional portfolios to intimate family updates.

TravelBlogr is a modern travel blogging platform that revolutionizes how travelers document and share their journeys. Create one trip and share it in completely different ways depending on your audience.

## 🚀 Quick Links

- **[Deploy to Railway](./DEPLOY.md)** - One command deployment
- **[Quick Start](./docs/QUICK_START.md)** - Get started in 5 minutes
- **[Cloudinary CDN Setup](./docs/CLOUDINARY_SETUP.md)** - 80% faster images (free!)
- **[Rules](./.augment/rules/imported/rules.md)** - Coding standards

## 🌟 Features

### 🎯 Audience-Specific Sharing
- **Public Portfolio**: Professional travel content for career and networking
- **Family Updates**: Personal moments and detailed updates for loved ones  
- **Professional Network**: Business travel insights and industry connections
- **Friends Circle**: Casual updates and fun moments

### 🔒 Privacy & Security
- Granular privacy controls
- GDPR compliant
- Row-level security with Supabase
- Secure share links with optional passwords and expiration

### 📱 Modern Experience
- Beautiful, responsive design
- Real-time updates
- Interactive maps with Mapbox
- Drag & drop media management
- Mobile-optimized interface

### 🚀 Technical Excellence
- Domain-Driven Design (DDD)
- Clean Architecture
- SOLID principles
- Comprehensive testing
- Type-safe with TypeScript

## 🏗️ Architecture

This project follows Domain-Driven Design principles with Clean Architecture:

```
├── apps/
│   └── web/                 # Next.js web application
├── packages/
│   └── core/               # Core domain logic
│       ├── domain/         # Entities, value objects, events
│       └── application/    # Use cases, repositories, services
├── infrastructure/         # External concerns
│   ├── database/          # Supabase repositories
│   ├── services/          # External service implementations
│   └── container/         # Dependency injection
├── tests/                 # Test suites
└── docs/                  # Documentation
```

### Domain Layer
- **Entities**: User, Trip, Post, ShareLink, Media
- **Value Objects**: Email, UserName, TripTitle, TripSlug, etc.
- **Domain Events**: UserCreated, TripPublished, etc.
- **Aggregates**: Trip (aggregate root)

### Application Layer
- **Use Cases**: CreateUser, CreateTrip, PublishTrip, etc.
- **Repository Interfaces**: UserRepository, TripRepository, etc.
- **Services**: EventBus, EmailService, etc.

### Infrastructure Layer
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Maps**: Mapbox integration
- **Real-time**: Supabase Realtime

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Cloudinary account (free - for image CDN)
- Mapbox account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/travelblogr.git
   cd travelblogr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example apps/web/.env.local
   ```

   Fill in your credentials:
   - Supabase URL and keys
   - Cloudinary cloud name (see [Cloudinary Setup](./docs/CLOUDINARY_SETUP.md))
   - Other optional services

4. **Set up the database**
   ```bash
   # Run the schema in your Supabase SQL editor
   cat infrastructure/database/schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 📦 Deployment

### Railway (Current Platform)

**See full guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

**Quick Deploy:**

1. **Connect GitHub to Railway**
   - Railway Dashboard → New Project → Deploy from GitHub
   - Select: `rhymeas/TravelBlogr`

2. **Add Environment Variables**
   - Copy from `apps/web/.env.local`
   - Add to Railway → Variables tab
   - **Critical:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Generate Public Domain**
   - Settings → Networking → Generate Domain
   - Test: `https://your-app-production.up.railway.app`

4. **Add Custom Domain (Optional)**
   - Settings → Networking → Add Custom Domain
   - Configure DNS CNAME to Railway domain

**Important:** Changing `NEXT_PUBLIC_*` variables requires a **rebuild**, not just restart!

### Docker (Alternative)
```bash
# Build the image
docker build -t travelblogr .

# Run the container
docker run -p 3000:3000 travelblogr
```

## 🛠️ Development

### Project Structure
- **Domain-First**: Business logic is isolated from infrastructure
- **Dependency Injection**: Using Inversify for IoC
- **Event-Driven**: Domain events for loose coupling
- **Type Safety**: Full TypeScript coverage
- **Testing**: Unit, integration, and E2E tests

### Code Style
- ESLint + Prettier for formatting
- Conventional Commits
- Husky for git hooks
- Path mapping with `@/` aliases

### Database Migrations
```bash
# Generate types from Supabase
npm run db:generate

# Reset database (development only)
npm run db:reset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Mapbox](https://www.mapbox.com/) - Maps and location services
- [Lucide](https://lucide.dev/) - Beautiful icons

## 📞 Support

- 📧 Email: support@travelblogr.com
- 💬 Discord: [Join our community](https://discord.gg/travelblogr)
- 📖 Documentation: [docs.travelblogr.com](https://docs.travelblogr.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/travelblogr/issues)

---

Made with ❤️ for travelers worldwide
