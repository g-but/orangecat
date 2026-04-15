export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      actors: {
        Row: {
          actor_type: string
          created_at: string | null
          group_id: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actor_type: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actor_type?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistants: {
        Row: {
          actor_id: string | null
          api_provider: string | null
          avatar_url: string | null
          average_rating: number | null
          bitcoin_address: string | null
          category: string | null
          compute_provider_id: string | null
          compute_provider_type:
            | Database["public"]["Enums"]["compute_provider_type"]
            | null
          created_at: string | null
          description: string | null
          free_messages_per_day: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          knowledge_base_urls: string[] | null
          lightning_address: string | null
          max_tokens_per_response: number | null
          model_preference: string | null
          personality_traits: string[] | null
          price_per_1k_tokens: number | null
          price_per_message: number | null
          pricing_model: Database["public"]["Enums"]["ai_pricing_model"] | null
          published_at: string | null
          status: Database["public"]["Enums"]["ai_assistant_status"] | null
          subscription_price: number | null
          system_prompt: string
          tags: string[] | null
          temperature: number | null
          title: string
          total_conversations: number | null
          total_revenue: number | null
          total_withdrawn_btc: number | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          actor_id?: string | null
          api_provider?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bitcoin_address?: string | null
          category?: string | null
          compute_provider_id?: string | null
          compute_provider_type?:
            | Database["public"]["Enums"]["compute_provider_type"]
            | null
          created_at?: string | null
          description?: string | null
          free_messages_per_day?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_urls?: string[] | null
          lightning_address?: string | null
          max_tokens_per_response?: number | null
          model_preference?: string | null
          personality_traits?: string[] | null
          price_per_1k_tokens?: number | null
          price_per_message?: number | null
          pricing_model?: Database["public"]["Enums"]["ai_pricing_model"] | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["ai_assistant_status"] | null
          subscription_price?: number | null
          system_prompt: string
          tags?: string[] | null
          temperature?: number | null
          title: string
          total_conversations?: number | null
          total_revenue?: number | null
          total_withdrawn_btc?: number | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          actor_id?: string | null
          api_provider?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bitcoin_address?: string | null
          category?: string | null
          compute_provider_id?: string | null
          compute_provider_type?:
            | Database["public"]["Enums"]["compute_provider_type"]
            | null
          created_at?: string | null
          description?: string | null
          free_messages_per_day?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_urls?: string[] | null
          lightning_address?: string | null
          max_tokens_per_response?: number | null
          model_preference?: string | null
          personality_traits?: string[] | null
          price_per_1k_tokens?: number | null
          price_per_message?: number | null
          pricing_model?: Database["public"]["Enums"]["ai_pricing_model"] | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["ai_assistant_status"] | null
          subscription_price?: number | null
          system_prompt?: string
          tags?: string[] | null
          temperature?: number | null
          title?: string
          total_conversations?: number | null
          total_revenue?: number | null
          total_withdrawn_btc?: number | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistants_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_creator_earnings: {
        Row: {
          available_balance_btc: number | null
          created_at: string | null
          id: string
          pending_withdrawal_btc: number | null
          total_earned_btc: number | null
          total_withdrawn_btc: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance_btc?: number | null
          created_at?: string | null
          id?: string
          pending_withdrawal_btc?: number | null
          total_earned_btc?: number | null
          total_withdrawn_btc?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance_btc?: number | null
          created_at?: string | null
          id?: string
          pending_withdrawal_btc?: number | null
          total_earned_btc?: number | null
          total_withdrawn_btc?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_creator_withdrawals: {
        Row: {
          amount_btc: number
          created_at: string | null
          failure_reason: string | null
          fee_btc: number | null
          id: string
          lightning_address: string | null
          net_amount_btc: number | null
          payment_hash: string | null
          payment_preimage: string | null
          processed_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_btc: number
          created_at?: string | null
          failure_reason?: string | null
          fee_btc?: number | null
          id?: string
          lightning_address?: string | null
          net_amount_btc?: number | null
          payment_hash?: string | null
          payment_preimage?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_btc?: number
          created_at?: string | null
          failure_reason?: string | null
          fee_btc?: number | null
          id?: string
          lightning_address?: string | null
          net_amount_btc?: number | null
          payment_hash?: string | null
          payment_preimage?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          actor_id: string | null
          created_at: string
          currency: string
          deposit_amount_btc: number | null
          description: string | null
          documents: Json | null
          estimated_value: number | null
          id: string
          is_for_rent: boolean
          is_for_sale: boolean
          location: string | null
          max_rental_period: number | null
          min_rental_period: number
          owner_id: string
          public_visibility: boolean
          rental_period_type: string
          rental_price_btc: number | null
          requires_deposit: boolean
          sale_price_btc: number | null
          show_on_profile: boolean
          status: string
          title: string
          type: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          currency?: string
          deposit_amount_btc?: number | null
          description?: string | null
          documents?: Json | null
          estimated_value?: number | null
          id?: string
          is_for_rent?: boolean
          is_for_sale?: boolean
          location?: string | null
          max_rental_period?: number | null
          min_rental_period?: number
          owner_id: string
          public_visibility?: boolean
          rental_period_type?: string
          rental_price_btc?: number | null
          requires_deposit?: boolean
          sale_price_btc?: number | null
          show_on_profile?: boolean
          status?: string
          title: string
          type: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          currency?: string
          deposit_amount_btc?: number | null
          description?: string | null
          documents?: Json | null
          estimated_value?: number | null
          id?: string
          is_for_rent?: boolean
          is_for_sale?: boolean
          location?: string | null
          max_rental_period?: number | null
          min_rental_period?: number
          owner_id?: string
          public_visibility?: boolean
          rental_period_type?: string
          rental_price_btc?: number | null
          requires_deposit?: boolean
          sale_price_btc?: number | null
          show_on_profile?: boolean
          status?: string
          title?: string
          type?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_action_log: {
        Row: {
          action_id: string
          amount_btc: number | null
          category: Database["public"]["Enums"]["cat_action_category"]
          completed_at: string | null
          confirmed_at: string | null
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          parameters: Json
          requested_at: string
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["cat_action_status"]
          user_id: string
        }
        Insert: {
          action_id: string
          amount_btc?: number | null
          category: Database["public"]["Enums"]["cat_action_category"]
          completed_at?: string | null
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          parameters?: Json
          requested_at?: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cat_action_status"]
          user_id: string
        }
        Update: {
          action_id?: string
          amount_btc?: number | null
          category?: Database["public"]["Enums"]["cat_action_category"]
          completed_at?: string | null
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          parameters?: Json
          requested_at?: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cat_action_status"]
          user_id?: string
        }
        Relationships: []
      }
      cat_conversations: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model_used: string | null
          provider: string | null
          role: string
          token_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          model_used?: string | null
          provider?: string | null
          role: string
          token_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model_used?: string | null
          provider?: string | null
          role?: string
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "cat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_pending_actions: {
        Row: {
          action_id: string
          category: Database["public"]["Enums"]["cat_action_category"]
          confirmed_at: string | null
          conversation_id: string | null
          created_at: string
          description: string
          expires_at: string
          id: string
          message_id: string | null
          parameters: Json
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_id: string
          category: Database["public"]["Enums"]["cat_action_category"]
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          description: string
          expires_at?: string
          id?: string
          message_id?: string | null
          parameters?: Json
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action_id?: string
          category?: Database["public"]["Enums"]["cat_action_category"]
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          expires_at?: string
          id?: string
          message_id?: string | null
          parameters?: Json
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      cat_permissions: {
        Row: {
          action_id: string
          category: Database["public"]["Enums"]["cat_action_category"]
          created_at: string
          daily_limit: number | null
          granted: boolean
          id: string
          max_btc_per_action: number | null
          requires_confirmation: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          category: Database["public"]["Enums"]["cat_action_category"]
          created_at?: string
          daily_limit?: number | null
          granted?: boolean
          id?: string
          max_btc_per_action?: number | null
          requires_confirmation?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          category?: Database["public"]["Enums"]["cat_action_category"]
          created_at?: string
          daily_limit?: number | null
          granted?: boolean
          id?: string
          max_btc_per_action?: number | null
          requires_confirmation?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount_btc: number
          contributor_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_anonymous: boolean | null
          message: string | null
          payment_intent_id: string
        }
        Insert: {
          amount_btc: number
          contributor_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_intent_id: string
        }
        Update: {
          amount_btc?: number
          contributor_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_active: boolean
          joined_at: string
          last_read_at: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string | null
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          last_message_at: string
          last_message_preview: string | null
          last_message_sender_id: string | null
          professional_slug: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          professional_slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          conversation_type?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          professional_slug?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_wallets: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean | null
          wallet_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_primary?: boolean | null
          wallet_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_primary?: boolean | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_wallets_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          checked_in_at: string | null
          event_id: string
          id: string
          payment_status: string | null
          registered_at: string | null
          status: string | null
          ticket_count: number | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          event_id: string
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          status?: string | null
          ticket_count?: number | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          event_id?: string
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          status?: string | null
          ticket_count?: number | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_id: string | null
          asset_id: string | null
          banner_url: string | null
          bitcoin_address: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          current_attendees: number | null
          description: string | null
          end_date: string | null
          event_type: string | null
          funding_goal_btc: number | null
          id: string
          images: string[] | null
          is_all_day: boolean | null
          is_free: boolean | null
          is_online: boolean | null
          is_recurring: boolean | null
          latitude: number | null
          lightning_address: string | null
          longitude: number | null
          max_attendees: number | null
          online_url: string | null
          recurrence_pattern: Json | null
          requires_rsvp: boolean | null
          rsvp_deadline: string | null
          start_date: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          ticket_price_btc: number | null
          timezone: string | null
          title: string
          updated_at: string | null
          user_id: string
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_postal_code: string | null
          video_url: string | null
        }
        Insert: {
          actor_id?: string | null
          asset_id?: string | null
          banner_url?: string | null
          bitcoin_address?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          funding_goal_btc?: number | null
          id?: string
          images?: string[] | null
          is_all_day?: boolean | null
          is_free?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          latitude?: number | null
          lightning_address?: string | null
          longitude?: number | null
          max_attendees?: number | null
          online_url?: string | null
          recurrence_pattern?: Json | null
          requires_rsvp?: boolean | null
          rsvp_deadline?: string | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          ticket_price_btc?: number | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_postal_code?: string | null
          video_url?: string | null
        }
        Update: {
          actor_id?: string | null
          asset_id?: string | null
          banner_url?: string | null
          bitcoin_address?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          funding_goal_btc?: number | null
          id?: string
          images?: string[] | null
          is_all_day?: boolean | null
          is_free?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          latitude?: number | null
          lightning_address?: string | null
          longitude?: number | null
          max_attendees?: number | null
          online_url?: string | null
          recurrence_pattern?: Json | null
          requires_rsvp?: boolean | null
          rsvp_deadline?: string | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          ticket_price_btc?: number | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_postal_code?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "group_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_events: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          group_id: string
          id: string
          is_public: boolean | null
          location_details: string | null
          location_type: string | null
          max_attendees: number | null
          requires_rsvp: boolean | null
          starts_at: string
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          group_id: string
          id?: string
          is_public?: boolean | null
          location_details?: string | null
          location_type?: string | null
          max_attendees?: number | null
          requires_rsvp?: boolean | null
          starts_at: string
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          group_id?: string
          id?: string
          is_public?: boolean | null
          location_details?: string | null
          location_type?: string | null
          max_attendees?: number | null
          requires_rsvp?: boolean | null
          starts_at?: string
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_features: {
        Row: {
          config: Json | null
          enabled: boolean | null
          enabled_at: string | null
          enabled_by: string | null
          feature_key: string
          group_id: string
          id: string
        }
        Insert: {
          config?: Json | null
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key: string
          group_id: string
          id?: string
        }
        Update: {
          config?: Json | null
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_features_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permission_overrides: Json | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permission_overrides?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permission_overrides?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_proposals: {
        Row: {
          action_data: Json | null
          action_type: string | null
          created_at: string | null
          description: string | null
          executed_at: string | null
          group_id: string
          id: string
          proposal_type: string
          proposer_id: string
          status: string
          title: string
          updated_at: string | null
          voting_ends_at: string | null
          voting_starts_at: string | null
          voting_threshold: number | null
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          executed_at?: string | null
          group_id: string
          id?: string
          proposal_type?: string
          proposer_id: string
          status?: string
          title: string
          updated_at?: string | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
          voting_threshold?: number | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          executed_at?: string | null
          group_id?: string
          id?: string
          proposal_type?: string
          proposer_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          voting_ends_at?: string | null
          voting_starts_at?: string | null
          voting_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_proposals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_votes: {
        Row: {
          id: string
          proposal_id: string
          vote: string
          voted_at: string | null
          voter_id: string
          voting_power: number | null
        }
        Insert: {
          id?: string
          proposal_id: string
          vote: string
          voted_at?: string | null
          voter_id: string
          voting_power?: number | null
        }
        Update: {
          id?: string
          proposal_id?: string
          vote?: string
          voted_at?: string | null
          voter_id?: string
          voting_power?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "group_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      group_wallets: {
        Row: {
          bitcoin_address: string | null
          created_at: string | null
          created_by: string | null
          current_balance_btc: number | null
          description: string | null
          group_id: string
          id: string
          is_active: boolean | null
          lightning_address: string | null
          name: string
          purpose: string | null
          required_signatures: number | null
          updated_at: string | null
        }
        Insert: {
          bitcoin_address?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance_btc?: number | null
          description?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          lightning_address?: string | null
          name: string
          purpose?: string | null
          required_signatures?: number | null
          updated_at?: string | null
        }
        Update: {
          bitcoin_address?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance_btc?: number | null
          description?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          lightning_address?: string | null
          name?: string
          purpose?: string | null
          required_signatures?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_wallets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bitcoin_address: string | null
          created_at: string | null
          created_by: string
          description: string | null
          governance_preset: string | null
          id: string
          is_public: boolean | null
          label: string
          lightning_address: string | null
          name: string
          slug: string
          tags: string[] | null
          updated_at: string | null
          visibility: string | null
          voting_threshold: number | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bitcoin_address?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          governance_preset?: string | null
          id?: string
          is_public?: boolean | null
          label?: string
          lightning_address?: string | null
          name: string
          slug: string
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
          voting_threshold?: number | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bitcoin_address?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          governance_preset?: string | null
          id?: string
          is_public?: boolean | null
          label?: string
          lightning_address?: string | null
          name?: string
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
          voting_threshold?: number | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          actor_id: string
          bitcoin_address: string | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          expected_return_rate: number | null
          id: string
          investment_type: string
          is_public: boolean
          lightning_address: string | null
          maximum_investment: number | null
          minimum_investment: number
          return_frequency: string | null
          risk_level: string | null
          show_on_profile: boolean | null
          start_date: string | null
          status: string
          target_amount: number
          term_months: number | null
          terms: string | null
          thumbnail_url: string | null
          title: string
          total_raised: number
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          actor_id: string
          bitcoin_address?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          expected_return_rate?: number | null
          id?: string
          investment_type?: string
          is_public?: boolean
          lightning_address?: string | null
          maximum_investment?: number | null
          minimum_investment?: number
          return_frequency?: string | null
          risk_level?: string | null
          show_on_profile?: boolean | null
          start_date?: string | null
          status?: string
          target_amount: number
          term_months?: number | null
          terms?: string | null
          thumbnail_url?: string | null
          title: string
          total_raised?: number
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          actor_id?: string
          bitcoin_address?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          expected_return_rate?: number | null
          id?: string
          investment_type?: string
          is_public?: boolean
          lightning_address?: string | null
          maximum_investment?: number | null
          minimum_investment?: number
          return_frequency?: string | null
          risk_level?: string | null
          show_on_profile?: boolean | null
          start_date?: string | null
          status?: string
          target_amount?: number
          term_months?: number | null
          terms?: string | null
          thumbnail_url?: string | null
          title?: string
          total_raised?: number
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_offers: {
        Row: {
          accepted_at: string | null
          conditions: string | null
          created_at: string
          expires_at: string | null
          id: string
          interest_rate: number | null
          is_binding: boolean | null
          loan_id: string
          monthly_payment: number | null
          offer_amount: number
          offer_type: string
          offerer_id: string
          rejected_at: string | null
          status: string | null
          term_months: number | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          conditions?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          is_binding?: boolean | null
          loan_id: string
          monthly_payment?: number | null
          offer_amount: number
          offer_type: string
          offerer_id: string
          rejected_at?: string | null
          status?: string | null
          term_months?: number | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          conditions?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          is_binding?: boolean | null
          loan_id?: string
          monthly_payment?: number | null
          offer_amount?: number
          offer_type?: string
          offerer_id?: string
          rejected_at?: string | null
          status?: string | null
          term_months?: number | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_offers_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_offers_offerer_id_fkey"
            columns: ["offerer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          loan_id: string
          notes: string | null
          offer_id: string | null
          payer_id: string
          payment_method: string | null
          payment_type: string
          processed_at: string | null
          recipient_id: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          offer_id?: string | null
          payer_id: string
          payment_method?: string | null
          payment_type: string
          processed_at?: string | null
          recipient_id: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          offer_id?: string | null
          payer_id?: string
          payment_method?: string | null
          payment_type?: string
          processed_at?: string | null
          recipient_id?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "loan_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          actor_id: string | null
          amount: number
          bitcoin_address: string | null
          contact_method: string | null
          created_at: string
          currency: string | null
          current_interest_rate: number | null
          current_lender: string | null
          description: string | null
          desired_rate: number | null
          fulfillment_type: string | null
          id: string
          interest_rate: number | null
          is_negotiable: boolean | null
          is_public: boolean | null
          lender_name: string | null
          lightning_address: string | null
          loan_category_id: string | null
          loan_number: string | null
          loan_type: string | null
          maturity_date: string | null
          minimum_offer_amount: number | null
          monthly_payment: number | null
          original_amount: number
          origination_date: string | null
          paid_off_at: string | null
          preferred_terms: string | null
          remaining_balance: number
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          amount?: number
          bitcoin_address?: string | null
          contact_method?: string | null
          created_at?: string
          currency?: string | null
          current_interest_rate?: number | null
          current_lender?: string | null
          description?: string | null
          desired_rate?: number | null
          fulfillment_type?: string | null
          id?: string
          interest_rate?: number | null
          is_negotiable?: boolean | null
          is_public?: boolean | null
          lender_name?: string | null
          lightning_address?: string | null
          loan_category_id?: string | null
          loan_number?: string | null
          loan_type?: string | null
          maturity_date?: string | null
          minimum_offer_amount?: number | null
          monthly_payment?: number | null
          original_amount: number
          origination_date?: string | null
          paid_off_at?: string | null
          preferred_terms?: string | null
          remaining_balance: number
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          amount?: number
          bitcoin_address?: string | null
          contact_method?: string | null
          created_at?: string
          currency?: string | null
          current_interest_rate?: number | null
          current_lender?: string | null
          description?: string | null
          desired_rate?: number | null
          fulfillment_type?: string | null
          id?: string
          interest_rate?: number | null
          is_negotiable?: boolean | null
          is_public?: boolean | null
          lender_name?: string | null
          lightning_address?: string | null
          loan_category_id?: string | null
          loan_number?: string | null
          loan_type?: string | null
          maturity_date?: string | null
          minimum_offer_amount?: number | null
          monthly_payment?: number | null
          original_amount?: number
          origination_date?: string | null
          paid_off_at?: string | null
          preferred_terms?: string | null
          remaining_balance?: number
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_category_id_fkey"
            columns: ["loan_category_id"]
            isOneToOne: false
            referencedRelation: "loan_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          message_type: string
          metadata: Json | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_btc: number
          buyer_id: string
          buyer_note: string | null
          created_at: string | null
          entity_id: string
          entity_title: string
          entity_type: string
          id: string
          payment_intent_id: string
          seller_id: string
          seller_note: string | null
          shipping_address_id: string | null
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount_btc: number
          buyer_id: string
          buyer_note?: string | null
          created_at?: string | null
          entity_id: string
          entity_title: string
          entity_type: string
          id?: string
          payment_intent_id: string
          seller_id: string
          seller_note?: string | null
          shipping_address_id?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_btc?: number
          buyer_id?: string
          buyer_note?: string | null
          created_at?: string | null
          entity_id?: string
          entity_title?: string
          entity_type?: string
          id?: string
          payment_intent_id?: string
          seller_id?: string
          seller_note?: string | null
          shipping_address_id?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_btc: number
          bolt11: string | null
          buyer_id: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          onchain_address: string | null
          paid_at: string | null
          payment_hash: string | null
          payment_method: string
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_btc: number
          bolt11?: string | null
          buyer_id: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          onchain_address?: string | null
          paid_at?: string | null
          payment_hash?: string | null
          payment_method: string
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_btc?: number
          bolt11?: string | null
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          onchain_address?: string | null
          paid_at?: string | null
          payment_hash?: string | null
          payment_method?: string
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      post_visibility: {
        Row: {
          added_at: string
          added_by_id: string
          created_at: string
          id: string
          post_id: string
          timeline_owner_id: string | null
          timeline_type: string
        }
        Insert: {
          added_at?: string
          added_by_id: string
          created_at?: string
          id?: string
          post_id: string
          timeline_owner_id?: string | null
          timeline_type: string
        }
        Update: {
          added_at?: string
          added_by_id?: string
          created_at?: string
          id?: string
          post_id?: string
          timeline_owner_id?: string | null
          timeline_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_visibility_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_visibility_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_visibility_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          bitcoin_address: string | null
          bitcoin_public_key: string | null
          contact_email: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          language: string | null
          last_active_at: string | null
          last_login_at: string | null
          latitude: number | null
          lightning_address: string | null
          lightning_node_id: string | null
          location: string | null
          location_city: string | null
          location_country: string | null
          location_search: string | null
          location_zip: string | null
          longitude: number | null
          metadata: Json | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_first_project_created: boolean | null
          onboarding_method: string | null
          onboarding_wallet_setup_completed: boolean | null
          payment_preferences: Json | null
          phone: string | null
          preferences: Json | null
          privacy_policy_accepted_at: string | null
          privacy_settings: Json | null
          profile_completed_at: string | null
          social_links: Json | null
          status: string | null
          terms_accepted_at: string | null
          timezone: string | null
          updated_at: string
          username: string
          verification_data: Json | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bitcoin_address?: string | null
          bitcoin_public_key?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          latitude?: number | null
          lightning_address?: string | null
          lightning_node_id?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_search?: string | null
          location_zip?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_first_project_created?: boolean | null
          onboarding_method?: string | null
          onboarding_wallet_setup_completed?: boolean | null
          payment_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
          privacy_policy_accepted_at?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          social_links?: Json | null
          status?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          updated_at?: string
          username: string
          verification_data?: Json | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bitcoin_address?: string | null
          bitcoin_public_key?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          latitude?: number | null
          lightning_address?: string | null
          lightning_node_id?: string | null
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          location_search?: string | null
          location_zip?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_first_project_created?: boolean | null
          onboarding_method?: string | null
          onboarding_wallet_setup_completed?: boolean | null
          payment_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
          privacy_policy_accepted_at?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          social_links?: Json | null
          status?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string
          verification_data?: Json | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_favorites: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          project_id: string
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id: string
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actor_id: string | null
          bitcoin_address: string | null
          category: string | null
          contributor_count: number | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          funding_purpose: string | null
          goal_amount: number | null
          group_id: string | null
          id: string
          lightning_address: string | null
          raised_amount: number | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          actor_id?: string | null
          bitcoin_address?: string | null
          category?: string | null
          contributor_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          funding_purpose?: string | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          lightning_address?: string | null
          raised_amount?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          actor_id?: string | null
          bitcoin_address?: string | null
          category?: string | null
          contributor_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          funding_purpose?: string | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          lightning_address?: string | null
          raised_amount?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      research_entities: {
        Row: {
          actor_id: string | null
          contributions: Json | null
          created_at: string | null
          current_milestone: string | null
          description: string
          expected_outcome: string
          field: string
          funding_goal_btc: number
          funding_model: string
          funding_raised_btc: number | null
          id: string
          impact_areas: Json | null
          is_featured: boolean | null
          is_public: boolean | null
          lead_researcher: string
          metadata: Json | null
          methodology: string
          next_deadline: string | null
          open_collaboration: boolean | null
          progress_frequency: string
          progress_updates: Json | null
          resource_needs: Json | null
          sdg_alignment: Json | null
          search_vector: unknown
          status: string | null
          target_audience: string[] | null
          team_members: Json | null
          timeline: string
          title: string
          transparency_level: string
          updated_at: string | null
          user_id: string
          voting_enabled: boolean | null
          wallet_address: string
        }
        Insert: {
          actor_id?: string | null
          contributions?: Json | null
          created_at?: string | null
          current_milestone?: string | null
          description: string
          expected_outcome: string
          field: string
          funding_goal_btc: number
          funding_model: string
          funding_raised_btc?: number | null
          id?: string
          impact_areas?: Json | null
          is_featured?: boolean | null
          is_public?: boolean | null
          lead_researcher: string
          metadata?: Json | null
          methodology: string
          next_deadline?: string | null
          open_collaboration?: boolean | null
          progress_frequency: string
          progress_updates?: Json | null
          resource_needs?: Json | null
          sdg_alignment?: Json | null
          search_vector?: unknown
          status?: string | null
          target_audience?: string[] | null
          team_members?: Json | null
          timeline: string
          title: string
          transparency_level: string
          updated_at?: string | null
          user_id: string
          voting_enabled?: boolean | null
          wallet_address: string
        }
        Update: {
          actor_id?: string | null
          contributions?: Json | null
          created_at?: string | null
          current_milestone?: string | null
          description?: string
          expected_outcome?: string
          field?: string
          funding_goal_btc?: number
          funding_model?: string
          funding_raised_btc?: number | null
          id?: string
          impact_areas?: Json | null
          is_featured?: boolean | null
          is_public?: boolean | null
          lead_researcher?: string
          metadata?: Json | null
          methodology?: string
          next_deadline?: string | null
          open_collaboration?: boolean | null
          progress_frequency?: string
          progress_updates?: Json | null
          resource_needs?: Json | null
          sdg_alignment?: Json | null
          search_vector?: unknown
          status?: string | null
          target_audience?: string[] | null
          team_members?: Json | null
          timeline?: string
          title?: string
          transparency_level?: string
          updated_at?: string | null
          user_id?: string
          voting_enabled?: boolean | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_entities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_entities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          city: string
          country_code: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          postal_code: string
          state: string | null
          street: string
          street2: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country_code?: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          postal_code: string
          state?: string | null
          street: string
          street2?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          postal_code?: string
          state?: string | null
          street?: string
          street2?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_attention_flags: {
        Row: {
          created_at: string | null
          flagged_by: string
          id: string
          is_resolved: boolean | null
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_by_completion_id: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          flagged_by: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_completion_id?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          flagged_by?: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_completion_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attention_flags_resolved_by_completion_id_fkey"
            columns: ["resolved_by_completion_id"]
            isOneToOne: false
            referencedRelation: "task_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attention_flags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string | null
          completed_by: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          task_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          task_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_projects: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      task_requests: {
        Row: {
          completion_id: string | null
          created_at: string | null
          id: string
          is_broadcast: boolean | null
          message: string | null
          requested_by: string
          requested_user_id: string | null
          responded_by: string | null
          response_message: string | null
          status: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          completion_id?: string | null
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          message?: string | null
          requested_by: string
          requested_user_id?: string | null
          responded_by?: string | null
          response_message?: string | null
          status?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          completion_id?: string | null
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          message?: string | null
          requested_by?: string
          requested_user_id?: string | null
          responded_by?: string | null
          response_message?: string | null
          status?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_requests_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: false
            referencedRelation: "task_completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string
          current_status: string
          description: string | null
          estimated_minutes: number | null
          id: string
          instructions: string | null
          is_archived: boolean | null
          is_completed: boolean | null
          priority: string
          project_id: string | null
          schedule_cron: string | null
          schedule_human: string | null
          tags: string[] | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by: string
          current_status?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          instructions?: string | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          priority?: string
          project_id?: string | null
          schedule_cron?: string | null
          schedule_human?: string | null
          tags?: string[] | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string
          current_status?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          instructions?: string | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          priority?: string
          project_id?: string | null
          schedule_cron?: string | null
          schedule_human?: string | null
          tags?: string[] | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_comments: {
        Row: {
          content: string
          content_html: string | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          event_id: string
          id: string
          is_deleted: boolean | null
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          event_id: string
          id?: string
          is_deleted?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          event_id?: string
          id?: string
          is_deleted?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "timeline_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_dislikes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_dislikes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dislikes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dislikes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_dislikes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_event_stats: {
        Row: {
          comment_count: number | null
          dislike_count: number | null
          event_id: string
          like_count: number | null
          share_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          comment_count?: number | null
          dislike_count?: number | null
          event_id: string
          like_count?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          comment_count?: number | null
          dislike_count?: number | null
          event_id?: string
          like_count?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_event_visibility: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          timeline_owner_id: string | null
          timeline_type: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          timeline_owner_id?: string | null
          timeline_type: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          timeline_owner_id?: string | null
          timeline_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          amount_btc: number | null
          content: Json | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          description: string | null
          device_info: Json | null
          event_subtype: string | null
          event_timestamp: string
          event_type: string
          id: string
          is_cross_post_duplicate: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_quote_reply: boolean | null
          location_data: Json | null
          metadata: Json | null
          parent_event_id: string | null
          quantity: number | null
          subject_id: string | null
          subject_type: string
          tags: string[] | null
          target_id: string | null
          target_type: string | null
          thread_depth: number | null
          thread_id: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          amount_btc?: number | null
          content?: Json | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          device_info?: Json | null
          event_subtype?: string | null
          event_timestamp?: string
          event_type: string
          id?: string
          is_cross_post_duplicate?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_quote_reply?: boolean | null
          location_data?: Json | null
          metadata?: Json | null
          parent_event_id?: string | null
          quantity?: number | null
          subject_id?: string | null
          subject_type: string
          tags?: string[] | null
          target_id?: string | null
          target_type?: string | null
          thread_depth?: number | null
          thread_id?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          amount_btc?: number | null
          content?: Json | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          description?: string | null
          device_info?: Json | null
          event_subtype?: string | null
          event_timestamp?: string
          event_type?: string
          id?: string
          is_cross_post_duplicate?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_quote_reply?: boolean | null
          location_data?: Json | null
          metadata?: Json | null
          parent_event_id?: string | null
          quantity?: number | null
          subject_id?: string | null
          subject_type?: string
          tags?: string[] | null
          target_id?: string | null
          target_type?: string | null
          thread_depth?: number | null
          thread_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_interactions: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_likes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_shares: {
        Row: {
          created_at: string
          id: string
          original_event_id: string
          share_text: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          original_event_id: string
          share_text?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          original_event_id?: string
          share_text?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_shares_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_shares_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_shares_original_event_id_fkey"
            columns: ["original_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          amount_btc: number | null
          created_at: string
          funding_page_id: string
          id: string
          status: string
          transaction_hash: string
        }
        Insert: {
          amount: number
          amount_btc?: number | null
          created_at?: string
          funding_page_id: string
          id?: string
          status: string
          transaction_hash: string
        }
        Update: {
          amount?: number
          amount_btc?: number | null
          created_at?: string
          funding_page_id?: string
          id?: string
          status?: string
          transaction_hash?: string
        }
        Relationships: []
      }
      transparency_scores: {
        Row: {
          audit_notes: string | null
          calculation_date: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          score: number
          updated_at: string
        }
        Insert: {
          audit_notes?: string | null
          calculation_date?: string
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          score: number
          updated_at?: string
        }
        Update: {
          audit_notes?: string | null
          calculation_date?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          auto_router_enabled: boolean | null
          cached_total_cost_btc: number | null
          cached_total_requests: number | null
          cached_total_tokens: number | null
          created_at: string | null
          default_model_id: string | null
          default_tier: string | null
          id: string
          max_cost_btc: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          require_function_calling: boolean | null
          require_vision: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_router_enabled?: boolean | null
          cached_total_cost_btc?: number | null
          cached_total_requests?: number | null
          cached_total_tokens?: number | null
          created_at?: string | null
          default_model_id?: string | null
          default_tier?: string | null
          id?: string
          max_cost_btc?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          require_function_calling?: boolean | null
          require_vision?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_router_enabled?: boolean | null
          cached_total_cost_btc?: number | null
          cached_total_requests?: number | null
          cached_total_tokens?: number | null
          created_at?: string | null
          default_model_id?: string | null
          default_tier?: string | null
          id?: string
          max_cost_btc?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          require_function_calling?: boolean | null
          require_vision?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_causes: {
        Row: {
          actor_id: string | null
          beneficiaries: Json | null
          bitcoin_address: string | null
          cause_category: string
          created_at: string | null
          currency: string | null
          description: string | null
          distribution_rules: Json | null
          goal_amount: number | null
          id: string
          lightning_address: string | null
          status: string | null
          title: string
          total_distributed: number | null
          total_raised: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          beneficiaries?: Json | null
          bitcoin_address?: string | null
          cause_category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          distribution_rules?: Json | null
          goal_amount?: number | null
          id?: string
          lightning_address?: string | null
          status?: string | null
          title: string
          total_distributed?: number | null
          total_raised?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          beneficiaries?: Json | null
          bitcoin_address?: string | null
          cause_category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          distribution_rules?: Json | null
          goal_amount?: number | null
          id?: string
          lightning_address?: string | null
          status?: string | null
          title?: string
          total_distributed?: number | null
          total_raised?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_causes_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          actor_id: string
          content: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          actor_id: string
          content?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          actor_id?: string
          content?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          actor_id: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          fulfillment_type: string | null
          group_id: string | null
          id: string
          images: string[] | null
          inventory_count: number | null
          is_featured: boolean | null
          price: number
          product_type: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fulfillment_type?: string | null
          group_id?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_featured?: boolean | null
          price: number
          product_type?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fulfillment_type?: string | null
          group_id?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_featured?: boolean | null
          price?: number
          product_type?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_products_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_services: {
        Row: {
          actor_id: string | null
          availability_schedule: Json | null
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          duration_minutes: number | null
          fixed_price: number | null
          group_id: string | null
          hourly_rate: number | null
          id: string
          images: string[] | null
          portfolio_links: string[] | null
          service_area: string | null
          service_location_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          availability_schedule?: Json | null
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          fixed_price?: number | null
          group_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          portfolio_links?: string[] | null
          service_area?: string | null
          service_location_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          availability_schedule?: Json | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          fixed_price?: number | null
          group_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          portfolio_links?: string[] | null
          service_area?: string | null
          service_location_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_services_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          address_or_xpub: string
          balance_btc: number
          balance_updated_at: string | null
          behavior_type: string
          budget_amount: number | null
          budget_period: string | null
          category: string
          category_icon: string
          created_at: string
          description: string | null
          display_order: number
          goal_amount: number | null
          goal_currency: string | null
          goal_deadline: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          label: string
          lightning_address: string | null
          nwc_connection_uri: string | null
          profile_id: string | null
          project_id: string | null
          updated_at: string
          user_id: string | null
          wallet_type: string
        }
        Insert: {
          address_or_xpub: string
          balance_btc?: number
          balance_updated_at?: string | null
          behavior_type?: string
          budget_amount?: number | null
          budget_period?: string | null
          category?: string
          category_icon?: string
          created_at?: string
          description?: string | null
          display_order?: number
          goal_amount?: number | null
          goal_currency?: string | null
          goal_deadline?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label: string
          lightning_address?: string | null
          nwc_connection_uri?: string | null
          profile_id?: string | null
          project_id?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_type?: string
        }
        Update: {
          address_or_xpub?: string
          balance_btc?: number
          balance_updated_at?: string | null
          behavior_type?: string
          budget_amount?: number | null
          budget_period?: string | null
          category?: string
          category_icon?: string
          created_at?: string
          description?: string | null
          display_order?: number
          goal_amount?: number | null
          goal_currency?: string | null
          goal_deadline?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label?: string
          lightning_address?: string | null
          nwc_connection_uri?: string | null
          profile_id?: string | null
          project_id?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_contributions: {
        Row: {
          amount_btc: number
          contributor_actor_id: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          paid_at: string | null
          payment_hash: string | null
          payment_status: string | null
          wishlist_item_id: string
        }
        Insert: {
          amount_btc: number
          contributor_actor_id?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          paid_at?: string | null
          payment_hash?: string | null
          payment_status?: string | null
          wishlist_item_id: string
        }
        Update: {
          amount_btc?: number
          contributor_actor_id?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          paid_at?: string | null
          payment_hash?: string | null
          payment_status?: string | null
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_contributions_contributor_actor_id_fkey"
            columns: ["contributor_actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_contributions_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_item_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_contributions_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_feedback: {
        Row: {
          actor_id: string
          comment: string | null
          created_at: string | null
          feedback_type: string
          fulfillment_proof_id: string | null
          id: string
          wishlist_item_id: string
        }
        Insert: {
          actor_id: string
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          fulfillment_proof_id?: string | null
          id?: string
          wishlist_item_id: string
        }
        Update: {
          actor_id?: string
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          fulfillment_proof_id?: string | null
          id?: string
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_feedback_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_feedback_fulfillment_proof_id_fkey"
            columns: ["fulfillment_proof_id"]
            isOneToOne: false
            referencedRelation: "wishlist_fulfillment_proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_feedback_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_item_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_feedback_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_fulfillment_proofs: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_verified: boolean | null
          proof_type: string
          transaction_id: string | null
          wishlist_item_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          proof_type: string
          transaction_id?: string | null
          wishlist_item_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          proof_type?: string
          transaction_id?: string | null
          wishlist_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_fulfillment_proofs_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_item_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_fulfillment_proofs_wishlist_item_id_fkey"
            columns: ["wishlist_item_id"]
            isOneToOne: false
            referencedRelation: "wishlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          allow_partial_funding: boolean | null
          created_at: string | null
          currency: string | null
          dedicated_wallet_address: string | null
          description: string | null
          external_source: string | null
          external_url: string | null
          funded_amount_btc: number | null
          id: string
          image_url: string | null
          is_fulfilled: boolean | null
          is_fully_funded: boolean | null
          original_amount: number | null
          priority: number | null
          product_id: string | null
          quantity_received: number | null
          quantity_wanted: number | null
          service_id: string | null
          target_amount_btc: number
          title: string
          updated_at: string | null
          use_dedicated_wallet: boolean | null
          wishlist_id: string
        }
        Insert: {
          allow_partial_funding?: boolean | null
          created_at?: string | null
          currency?: string | null
          dedicated_wallet_address?: string | null
          description?: string | null
          external_source?: string | null
          external_url?: string | null
          funded_amount_btc?: number | null
          id?: string
          image_url?: string | null
          is_fulfilled?: boolean | null
          is_fully_funded?: boolean | null
          original_amount?: number | null
          priority?: number | null
          product_id?: string | null
          quantity_received?: number | null
          quantity_wanted?: number | null
          service_id?: string | null
          target_amount_btc: number
          title: string
          updated_at?: string | null
          use_dedicated_wallet?: boolean | null
          wishlist_id: string
        }
        Update: {
          allow_partial_funding?: boolean | null
          created_at?: string | null
          currency?: string | null
          dedicated_wallet_address?: string | null
          description?: string | null
          external_source?: string | null
          external_url?: string | null
          funded_amount_btc?: number | null
          id?: string
          image_url?: string | null
          is_fulfilled?: boolean | null
          is_fully_funded?: boolean | null
          original_amount?: number | null
          priority?: number | null
          product_id?: string | null
          quantity_received?: number | null
          quantity_wanted?: number | null
          service_id?: string | null
          target_amount_btc?: number
          title?: string
          updated_at?: string | null
          use_dedicated_wallet?: boolean | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "user_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          actor_id: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          is_active: boolean | null
          title: string
          type: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          actor_id: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          actor_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      community_timeline_no_duplicates: {
        Row: {
          actor_data: Json | null
          actor_id: string | null
          comment_count: number | null
          created_at: string | null
          description: string | null
          event_timestamp: string | null
          event_type: string | null
          id: string | null
          like_count: number | null
          metadata: Json | null
          share_count: number | null
          subject_data: Json | null
          subject_id: string | null
          subject_type: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_details: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          is_group: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          participants: Json | null
          title: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          participants?: never
          title?: string | null
          unread_count?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          participants?: never
          title?: string | null
          unread_count?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enriched_timeline_events: {
        Row: {
          actor_data: Json | null
          actor_id: string | null
          actor_type: string | null
          amount_btc: number | null
          comment_count: number | null
          content: Json | null
          created_at: string | null
          description: string | null
          event_subtype: string | null
          event_timestamp: string | null
          event_type: string | null
          id: string | null
          is_deleted: boolean | null
          is_featured: boolean | null
          like_count: number | null
          metadata: Json | null
          parent_event_id: string | null
          quantity: number | null
          share_count: number | null
          subject_data: Json | null
          subject_id: string | null
          subject_type: string | null
          tags: string[] | null
          target_data: Json | null
          target_id: string | null
          target_type: string | null
          thread_id: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_timeline_no_duplicates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "enriched_timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_details: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          edited_at: string | null
          id: string | null
          is_deleted: boolean | null
          is_read: boolean | null
          message_type: string | null
          metadata: Json | null
          sender: Json | null
          sender_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_item_with_stats: {
        Row: {
          allow_partial_funding: boolean | null
          contribution_count: number | null
          contributor_count: number | null
          created_at: string | null
          currency: string | null
          dedicated_wallet_address: string | null
          description: string | null
          dislike_count: number | null
          external_source: string | null
          external_url: string | null
          funded_amount_btc: number | null
          id: string | null
          image_url: string | null
          is_fulfilled: boolean | null
          is_fully_funded: boolean | null
          like_count: number | null
          original_amount: number | null
          priority: number | null
          product_id: string | null
          quantity_received: number | null
          quantity_wanted: number | null
          service_id: string | null
          target_amount_btc: number | null
          title: string | null
          updated_at: string | null
          use_dedicated_wallet: boolean | null
          wishlist_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "user_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_with_stats: {
        Row: {
          actor_id: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          fulfilled_item_count: number | null
          funded_item_count: number | null
          id: string | null
          is_active: boolean | null
          item_count: number | null
          title: string | null
          total_funded_btc: number | null
          total_target_btc: number | null
          type: string | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_timeline_comment: {
        Args: {
          p_content: string
          p_event_id: string
          p_parent_comment_id?: string
          p_user_id: string
        }
        Returns: {
          comment_count: number
          comment_id: string
        }[]
      }
      cancel_ai_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: undefined
      }
      check_cat_permission: {
        Args: { p_action_id: string; p_user_id: string }
        Returns: boolean
      }
      complete_ai_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: undefined
      }
      create_direct_conversation: {
        Args: { participant1_id: string; participant2_id: string }
        Returns: string
      }
      create_group_conversation: {
        Args: {
          p_created_by: string
          p_participant_ids: string[]
          p_title?: string
        }
        Returns: string
      }
      create_loan_offer: {
        Args: {
          p_interest_rate?: number
          p_loan_id: string
          p_offer_amount: number
          p_offer_type: string
          p_offerer_id: string
          p_term_months?: number
          p_terms?: string
        }
        Returns: Json
      }
      create_post_with_visibility: {
        Args: {
          p_actor_id: string
          p_description?: string
          p_event_type: string
          p_metadata?: Json
          p_subject_id?: string
          p_subject_type?: string
          p_timeline_contexts?: Json
          p_title?: string
          p_visibility?: string
        }
        Returns: Json
      }
      create_quote_reply: {
        Args: {
          p_actor_id: string
          p_content: string
          p_parent_event_id: string
          p_quoted_content: string
          p_visibility?: string
        }
        Returns: string
      }
      create_task_broadcast_notification: {
        Args: {
          p_exclude_user_id: string
          p_message?: string
          p_task_id?: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      create_task_notification: {
        Args: {
          p_message?: string
          p_recipient_user_id: string
          p_source_user_id?: string
          p_task_id?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      delete_timeline_comment: {
        Args: { p_comment_id: string; p_user_id: string }
        Returns: boolean
      }
      dislike_timeline_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          dislike_count: number
        }[]
      }
      expire_cat_pending_actions: { Args: never; Returns: undefined }
      fail_ai_withdrawal: {
        Args: { p_reason?: string; p_withdrawal_id: string }
        Returns: undefined
      }
      get_available_loans: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          actor_id: string | null
          amount: number
          bitcoin_address: string | null
          contact_method: string | null
          created_at: string
          currency: string | null
          current_interest_rate: number | null
          current_lender: string | null
          description: string | null
          desired_rate: number | null
          fulfillment_type: string | null
          id: string
          interest_rate: number | null
          is_negotiable: boolean | null
          is_public: boolean | null
          lender_name: string | null
          lightning_address: string | null
          loan_category_id: string | null
          loan_number: string | null
          loan_type: string | null
          maturity_date: string | null
          minimum_offer_amount: number | null
          monthly_payment: number | null
          original_amount: number
          origination_date: string | null
          paid_off_at: string | null
          preferred_terms: string | null
          remaining_balance: number
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "loans"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_cat_action_daily_usage: {
        Args: { p_action_id: string; p_user_id: string }
        Returns: number
      }
      get_comment_replies: {
        Args: { p_comment_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          content: string
          created_at: string
          event_id: string
          id: string
          parent_comment_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_comment_reply_count: { Args: { comment_id: string }; Returns: number }
      get_event_comment_count: { Args: { event_id: string }; Returns: number }
      get_event_comments: {
        Args: { p_event_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          content: string
          created_at: string
          event_id: string
          id: string
          parent_comment_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_event_dislike_count: { Args: { event_id: string }; Returns: number }
      get_event_like_count: { Args: { event_id: string }; Returns: number }
      get_event_share_count: { Args: { event_id: string }; Returns: number }
      get_group_member_count: { Args: { group_uuid: string }; Returns: number }
      get_group_role: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: string
      }
      get_or_create_user_ai_preferences: {
        Args: { p_user_id: string }
        Returns: {
          auto_router_enabled: boolean | null
          cached_total_cost_btc: number | null
          cached_total_requests: number | null
          cached_total_tokens: number | null
          created_at: string | null
          default_model_id: string | null
          default_tier: string | null
          id: string
          max_cost_btc: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          require_function_calling: boolean | null
          require_vision: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_ai_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_thread_posts: {
        Args: { p_limit?: number; p_offset?: number; p_thread_id: string }
        Returns: {
          actor_id: string | null
          actor_type: string | null
          amount_btc: number | null
          content: Json | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          description: string | null
          device_info: Json | null
          event_subtype: string | null
          event_timestamp: string
          event_type: string
          id: string
          is_cross_post_duplicate: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_quote_reply: boolean | null
          location_data: Json | null
          metadata: Json | null
          parent_event_id: string | null
          quantity: number | null
          subject_id: string | null
          subject_type: string
          tags: string[] | null
          target_id: string | null
          target_type: string | null
          thread_depth: number | null
          thread_id: string | null
          title: string
          updated_at: string
          visibility: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "timeline_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_total_unread_count: { Args: { p_user_id: string }; Returns: number }
      get_unread_counts: {
        Args: { p_user_id: string }
        Returns: {
          conversation_id: string
          unread_count: number
        }[]
      }
      get_user_conversations: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          last_message_at: string
          last_message_preview: string
          last_message_sender_id: string
          participants: Json
          title: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_user_group_role: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: string
      }
      get_user_groups: {
        Args: { user_uuid: string }
        Returns: {
          group_id: string
          group_name: string
          group_slug: string
          joined_at: string
          label: string
          role: string
        }[]
      }
      get_user_loans: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          interest_rate: number
          last_payment_date: string
          pending_offers: number
          remaining_balance: number
          status: string
          title: string
          total_offers: number
        }[]
      }
      get_user_timeline_feed: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          actor_id: string | null
          actor_type: string | null
          amount_btc: number | null
          content: Json | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          description: string | null
          device_info: Json | null
          event_subtype: string | null
          event_timestamp: string
          event_type: string
          id: string
          is_cross_post_duplicate: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_quote_reply: boolean | null
          location_data: Json | null
          metadata: Json | null
          parent_event_id: string | null
          quantity: number | null
          subject_id: string | null
          subject_type: string
          tags: string[] | null
          target_id: string | null
          target_type: string | null
          thread_depth: number | null
          thread_id: string | null
          title: string
          updated_at: string
          visibility: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "timeline_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_user_disliked_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      has_user_liked_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      has_user_shared_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      increment_ai_revenue: {
        Args: { p_amount: number; p_assistant_id: string; p_creator_id: string }
        Returns: undefined
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      like_timeline_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          like_count: number
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      match_bot_knowledge: {
        Args: {
          match_count?: number
          query_embedding: string
          target_bot_id: string
        }
        Returns: {
          content: string
          id: string
          keywords: string[]
          question: string
          similarity: number
          topic: string
        }[]
      }
      match_documents: {
        Args: {
          filter_user_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      request_ai_withdrawal: {
        Args: { p_amount: number; p_creator_id: string; p_destination: string }
        Returns: string
      }
      send_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_message_type?: string
          p_metadata?: Json
          p_sender_id: string
        }
        Returns: string
      }
      share_timeline_event: {
        Args: {
          p_original_event_id: string
          p_share_text?: string
          p_user_id?: string
          p_visibility?: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_timeline_event: {
        Args: { event_id: string; reason?: string }
        Returns: boolean
      }
      undislike_timeline_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          dislike_count: number
        }[]
      }
      unlike_timeline_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          like_count: number
        }[]
      }
      update_timeline_comment: {
        Args: { p_comment_id: string; p_content: string; p_user_id: string }
        Returns: boolean
      }
      user_is_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_assistant_status: "draft" | "active" | "paused" | "archived"
      ai_pricing_model: "per_message" | "per_token" | "subscription" | "free"
      cat_action_category:
        | "entities"
        | "communication"
        | "payments"
        | "organization"
        | "settings"
        | "context"
      cat_action_status:
        | "pending"
        | "executing"
        | "completed"
        | "failed"
        | "cancelled"
      compute_provider_type: "api" | "self_hosted" | "community"
      document_type:
        | "goals"
        | "finances"
        | "skills"
        | "notes"
        | "business_plan"
        | "other"
      document_visibility: "private" | "cat_visible" | "public"
      governance_model_enum:
        | "hierarchical"
        | "democratic"
        | "consensus"
        | "dao"
        | "other"
      membership_role_enum: "owner" | "admin" | "moderator" | "member" | "guest"
      membership_status_enum:
        | "active"
        | "pending"
        | "suspended"
        | "left"
        | "banned"
      organization_type_enum:
        | "non_profit"
        | "business"
        | "dao"
        | "community"
        | "foundation"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_assistant_status: ["draft", "active", "paused", "archived"],
      ai_pricing_model: ["per_message", "per_token", "subscription", "free"],
      cat_action_category: [
        "entities",
        "communication",
        "payments",
        "organization",
        "settings",
        "context",
      ],
      cat_action_status: [
        "pending",
        "executing",
        "completed",
        "failed",
        "cancelled",
      ],
      compute_provider_type: ["api", "self_hosted", "community"],
      document_type: [
        "goals",
        "finances",
        "skills",
        "notes",
        "business_plan",
        "other",
      ],
      document_visibility: ["private", "cat_visible", "public"],
      governance_model_enum: [
        "hierarchical",
        "democratic",
        "consensus",
        "dao",
        "other",
      ],
      membership_role_enum: ["owner", "admin", "moderator", "member", "guest"],
      membership_status_enum: [
        "active",
        "pending",
        "suspended",
        "left",
        "banned",
      ],
      organization_type_enum: [
        "non_profit",
        "business",
        "dao",
        "community",
        "foundation",
        "other",
      ],
    },
  },
} as const
