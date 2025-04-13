export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFundingPage {
  id: string;
  user_id: string;
  project_name: string;
  description: string;
  bitcoin_address: string;
  lightning_address: string | null;
  transparency_score: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectTransaction {
  id: string;
  project_id: string;
  amount: number;
  type: 'incoming' | 'outgoing';
  status: 'confirmed' | 'pending';
  timestamp: string;
  created_at: string;
}

// Database types for Supabase
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
          username: string
          full_name: string | null
          avatar_url: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      funding_pages: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          bitcoin_address: string
          created_at: string
          updated_at: string
          is_verified: boolean
          verification_level: number
          is_public: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          bitcoin_address: string
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          verification_level?: number
          is_public?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          bitcoin_address?: string
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          verification_level?: number
          is_public?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          funding_page_id: string
          amount: number
          transaction_hash: string
          created_at: string
          status: 'pending' | 'confirmed' | 'failed'
        }
        Insert: {
          id?: string
          funding_page_id: string
          amount: number
          transaction_hash: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'failed'
        }
        Update: {
          id?: string
          funding_page_id?: string
          amount?: number
          transaction_hash?: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'failed'
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
  }
} 