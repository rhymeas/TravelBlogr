# Canada Tour 2025 Application

## Overview

This is a comprehensive travel application for managing and showcasing a 17-day tour through Canada, focusing on the Okanagan Valley wine regions and Rocky Mountains. The application provides both a public-facing tour showcase and an administrative interface for content management. Built as a full-stack web application with a React frontend and Express backend, it features location management, image galleries, tour settings, and responsive design optimized for travel planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing (Home, Location Detail, Admin Panel)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with endpoints for locations, tour settings, and file uploads
- **Data Storage**: PostgreSQL database with Drizzle ORM for type-safe operations
- **File Uploads**: Google Cloud Storage integration for image management
- **Development**: Hot module replacement via Vite integration for development workflow

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Structured tables for locations, location images, and tour settings with JSON fields for flexible data
- **Object Storage**: Google Cloud Storage integration with ACL policies for secure file management
- **Migration**: Drizzle migrations for database schema versioning

### Authentication and Authorization
- **Object Access**: Custom ACL system for granular file access control
- **Service Authentication**: Google Cloud service account authentication
- **Admin Access**: Basic admin panel with simple password authentication

### External Dependencies
- **Google Cloud Storage**: For image and file storage with programmatic access control
- **Neon Database**: PostgreSQL database hosting with serverless connection pooling
- **Font Loading**: Google Fonts (Inter) for consistent typography

The architecture prioritizes type safety throughout the stack, responsive design for mobile and desktop use, and a clear separation between public tour showcase and administrative functionality. The modular component structure and shared schema definitions enable consistent data handling between frontend and backend.

## Setup and Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager
- PostgreSQL database (Neon Database recommended)
- Google Cloud Storage bucket and service account

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
PUBLIC_OBJECT_SEARCH_PATHS=your_bucket/public
PRIVATE_OBJECT_DIR=your_bucket/private

# Admin Authentication
ADMIN_TOKEN=your_admin_token

# Server
PORT=5000
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd canada-tour-2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Google Cloud Storage Setup

1. Create a Google Cloud Storage bucket
2. Create a service account with Storage Admin permissions
3. Download the service account key JSON file
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the key file
5. Configure the bucket paths in your environment variables

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables include:
- `locations` - Tour locations with details and coordinates
- `location_images` - Images associated with locations
- `trip_photos` - User-uploaded photos during the trip
- `tour_settings` - Application configuration and settings
- `hero_images` - Featured images for the tour
- `scenic_content` - Additional scenic content and descriptions

## API Endpoints

### Public Endpoints
- `GET /api/locations` - Get all tour locations
- `GET /api/tour-settings` - Get tour configuration
- `POST /api/simple-login` - Simple password authentication
- `GET /public-objects/:filePath` - Access public images

### Admin Endpoints (require authentication)
- `POST /api/admin/locations` - Create/update locations
- `POST /api/admin/tour-settings` - Update tour settings
- `POST /api/admin/sync-external` - Sync external data
- `POST /api/admin/rebuild-hero` - Rebuild hero images

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

### Project Structure
```
├── client/          # React frontend
│   └── src/
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── dist/           # Built application
```

## Contributing

1. Follow the existing code style and TypeScript conventions
2. Use the shared schema definitions for type safety
3. Test both frontend and backend changes
4. Update documentation for significant changes

## License

MIT License
