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
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          location: string | null
          is_email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          is_email_verified?: boolean
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
          is_email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          location_data: Json | null
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
          location_data?: Json | null
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
          location_data?: Json | null
          post_date?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_trip_id_fkey"
            columns: ["trip_id"]
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "share_links_trip_id_fkey"
            columns: ["trip_id"]
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      media: {
        Row: {
          id: string
          user_id: string
          trip_id: string | null
          post_id: string | null
          filename: string
          original_filename: string
          mime_type: string
          file_size: number
          width: number | null
          height: number | null
          url: string
          thumbnail_url: string | null
          alt_text: string | null
          caption: string | null
          location_data: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id?: string | null
          post_id?: string | null
          filename: string
          original_filename: string
          mime_type: string
          file_size: number
          width?: number | null
          height?: number | null
          url: string
          thumbnail_url?: string | null
          alt_text?: string | null
          caption?: string | null
          location_data?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trip_id?: string | null
          post_id?: string | null
          filename?: string
          original_filename?: string
          mime_type?: string
          file_size?: number
          width?: number | null
          height?: number | null
          url?: string
          thumbnail_url?: string | null
          alt_text?: string | null
          caption?: string | null
          location_data?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_trip_id_fkey"
            columns: ["trip_id"]
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
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
