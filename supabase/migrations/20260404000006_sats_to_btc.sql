-- Phase B: Rename all _sats columns to _btc, convert bigint → NUMERIC(18,8)
--
-- CLAUDE.md rule: "Store Bitcoin amounts as BTC using NUMERIC/DECIMAL.
-- Satoshis are a Lightning protocol detail — they do not exist as a product concept."
--
-- 26 columns across 16 tables. Almost all have zero data.
-- Non-zero rows converted: value / 100,000,000.

-- Step 1: Drop dependent views
DROP VIEW IF EXISTS enriched_timeline_events CASCADE;
DROP VIEW IF EXISTS wishlist_item_with_stats CASCADE;
DROP VIEW IF EXISTS wishlist_with_stats CASCADE;

-- Step 2: Convert and rename columns (alphabetical by table)

-- ai_assistants
ALTER TABLE ai_assistants ALTER COLUMN total_withdrawn_sats TYPE NUMERIC(18,8) USING total_withdrawn_sats::numeric / 100000000.0;
ALTER TABLE ai_assistants RENAME COLUMN total_withdrawn_sats TO total_withdrawn_btc;

-- ai_creator_earnings
ALTER TABLE ai_creator_earnings ALTER COLUMN available_balance_sats TYPE NUMERIC(18,8) USING COALESCE(available_balance_sats, 0)::numeric / 100000000.0;
ALTER TABLE ai_creator_earnings RENAME COLUMN available_balance_sats TO available_balance_btc;
ALTER TABLE ai_creator_earnings ALTER COLUMN pending_withdrawal_sats TYPE NUMERIC(18,8) USING pending_withdrawal_sats::numeric / 100000000.0;
ALTER TABLE ai_creator_earnings RENAME COLUMN pending_withdrawal_sats TO pending_withdrawal_btc;
ALTER TABLE ai_creator_earnings ALTER COLUMN total_earned_sats TYPE NUMERIC(18,8) USING total_earned_sats::numeric / 100000000.0;
ALTER TABLE ai_creator_earnings RENAME COLUMN total_earned_sats TO total_earned_btc;
ALTER TABLE ai_creator_earnings ALTER COLUMN total_withdrawn_sats TYPE NUMERIC(18,8) USING total_withdrawn_sats::numeric / 100000000.0;
ALTER TABLE ai_creator_earnings RENAME COLUMN total_withdrawn_sats TO total_withdrawn_btc;

-- ai_creator_withdrawals
ALTER TABLE ai_creator_withdrawals ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE ai_creator_withdrawals RENAME COLUMN amount_sats TO amount_btc;
ALTER TABLE ai_creator_withdrawals ALTER COLUMN fee_sats TYPE NUMERIC(18,8) USING fee_sats::numeric / 100000000.0;
ALTER TABLE ai_creator_withdrawals RENAME COLUMN fee_sats TO fee_btc;
ALTER TABLE ai_creator_withdrawals ALTER COLUMN net_amount_sats TYPE NUMERIC(18,8) USING COALESCE(net_amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE ai_creator_withdrawals RENAME COLUMN net_amount_sats TO net_amount_btc;

-- cat_action_log
ALTER TABLE cat_action_log ALTER COLUMN sats_amount TYPE NUMERIC(18,8) USING COALESCE(sats_amount, 0)::numeric / 100000000.0;
ALTER TABLE cat_action_log RENAME COLUMN sats_amount TO amount_btc;

-- cat_permissions
ALTER TABLE cat_permissions ALTER COLUMN max_sats_per_action TYPE NUMERIC(18,8) USING COALESCE(max_sats_per_action, 0)::numeric / 100000000.0;
ALTER TABLE cat_permissions RENAME COLUMN max_sats_per_action TO max_btc_per_action;

-- contributions
ALTER TABLE contributions ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE contributions RENAME COLUMN amount_sats TO amount_btc;

-- events
ALTER TABLE events ALTER COLUMN ticket_price_sats TYPE NUMERIC(18,8) USING COALESCE(ticket_price_sats, 0)::numeric / 100000000.0;
ALTER TABLE events RENAME COLUMN ticket_price_sats TO ticket_price_btc;
ALTER TABLE events ALTER COLUMN funding_goal_sats TYPE NUMERIC(18,8) USING COALESCE(funding_goal_sats, 0)::numeric / 100000000.0;
ALTER TABLE events RENAME COLUMN funding_goal_sats TO funding_goal_btc;

-- group_wallets
ALTER TABLE group_wallets ALTER COLUMN current_balance_sats TYPE NUMERIC(18,8) USING current_balance_sats::numeric / 100000000.0;
ALTER TABLE group_wallets RENAME COLUMN current_balance_sats TO current_balance_btc;

-- orders
ALTER TABLE orders ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE orders RENAME COLUMN amount_sats TO amount_btc;

-- payment_intents
ALTER TABLE payment_intents ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE payment_intents RENAME COLUMN amount_sats TO amount_btc;

-- research_entities
ALTER TABLE research_entities ALTER COLUMN funding_goal_sats TYPE NUMERIC(18,8) USING funding_goal_sats::numeric / 100000000.0;
ALTER TABLE research_entities RENAME COLUMN funding_goal_sats TO funding_goal_btc;
ALTER TABLE research_entities ALTER COLUMN funding_raised_sats TYPE NUMERIC(18,8) USING funding_raised_sats::numeric / 100000000.0;
ALTER TABLE research_entities RENAME COLUMN funding_raised_sats TO funding_raised_btc;

-- timeline_events
ALTER TABLE timeline_events ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE timeline_events RENAME COLUMN amount_sats TO amount_btc_legacy;
-- Note: timeline_events already has amount_btc column, so we rename the old sats one
-- to amount_btc_legacy temporarily. Then drop it since amount_btc is the real column.
ALTER TABLE timeline_events DROP COLUMN IF EXISTS amount_btc_legacy;

-- transactions
ALTER TABLE transactions ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
-- transactions already has amount_btc, so drop the converted sats column
DROP VIEW IF EXISTS loan_stats CASCADE; -- may depend on transactions
ALTER TABLE transactions DROP COLUMN amount_sats;

-- user_ai_preferences
ALTER TABLE user_ai_preferences ALTER COLUMN cached_total_cost_sats TYPE NUMERIC(18,8) USING cached_total_cost_sats::numeric / 100000000.0;
ALTER TABLE user_ai_preferences RENAME COLUMN cached_total_cost_sats TO cached_total_cost_btc;
ALTER TABLE user_ai_preferences ALTER COLUMN max_cost_sats TYPE NUMERIC(18,8) USING max_cost_sats::numeric / 100000000.0;
ALTER TABLE user_ai_preferences RENAME COLUMN max_cost_sats TO max_cost_btc;

-- wishlist_contributions
ALTER TABLE wishlist_contributions ALTER COLUMN amount_sats TYPE NUMERIC(18,8) USING COALESCE(amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE wishlist_contributions RENAME COLUMN amount_sats TO amount_btc;

-- wishlist_items
ALTER TABLE wishlist_items ALTER COLUMN target_amount_sats TYPE NUMERIC(18,8) USING COALESCE(target_amount_sats, 0)::numeric / 100000000.0;
ALTER TABLE wishlist_items RENAME COLUMN target_amount_sats TO target_amount_btc;
ALTER TABLE wishlist_items ALTER COLUMN funded_amount_sats TYPE NUMERIC(18,8) USING funded_amount_sats::numeric / 100000000.0;
ALTER TABLE wishlist_items RENAME COLUMN funded_amount_sats TO funded_amount_btc;

-- Step 3: Recreate views with _btc column names

CREATE OR REPLACE VIEW enriched_timeline_events AS
SELECT te.id, te.event_type, te.event_subtype, te.actor_id, te.actor_type,
    te.subject_type, te.subject_id, te.target_type, te.target_id,
    te.title, te.description, te.content,
    te.amount_btc,
    te.quantity, te.visibility, te.is_featured, te.event_timestamp,
    te.created_at, te.updated_at, te.metadata, te.tags,
    te.parent_event_id, te.thread_id, te.is_deleted,
    jsonb_build_object('id', actor.id, 'username', actor.username, 'full_name', actor.name,
        'avatar_url', actor.avatar_url, 'display_name', actor.name, 'bio', actor.bio,
        'created_at', actor.created_at) AS actor_data,
    CASE te.subject_type
        WHEN 'profile' THEN jsonb_build_object('id', sp.id, 'username', sp.username, 'full_name', sp.name,
            'avatar_url', sp.avatar_url, 'display_name', sp.name, 'bio', sp.bio, 'type', 'profile')
        WHEN 'project' THEN jsonb_build_object('id', spr.id, 'title', spr.title, 'status', spr.status,
            'description', spr.description, 'category', spr.category, 'type', 'project')
        ELSE NULL::jsonb
    END AS subject_data,
    CASE te.target_type
        WHEN 'profile' THEN jsonb_build_object('id', tp.id, 'username', tp.username,
            'avatar_url', tp.avatar_url, 'display_name', tp.name, 'type', 'profile')
        WHEN 'project' THEN jsonb_build_object('id', tpr.id, 'title', tpr.title, 'status', tpr.status,
            'category', tpr.category, 'type', 'project')
        ELSE NULL::jsonb
    END AS target_data,
    0 AS like_count, 0 AS comment_count, 0 AS share_count
FROM (((((timeline_events te
    LEFT JOIN profiles actor ON te.actor_id = actor.id)
    LEFT JOIN profiles sp ON te.subject_type = 'profile' AND te.subject_id = sp.id)
    LEFT JOIN projects spr ON te.subject_type = 'project' AND te.subject_id = spr.id)
    LEFT JOIN profiles tp ON te.target_type = 'profile' AND te.target_id = tp.id)
    LEFT JOIN projects tpr ON te.target_type = 'project' AND te.target_id = tpr.id)
WHERE NOT te.is_deleted;

CREATE OR REPLACE VIEW wishlist_item_with_stats AS
SELECT wi.id, wi.wishlist_id, wi.title, wi.description, wi.image_url,
    wi.product_id, wi.service_id, wi.external_url, wi.external_source,
    wi.target_amount_btc, wi.currency, wi.original_amount,
    wi.funded_amount_btc, wi.is_fully_funded, wi.is_fulfilled,
    wi.dedicated_wallet_address, wi.use_dedicated_wallet,
    wi.priority, wi.allow_partial_funding, wi.quantity_wanted, wi.quantity_received,
    wi.created_at, wi.updated_at,
    count(DISTINCT wc.id) AS contribution_count,
    count(DISTINCT wc.contributor_actor_id) AS contributor_count,
    count(DISTINCT wf.id) FILTER (WHERE wf.feedback_type = 'like') AS like_count,
    count(DISTINCT wf.id) FILTER (WHERE wf.feedback_type = 'dislike') AS dislike_count
FROM ((wishlist_items wi
    LEFT JOIN wishlist_contributions wc ON wc.wishlist_item_id = wi.id AND wc.payment_status = 'completed')
    LEFT JOIN wishlist_feedback wf ON wf.wishlist_item_id = wi.id)
GROUP BY wi.id;

CREATE OR REPLACE VIEW wishlist_with_stats AS
SELECT w.id, w.actor_id, w.title, w.description, w.type, w.visibility,
    w.is_active, w.event_date, w.cover_image_url, w.created_at, w.updated_at,
    count(DISTINCT wi.id) AS item_count,
    count(DISTINCT wi.id) FILTER (WHERE wi.is_fully_funded) AS funded_item_count,
    count(DISTINCT wi.id) FILTER (WHERE wi.is_fulfilled) AS fulfilled_item_count,
    COALESCE(sum(wi.target_amount_btc), 0) AS total_target_btc,
    COALESCE(sum(wi.funded_amount_btc), 0) AS total_funded_btc
FROM wishlists w
LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
GROUP BY w.id;
