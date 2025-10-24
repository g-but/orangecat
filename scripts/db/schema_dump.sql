

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."governance_model_enum" AS ENUM (
    'hierarchical',
    'democratic',
    'consensus',
    'dao',
    'other'
);


ALTER TYPE "public"."governance_model_enum" OWNER TO "postgres";


CREATE TYPE "public"."membership_role_enum" AS ENUM (
    'owner',
    'admin',
    'moderator',
    'member',
    'guest'
);


ALTER TYPE "public"."membership_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."membership_status_enum" AS ENUM (
    'active',
    'pending',
    'suspended',
    'left',
    'banned'
);


ALTER TYPE "public"."membership_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."organization_type_enum" AS ENUM (
    'non_profit',
    'business',
    'dao',
    'community',
    'foundation',
    'other'
);


ALTER TYPE "public"."organization_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert new profile with sensible defaults
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    email,
    status,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    -- Use email as initial username, or generate from user ID if no email
    COALESCE(new.email, 'user_' || substring(new.id::text, 1, 8)),
    -- Try multiple sources for display name, with fallback to email username
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'User'
    ),
    new.email,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Handle race conditions gracefully
  
  RETURN new;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Automatically creates a profile when a new user signs up. Uses email for initial username and extracts display name from user metadata or email.';



CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_profile_views"("profile_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      last_active_at = NOW()
  WHERE id = profile_id;
END;
$$;


ALTER FUNCTION "public"."increment_profile_views"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_association_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_association_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funding_pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "bitcoin_address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "verification_level" integer DEFAULT 0 NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."funding_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "public"."membership_role_enum" DEFAULT 'member'::"public"."membership_role_enum" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "title" character varying(150),
    "status" "public"."membership_status_enum" DEFAULT 'active'::"public"."membership_status_enum" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_active_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contribution_address" character varying(255),
    "total_contributions" numeric(20,8) DEFAULT 0 NOT NULL,
    "reward_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "invited_by" "uuid",
    "invitation_token" character varying(255),
    "invitation_expires_at" timestamp with time zone,
    "bio" "text",
    "achievements" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_contributions" CHECK (("total_contributions" >= (0)::numeric)),
    CONSTRAINT "valid_reward_percentage" CHECK ((("reward_percentage" >= (0)::numeric) AND ("reward_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['follow'::"text", 'donation'::"text", 'collaboration'::"text", 'invitation'::"text", 'application'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_application_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "order_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organization_application_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['text'::"text", 'select'::"text", 'checkbox'::"text", 'file'::"text"])))
);


ALTER TABLE "public"."organization_application_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "website_url" character varying(500),
    "avatar_url" character varying(500),
    "banner_url" character varying(500),
    "type" "public"."organization_type_enum" NOT NULL,
    "category" character varying(100),
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "governance_model" "public"."governance_model_enum" DEFAULT 'hierarchical'::"public"."governance_model_enum" NOT NULL,
    "treasury_address" character varying(255),
    "is_public" boolean DEFAULT true NOT NULL,
    "requires_approval" boolean DEFAULT true NOT NULL,
    "verification_level" integer DEFAULT 0 NOT NULL,
    "trust_score" numeric(3,2) DEFAULT 0.00 NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "contact_info" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "founded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "application_process" "jsonb" DEFAULT '{"questions": []}'::"jsonb",
    CONSTRAINT "non_empty_name" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "valid_slug_format" CHECK ((("slug")::"text" ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$'::"text")),
    CONSTRAINT "valid_trust_score" CHECK ((("trust_score" >= (0)::numeric) AND ("trust_score" <= (1)::numeric))),
    CONSTRAINT "valid_verification_level" CHECK (("verification_level" >= 0))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_associations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source_profile_id" "uuid" NOT NULL,
    "target_entity_id" "uuid" NOT NULL,
    "target_entity_type" "text" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "role" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "bitcoin_reward_address" "text",
    "reward_percentage" numeric DEFAULT 0 NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "last_modified_by" "uuid",
    CONSTRAINT "profile_associations_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['created'::"text", 'founded'::"text", 'supports'::"text", 'collaborates'::"text", 'maintains'::"text", 'member'::"text", 'leader'::"text", 'moderator'::"text", 'contributor'::"text", 'advisor'::"text", 'investor'::"text", 'sponsor'::"text", 'partner'::"text", 'beneficiary'::"text"]))),
    CONSTRAINT "profile_associations_reward_percentage_check" CHECK ((("reward_percentage" >= (0)::numeric) AND ("reward_percentage" <= (100)::numeric))),
    CONSTRAINT "profile_associations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text", 'completed'::"text", 'suspended'::"text", 'disputed'::"text"]))),
    CONSTRAINT "profile_associations_target_entity_type_check" CHECK (("target_entity_type" = ANY (ARRAY['profile'::"text", 'campaign'::"text", 'organization'::"text", 'collective'::"text", 'project'::"text"]))),
    CONSTRAINT "profile_associations_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'members_only'::"text", 'private'::"text", 'confidential'::"text"])))
);


ALTER TABLE "public"."profile_associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "avatar_url" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "display_name" "text",
    "bio" "text",
    "email" "text",
    "phone" "text",
    "location" "text",
    "timezone" "text",
    "language" "text",
    "currency" "text",
    "bitcoin_address" "text",
    "lightning_address" "text",
    "bitcoin_public_key" "text",
    "lightning_node_id" "text",
    "payment_preferences" "jsonb",
    "bitcoin_balance" numeric(20,8) DEFAULT 0,
    "lightning_balance" numeric(20,8) DEFAULT 0,
    "profile_views" integer DEFAULT 0,
    "follower_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "campaign_count" integer DEFAULT 0,
    "total_raised" numeric(20,8) DEFAULT 0,
    "total_donated" numeric(20,8) DEFAULT 0,
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "verification_level" integer DEFAULT 0,
    "kyc_status" "text" DEFAULT 'none'::"text",
    "two_factor_enabled" boolean DEFAULT false,
    "last_login_at" timestamp with time zone,
    "login_count" integer DEFAULT 0,
    "banner_url" "text",
    "theme_preferences" "jsonb",
    "custom_css" "text",
    "profile_color" "text",
    "cover_image_url" "text",
    "profile_badges" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "last_active_at" timestamp with time zone,
    "profile_completed_at" timestamp with time zone,
    "onboarding_completed" boolean DEFAULT false,
    "terms_accepted_at" timestamp with time zone,
    "privacy_policy_accepted_at" timestamp with time zone,
    "social_links" "jsonb",
    "preferences" "jsonb",
    "metadata" "jsonb",
    "verification_data" "jsonb",
    "privacy_settings" "jsonb",
    CONSTRAINT "profiles_bitcoin_address_format" CHECK ((("bitcoin_address" IS NULL) OR ("bitcoin_address" ~ '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$'::"text"))),
    CONSTRAINT "profiles_email_format" CHECK ((("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'::"text") OR ("email" IS NULL))),
    CONSTRAINT "profiles_kyc_status_check" CHECK (("kyc_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_lightning_address_format" CHECK ((("lightning_address" IS NULL) OR ("lightning_address" ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'::"text"))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'deleted'::"text"]))),
    CONSTRAINT "profiles_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['unverified'::"text", 'pending'::"text", 'verified'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_website_format" CHECK ((("website" ~* '^https?://'::"text") OR ("website" IS NULL)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with Bitcoin-native features';



COMMENT ON COLUMN "public"."profiles"."website" IS 'User website URL';



COMMENT ON COLUMN "public"."profiles"."display_name" IS 'User-friendly display name';



COMMENT ON COLUMN "public"."profiles"."bio" IS 'User biography/description';



COMMENT ON COLUMN "public"."profiles"."bitcoin_address" IS 'Bitcoin address for receiving payments';



COMMENT ON COLUMN "public"."profiles"."lightning_address" IS 'Lightning Network address for instant payments';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "funding_page_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "transaction_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" NOT NULL,
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transparency_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "calculation_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "verified_transactions_count" bigint DEFAULT 0,
    "audit_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transparency_scores_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['profile'::"text", 'organization'::"text"]))),
    CONSTRAINT "transparency_scores_score_check" CHECK ((("score" >= (0)::numeric) AND ("score" <= (100)::numeric)))
);


ALTER TABLE "public"."transparency_scores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funding_pages"
    ADD CONSTRAINT "funding_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_application_questions"
    ADD CONSTRAINT "organization_application_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profile_associations"
    ADD CONSTRAINT "profile_associations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_associations"
    ADD CONSTRAINT "profile_associations_source_profile_id_target_entity_id_rel_key" UNIQUE ("source_profile_id", "target_entity_id", "relationship_type", "target_entity_type");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transparency_scores"
    ADD CONSTRAINT "transparency_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transparency_scores"
    ADD CONSTRAINT "unique_entity_score" UNIQUE ("entity_id", "entity_type");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "unique_membership" UNIQUE ("organization_id", "profile_id");



CREATE INDEX "funding_pages_created_at_idx" ON "public"."funding_pages" USING "btree" ("created_at");



CREATE INDEX "funding_pages_user_id_idx" ON "public"."funding_pages" USING "btree" ("user_id");



CREATE INDEX "idx_app_questions_organization" ON "public"."organization_application_questions" USING "btree" ("organization_id");



CREATE INDEX "idx_associations_created_at" ON "public"."profile_associations" USING "btree" ("created_at");



CREATE INDEX "idx_associations_relationship_type" ON "public"."profile_associations" USING "btree" ("relationship_type");



CREATE INDEX "idx_associations_source_profile" ON "public"."profile_associations" USING "btree" ("source_profile_id");



CREATE INDEX "idx_associations_status" ON "public"."profile_associations" USING "btree" ("status");



CREATE INDEX "idx_associations_target_entity" ON "public"."profile_associations" USING "btree" ("target_entity_id", "target_entity_type");



CREATE INDEX "idx_follows_created_at" ON "public"."follows" USING "btree" ("created_at");



CREATE INDEX "idx_follows_follower_id" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following_id" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_notifications_type_created" ON "public"."notifications" USING "btree" ("type", "created_at" DESC);



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_display_name_trgm" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops") WHERE ("display_name" IS NOT NULL);



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_profiles_follower_count" ON "public"."profiles" USING "btree" ("follower_count" DESC) WHERE ("follower_count" > 0);



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "idx_profiles_total_raised" ON "public"."profiles" USING "btree" ("total_raised" DESC) WHERE ("total_raised" > (0)::numeric);



CREATE INDEX "idx_profiles_updated_at" ON "public"."profiles" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username") WHERE ("username" IS NOT NULL);



CREATE INDEX "idx_profiles_username_trgm" ON "public"."profiles" USING "gin" ("username" "public"."gin_trgm_ops") WHERE ("username" IS NOT NULL);



CREATE INDEX "idx_profiles_verification_status" ON "public"."profiles" USING "btree" ("verification_status");



CREATE INDEX "idx_transparency_scores_entity" ON "public"."transparency_scores" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_transparency_scores_score" ON "public"."transparency_scores" USING "btree" ("score" DESC);



CREATE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "transactions_created_at_idx" ON "public"."transactions" USING "btree" ("created_at");



CREATE INDEX "transactions_funding_page_id_idx" ON "public"."transactions" USING "btree" ("funding_page_id");



CREATE OR REPLACE TRIGGER "on_association_update" BEFORE UPDATE ON "public"."profile_associations" FOR EACH ROW EXECUTE FUNCTION "public"."update_association_updated_at"();



CREATE OR REPLACE TRIGGER "on_follow_change" AFTER INSERT OR DELETE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organization_application_questions_updated_at" BEFORE UPDATE ON "public"."organization_application_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transparency_scores_updated_at" BEFORE UPDATE ON "public"."transparency_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_pages"
    ADD CONSTRAINT "funding_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_application_questions"
    ADD CONSTRAINT "organization_application_questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_associations"
    ADD CONSTRAINT "profile_associations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profile_associations"
    ADD CONSTRAINT "profile_associations_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profile_associations"
    ADD CONSTRAINT "profile_associations_source_profile_id_fkey" FOREIGN KEY ("source_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_funding_page_id_fkey" FOREIGN KEY ("funding_page_id") REFERENCES "public"."funding_pages"("id") ON DELETE CASCADE;



CREATE POLICY "Org admins can manage questions" ON "public"."organization_application_questions" USING ((EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."organization_id" = "organization_application_questions"."organization_id") AND ("m"."profile_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"public"."membership_role_enum", 'admin'::"public"."membership_role_enum"]))))));



CREATE POLICY "Public associations are viewable by everyone" ON "public"."profile_associations" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "source_profile_id")));



CREATE POLICY "Public follows are viewable by everyone" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Public funding pages are viewable by everyone" ON "public"."funding_pages" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create funding pages" ON "public"."funding_pages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own associations" ON "public"."profile_associations" FOR INSERT WITH CHECK (("auth"."uid"() = "source_profile_id"));



CREATE POLICY "Users can create their own follows" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can create transactions for their funding pages" ON "public"."transactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."funding_pages"
  WHERE (("funding_pages"."id" = "transactions"."funding_page_id") AND ("funding_pages"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete their own associations" ON "public"."profile_associations" FOR DELETE USING (("auth"."uid"() = "source_profile_id"));



CREATE POLICY "Users can delete their own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can delete their own funding pages" ON "public"."funding_pages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own associations" ON "public"."profile_associations" FOR UPDATE USING (("auth"."uid"() = "source_profile_id"));



CREATE POLICY "Users can update their own funding pages" ON "public"."funding_pages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own entity scores" ON "public"."transparency_scores" FOR SELECT USING (((("entity_type" = 'profile'::"text") AND ("entity_id" = "auth"."uid"())) OR (("entity_type" = 'organization'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."memberships" "m"
  WHERE (("m"."organization_id" = "transparency_scores"."entity_id") AND ("m"."profile_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"public"."membership_role_enum", 'admin'::"public"."membership_role_enum"]))))))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own funding pages" ON "public"."funding_pages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view transactions for their funding pages" ON "public"."transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."funding_pages"
  WHERE (("funding_pages"."id" = "transactions"."funding_page_id") AND ("funding_pages"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funding_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_application_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_associations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_public" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transparency_scores" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_profile_views"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_association_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_association_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_association_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."funding_pages" TO "anon";
GRANT ALL ON TABLE "public"."funding_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."funding_pages" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organization_application_questions" TO "anon";
GRANT ALL ON TABLE "public"."organization_application_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_application_questions" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profile_associations" TO "anon";
GRANT ALL ON TABLE "public"."profile_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_associations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transparency_scores" TO "anon";
GRANT ALL ON TABLE "public"."transparency_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."transparency_scores" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
