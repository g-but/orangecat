-- Fix COALESCE type mismatch in create_timeline_event function
-- Error: "COALESCE types text and timestamp with time zone cannot be matched"
-- Issue: p_metadata->>'event_timestamp' returns TEXT, but now() returns TIMESTAMP WITH TIME ZONE
-- Solution: Cast text to timestamptz before COALESCE

CREATE OR REPLACE FUNCTION create_timeline_event(
  p_event_type text,
  p_subject_type text,
  p_title text,
  p_event_subtype text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'user',
  p_subject_id uuid DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_content jsonb DEFAULT '{}'::jsonb,
  p_amount_sats bigint DEFAULT NULL,
  p_amount_btc numeric DEFAULT NULL,
  p_quantity integer DEFAULT NULL,
  p_visibility text DEFAULT 'public',
  p_is_featured boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_tags text[] DEFAULT '{}'::text[],
  p_parent_event_id uuid DEFAULT NULL,
  p_thread_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO timeline_events (
    event_type,
    event_subtype,
    actor_id,
    actor_type,
    subject_type,
    subject_id,
    target_type,
    target_id,
    title,
    description,
    content,
    amount_sats,
    amount_btc,
    quantity,
    visibility,
    is_featured,
    metadata,
    tags,
    parent_event_id,
    thread_id,
    event_timestamp
  ) VALUES (
    p_event_type,
    p_event_subtype,
    p_actor_id,
    p_actor_type,
    p_subject_type,
    p_subject_id,
    p_target_type,
    p_target_id,
    p_title,
    p_description,
    p_content,
    p_amount_sats,
    p_amount_btc,
    p_quantity,
    p_visibility,
    p_is_featured,
    p_metadata,
    p_tags,
    p_parent_event_id,
    p_thread_id,
    -- FIX: Cast text to timestamptz before COALESCE
    COALESCE((p_metadata->>'event_timestamp')::timestamptz, now())
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;
