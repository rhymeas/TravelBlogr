import type { Database } from './database'

// Database types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type ShareLink = Database['public']['Tables']['share_links']['Row']
export type Media = Database['public']['Tables']['media']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type ShareLinkInsert = Database['public']['Tables']['share_links']['Insert']
export type MediaInsert = Database['public']['Tables']['media']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type TripUpdate = Database['public']['Tables']['trips']['Update']
export type PostUpdate = Database['public']['Tables']['posts']['Update']
export type ShareLinkUpdate = Database['public']['Tables']['share_links']['Update']
export type MediaUpdate = Database['public']['Tables']['media']['Update']

// Extended types with relations
export interface TripWithPosts extends Trip {
  posts: Post[]
  media: Media[]
  share_links: ShareLink[]
  profile: Profile
}

export interface PostWithMedia extends Post {
  media: Media[]
  trip: Trip
}

export interface ShareLinkWithTrip extends ShareLink {
  trip: TripWithPosts
}

// Location types
export interface Location {
  lat: number
  lng: number
  address?: string
  city?: string
  country?: string
  place_name?: string
}

export interface LocationData {
  coordinates: Location
  timezone?: string
  weather?: {
    temperature: number
    condition: string
    icon: string
  }
}

// Share link types
export type ShareLinkType = 'public' | 'family' | 'friends' | 'professional'

export interface ShareLinkSettings {
  show_location: boolean
  show_dates: boolean
  allow_comments: boolean
  allow_downloads: boolean
  custom_branding: boolean
  password_protected: boolean
  require_email: boolean
  analytics_enabled: boolean
  seo_enabled: boolean
}

// Media types
export interface MediaUpload {
  file: File
  preview?: string
  caption?: string
  alt_text?: string
  location?: Location
}

export interface MediaProcessed extends Media {
  optimized_url?: string
  blur_data_url?: string
}

// Trip status
export type TripStatus = 'draft' | 'published' | 'archived'

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  privacy: {
    show_location: boolean
    show_real_time: boolean
    allow_indexing: boolean
  }
  notifications: {
    email: boolean
    push: boolean
    comments: boolean
    shares: boolean
  }
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Real-time types
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

// Form types
export interface TripFormData {
  title: string
  description?: string
  start_date?: string
  end_date?: string
  cover_image?: File | string
  status: TripStatus
  is_featured: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  featured_image?: File | string
  location?: Location
  post_date: string
  media?: MediaUpload[]
}

export interface ShareLinkFormData {
  link_type: ShareLinkType
  title?: string
  description?: string
  password?: string
  expires_at?: string
  settings: ShareLinkSettings
}

// Analytics types
export interface TripAnalytics {
  views: number
  unique_visitors: number
  shares: number
  comments: number
  downloads: number
  top_countries: Array<{ country: string; count: number }>
  daily_views: Array<{ date: string; views: number }>
}

// Search types
export interface SearchFilters {
  query?: string
  location?: string
  date_from?: string
  date_to?: string
  status?: TripStatus[]
  tags?: string[]
  user_id?: string
}

export interface SearchResult {
  trips: Trip[]
  posts: Post[]
  users: Profile[]
  total: number
}
