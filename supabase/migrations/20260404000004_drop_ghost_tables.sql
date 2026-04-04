-- Drop ghost tables: 23 tables with zero code references
--
-- These tables accumulated from past pivots and abandoned features.
-- All have zero imports/queries in the codebase. Data backed up before dropping.
--
-- Categories:
--   Organization system (8): superseded by groups
--   Treasury system (3): never implemented
--   Legacy bot system (2): superseded by ai_assistants
--   Legacy docs (2): superseded by user_documents
--   Legacy funding (2): superseded by contributions/payment_intents
--   Legacy misc (6): orphaned from various pivots

-- Organization system (superseded by groups)
DROP TABLE IF EXISTS organization_votes CASCADE;
DROP TABLE IF EXISTS organization_proposals CASCADE;
DROP TABLE IF EXISTS organization_invites CASCADE;
DROP TABLE IF EXISTS organization_application_questions CASCADE;
DROP TABLE IF EXISTS organization_treasuries CASCADE;
DROP TABLE IF EXISTS organization_stakeholders CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Treasury system (never implemented beyond schema)
DROP TABLE IF EXISTS treasury_assets CASCADE;
DROP TABLE IF EXISTS treasury_signers CASCADE;
DROP TABLE IF EXISTS treasury_wallets CASCADE;

-- Legacy bot system (superseded by ai_assistants)
DROP TABLE IF EXISTS bot_knowledge_chunks CASCADE;
DROP TABLE IF EXISTS custom_bots CASCADE;

-- Legacy document system (superseded by user_documents)
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Legacy funding (superseded by contributions + payment_intents)
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS funding_pages CASCADE;

-- Orphaned misc tables
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS profile_associations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_ai_assistants CASCADE;
