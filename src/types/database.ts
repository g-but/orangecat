// Supabase Json type for flexible JSON columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          title: string | null;
          is_group: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
          last_message_at: string;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          is_group?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          is_group?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
        };
      };

      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          last_read_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string;
          is_active?: boolean;
        };
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          edited_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          edited_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          edited_at?: string | null;
        };
      };

      message_read_receipts: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          read_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          owner_id: string;
          type: 'real_estate' | 'business' | 'vehicle' | 'equipment' | 'securities' | 'other';
          title: string;
          description: string | null;
          location: string | null;
          estimated_value: number | null;
          currency: string;
          documents: Json[] | Json | null;
          verification_status: 'unverified' | 'user_provided' | 'third_party_verified';
          status: 'draft' | 'active' | 'archived';
          public_visibility: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type: 'real_estate' | 'business' | 'vehicle' | 'equipment' | 'securities' | 'other';
          title: string;
          description?: string | null;
          location?: string | null;
          estimated_value?: number | null;
          currency?: string;
          documents?: Json[] | Json | null;
          verification_status?: 'unverified' | 'user_provided' | 'third_party_verified';
          status?: 'draft' | 'active' | 'archived';
          public_visibility?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          type?: 'real_estate' | 'business' | 'vehicle' | 'equipment' | 'securities' | 'other';
          title?: string;
          description?: string | null;
          location?: string | null;
          estimated_value?: number | null;
          currency?: string;
          documents?: Json[] | Json | null;
          verification_status?: 'unverified' | 'user_provided' | 'third_party_verified';
          status?: 'draft' | 'active' | 'archived';
          public_visibility?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      loan_collateral: {
        Row: {
          id: string;
          loan_id: string;
          asset_id: string;
          owner_id: string;
          pledged_value: number | null;
          currency: string;
          status: 'pending' | 'accepted' | 'released';
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          asset_id: string;
          owner_id: string;
          pledged_value?: number | null;
          currency?: string;
          status?: 'pending' | 'accepted' | 'released';
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          asset_id?: string;
          owner_id?: string;
          pledged_value?: number | null;
          currency?: string;
          status?: 'pending' | 'accepted' | 'released';
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          name: string | null;
          bio: string | null;
          email: string | null;
          // Location fields
          location: string | null; // Legacy field (deprecated)
          location_search: string | null; // Display field for formatted address
          location_country: string | null; // ISO 3166-1 alpha-2 country code
          location_city: string | null; // City or municipality name
          location_zip: string | null; // ZIP or postal code
          latitude: number | null; // Geographic latitude coordinate
          longitude: number | null; // Geographic longitude coordinate
          // Media fields
          avatar_url: string | null;
          banner_url: string | null;
          website: string | null;
          // Social & Contact
          social_links: {
            links: Array<{ platform: string; label?: string; value: string }>;
          } | null;
          contact_email: string | null;
          phone: string | null;
          // Wallet fields
          bitcoin_address: string | null;
          lightning_address: string | null;
          // Status fields
          verification_status: string | null;
          status: string | null;
          // Timestamps
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          name?: string | null;
          bio?: string | null;
          email?: string | null;
          // Location fields
          location?: string | null;
          location_search?: string | null;
          location_country?: string | null;
          location_city?: string | null;
          location_zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          // Media fields
          avatar_url?: string | null;
          banner_url?: string | null;
          website?: string | null;
          // Wallet fields
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          // Status fields
          verification_status?: string | null;
          status?: string | null;
          // Timestamps
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          name?: string | null;
          bio?: string | null;
          email?: string | null;
          // Location fields
          location?: string | null;
          location_search?: string | null;
          location_country?: string | null;
          location_city?: string | null;
          location_zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          // Media fields
          avatar_url?: string | null;
          banner_url?: string | null;
          website?: string | null;
          // Wallet fields
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          // Status fields
          verification_status?: string | null;
          status?: string | null;
          // Timestamps
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          website: string | null;
          bitcoin_address: string | null;
          lightning_address: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          website?: string | null;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          website?: string | null;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          status: 'active' | 'inactive' | 'pending' | 'removed';
          invited_by: string | null;
          invited_at: string;
          joined_at: string;
          permissions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          status?: 'active' | 'inactive' | 'pending' | 'removed';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          status?: 'active' | 'inactive' | 'pending' | 'removed';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          goal_amount: number | null;
          currency: string;
          funding_purpose: string | null;
          bitcoin_address: string | null;
          lightning_address: string | null;
          category: string | null;
          tags: string[] | null;
          status: string;
          raised_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          goal_amount?: number | null;
          currency?: string;
          funding_purpose?: string | null;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: string;
          raised_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          goal_amount?: number | null;
          currency?: string;
          funding_purpose?: string | null;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          category?: string | null;
          tags?: string[] | null;
          status?: string;
          raised_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          amount_sats: number;
          currency: string;
          from_entity_type: string;
          from_entity_id: string;
          to_entity_type: string;
          to_entity_id: string;
          payment_method: string;
          transaction_hash: string | null;
          lightning_payment_hash: string | null;
          payment_proof: string | null;
          status: string;
          fee_sats: number;
          exchange_rate: number | null;
          anonymous: boolean;
          message: string | null;
          purpose: string | null;
          tags: string[] | null;
          public_visibility: boolean;
          audit_trail: Json | null;
          verification_status: string | null;
          initiated_at: string | null;
          confirmed_at: string | null;
          settled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          amount_sats: number;
          currency?: string;
          from_entity_type: string;
          from_entity_id: string;
          to_entity_type: string;
          to_entity_id: string;
          payment_method: string;
          transaction_hash?: string | null;
          lightning_payment_hash?: string | null;
          payment_proof?: string | null;
          status?: string;
          fee_sats?: number;
          exchange_rate?: number | null;
          anonymous?: boolean;
          message?: string | null;
          purpose?: string | null;
          tags?: string[] | null;
          public_visibility?: boolean;
          audit_trail?: Json | null;
          verification_status?: string | null;
          initiated_at?: string | null;
          confirmed_at?: string | null;
          settled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          amount_sats?: number;
          currency?: string;
          from_entity_type?: string;
          from_entity_id?: string;
          to_entity_type?: string;
          to_entity_id?: string;
          payment_method?: string;
          transaction_hash?: string | null;
          lightning_payment_hash?: string | null;
          payment_proof?: string | null;
          status?: string;
          fee_sats?: number;
          exchange_rate?: number | null;
          anonymous?: boolean;
          message?: string | null;
          purpose?: string | null;
          tags?: string[] | null;
          public_visibility?: boolean;
          audit_trail?: Json | null;
          verification_status?: string | null;
          initiated_at?: string | null;
          confirmed_at?: string | null;
          settled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_products: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          price_sats: number;
          currency: string;
          product_type: string;
          images: string[] | null;
          thumbnail_url: string | null;
          inventory_count: number;
          fulfillment_type: string;
          category: string | null;
          tags: string[] | null;
          status: string;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          price_sats: number;
          currency?: string;
          product_type?: string;
          images?: string[] | null;
          thumbnail_url?: string | null;
          inventory_count?: number;
          fulfillment_type?: string;
          category?: string | null;
          tags?: string[] | null;
          status?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          price_sats?: number;
          currency?: string;
          product_type?: string;
          images?: string[] | null;
          thumbnail_url?: string | null;
          inventory_count?: number;
          fulfillment_type?: string;
          category?: string | null;
          tags?: string[] | null;
          status?: string;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_services: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          hourly_rate_sats: number | null;
          fixed_price_sats: number | null;
          currency: string;
          duration_minutes: number | null;
          availability_schedule: Json | null;
          service_location_type: string;
          service_area: string | null;
          images: string[] | null;
          portfolio_links: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          hourly_rate_sats?: number | null;
          fixed_price_sats?: number | null;
          currency?: string;
          duration_minutes?: number | null;
          availability_schedule?: Json | null;
          service_location_type?: string;
          service_area?: string | null;
          images?: string[] | null;
          portfolio_links?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          hourly_rate_sats?: number | null;
          fixed_price_sats?: number | null;
          currency?: string;
          duration_minutes?: number | null;
          availability_schedule?: Json | null;
          service_location_type?: string;
          service_area?: string | null;
          images?: string[] | null;
          portfolio_links?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_causes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cause_category: string;
          goal_sats: number | null;
          currency: string;
          bitcoin_address: string | null;
          lightning_address: string | null;
          distribution_rules: Json | null;
          beneficiaries: Json | null;
          status: string;
          total_raised_sats: number;
          total_distributed_sats: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cause_category: string;
          goal_sats?: number | null;
          currency?: string;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          distribution_rules?: Json | null;
          beneficiaries?: Json | null;
          status?: string;
          total_raised_sats?: number;
          total_distributed_sats?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          cause_category?: string;
          goal_sats?: number | null;
          currency?: string;
          bitcoin_address?: string | null;
          lightning_address?: string | null;
          distribution_rules?: Json | null;
          beneficiaries?: Json | null;
          status?: string;
          total_raised_sats?: number;
          total_distributed_sats?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_ai_assistants: {
        Row: {
          id: string;
          user_id: string;
          assistant_name: string;
          personality_prompt: string | null;
          training_data: Json | null;
          status: string;
          is_enabled: boolean;
          response_style: string;
          allowed_topics: string[] | null;
          blocked_topics: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assistant_name?: string;
          personality_prompt?: string | null;
          training_data?: Json | null;
          status?: string;
          is_enabled?: boolean;
          response_style?: string;
          allowed_topics?: string[] | null;
          blocked_topics?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assistant_name?: string;
          personality_prompt?: string | null;
          training_data?: Json | null;
          status?: string;
          is_enabled?: boolean;
          response_style?: string;
          allowed_topics?: string[] | null;
          blocked_topics?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      conversation_details: {
        Row: {
          id: string;
          title: string | null;
          is_group: boolean;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          participants: Json | null; // array of participant objects
          unread_count: number | null;
        };
      };
      message_details: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          edited_at: string | null;
          sender: Json | null; // sender profile fields
          is_read: boolean | null;
        };
      };
    };
    Functions: {
      get_user_conversations: {
        Args: { p_user_id: string };
        Returns: Database['public']['Views']['conversation_details']['Row'][];
      };
      create_group_conversation: {
        Args: { p_created_by: string; p_participant_ids: string[]; p_title: string | null };
        Returns: string;
      };
      create_direct_conversation: {
        Args: { participant1_id: string; participant2_id: string };
        Returns: string;
      };
      open_conversation: {
        Args: { p_requestor_id: string; p_participant_ids?: string[]; p_title?: string | null };
        Returns: string;
      };
      send_message: {
        Args: { p_conversation_id: string; p_sender_id: string; p_content: string; p_message_type?: string; p_metadata?: Json | null };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type UserProduct = Database['public']['Tables']['user_products']['Row'];
export type UserService = Database['public']['Tables']['user_services']['Row'];
export type UserCause = Database['public']['Tables']['user_causes']['Row'];
export type UserAIAssistant = Database['public']['Tables']['user_ai_assistants']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type UserProductInsert = Database['public']['Tables']['user_products']['Insert'];
export type UserServiceInsert = Database['public']['Tables']['user_services']['Insert'];
export type UserCauseInsert = Database['public']['Tables']['user_causes']['Insert'];
export type UserAIAssistantInsert = Database['public']['Tables']['user_ai_assistants']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert'];
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update'];
export type UserProductUpdate = Database['public']['Tables']['user_products']['Update'];
export type UserServiceUpdate = Database['public']['Tables']['user_services']['Update'];
export type UserCauseUpdate = Database['public']['Tables']['user_causes']['Update'];
export type UserAIAssistantUpdate = Database['public']['Tables']['user_ai_assistants']['Update'];

// Form data types for profile operations
export type ProfileFormData = {
  username: string; // Required field - must match validation schema
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  // Location fields
  location?: string | null; // Legacy field (deprecated but kept for backward compatibility)
  location_search?: string | null; // Display field for formatted address
  location_country?: string | null; // ISO 3166-1 alpha-2 country code
  location_city?: string | null; // City or municipality name
  location_zip?: string | null; // ZIP or postal code
  latitude?: number | null; // Geographic latitude coordinate
  longitude?: number | null; // Geographic longitude coordinate
  // Extended transparency fields
  background?: string | null; // Personal/professional background
  inspiration_statement?: string | null; // What inspires them
  location_context?: string | null; // Additional context about location (canton/state)
  // Media fields
  avatar_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  // Social & Contact
  social_links?: { links: Array<{ platform: string; label?: string; value: string }> } | null;
  contact_email?: string | null;
  phone?: string | null;
  // Wallet fields (kept for backward compatibility, but wallets managed separately)
  bitcoin_address?: string | null;
  lightning_address?: string | null;
};

// Form data types for entity operations
export type ProjectFormData = {
  title: string;
  description: string;
  goal_amount?: number | null;
  currency?: string;
  funding_purpose?: string | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  category?: string | null;
  tags?: string[];
};

export type TransactionFormData = {
  amount_sats: number;
  from_entity_type: 'profile' | 'organization' | 'project';
  from_entity_id: string;
  to_entity_type: 'profile' | 'organization' | 'project';
  to_entity_id: string;
  payment_method: 'bitcoin' | 'lightning' | 'on-chain' | 'off-chain';
  message?: string | null;
  purpose?: string | null;
  anonymous?: boolean;
  public_visibility?: boolean;
};

export type ProfileData = Profile;

// Form data types for organization operations
export type OrganizationFormData = {
  name: string;
  slug?: string;
  description?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
};

// Form data types for personal economy operations
export type UserProductFormData = {
  title: string;
  description?: string | null;
  price_sats: number;
  currency?: string;
  product_type?: string;
  images?: string[];
  thumbnail_url?: string | null;
  inventory_count?: number;
  fulfillment_type?: string;
  category?: string | null;
  tags?: string[];
  status?: string;
  is_featured?: boolean;
};

export type UserServiceFormData = {
  title: string;
  description?: string | null;
  category: string;
  hourly_rate_sats?: number | null;
  fixed_price_sats?: number | null;
  currency?: string;
  duration_minutes?: number | null;
  availability_schedule?: any;
  service_location_type?: string;
  service_area?: string | null;
  images?: string[];
  portfolio_links?: string[];
  status?: string;
};

export type UserCauseFormData = {
  title: string;
  description?: string | null;
  cause_category: string;
  goal_sats?: number | null;
  currency?: string;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  distribution_rules?: any;
  beneficiaries?: any[];
  status?: string;
};

export type UserAIAssistantFormData = {
  assistant_name?: string;
  personality_prompt?: string | null;
  training_data?: any;
  status?: string;
  is_enabled?: boolean;
  response_style?: string;
  allowed_topics?: string[];
  blocked_topics?: string[];
};

// Form data types for settings operations

// Form data types for password operations
export type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Extended project type with additional computed fields
export type ProjectWithStats = Project & {
  total_donations?: number;
  donor_count?: number;
  days_remaining?: number | null;
};

export type ProfileWithProjects = Profile & {
  projects?: Project[];
};
