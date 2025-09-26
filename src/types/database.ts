export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          slug: string
          cover_image: string | null
          start_date: string | null
          end_date: string | null
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          location_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          slug: string
          cover_image?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          location_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          slug?: string
          cover_image?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          location_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          title: string
          content: string
          excerpt: string | null
          featured_image: string | null
          location: Json | null
          post_date: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          title: string
          content: string
          excerpt?: string | null
          featured_image?: string | null
          location?: Json | null
          post_date: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          title?: string
          content?: string
          excerpt?: string | null
          featured_image?: string | null
          location?: Json | null
          post_date?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          link_type: 'public' | 'family' | 'friends' | 'professional'
          token: string
          title: string | null
          description: string | null
          password: string | null
          expires_at: string | null
          view_count: number
          settings: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          link_type: 'public' | 'family' | 'friends' | 'professional'
          token: string
          title?: string | null
          description?: string | null
          password?: string | null
          expires_at?: string | null
          view_count?: number
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          link_type?: 'public' | 'family' | 'friends' | 'professional'
          token?: string
          title?: string | null
          description?: string | null
          password?: string | null
          expires_at?: string | null
          view_count?: number
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          user_id: string
          trip_id: string | null
          post_id: string | null
          filename: string
          original_name: string
          file_type: string
          file_size: number
          url: string
          thumbnail_url: string | null
          alt_text: string | null
          caption: string | null
          location: Json | null
          taken_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id?: string | null
          post_id?: string | null
          filename: string
          original_name: string
          file_type: string
          file_size: number
          url: string
          thumbnail_url?: string | null
          alt_text?: string | null
          caption?: string | null
          location?: Json | null
          taken_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trip_id?: string | null
          post_id?: string | null
          filename?: string
          original_name?: string
          file_type?: string
          file_size?: number
          url?: string
          thumbnail_url?: string | null
          alt_text?: string | null
          caption?: string | null
          location?: Json | null
          taken_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
