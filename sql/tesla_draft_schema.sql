-- TESLA-GRADE DRAFT MANAGEMENT DATABASE SCHEMA
-- Event-sourced architecture with real-time sync and conflict resolution

-- Campaign Drafts Table (Main State Storage)
CREATE TABLE campaign_drafts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'CREATING' CHECK (status IN ('CREATING', 'SYNCING', 'SYNCED', 'CONFLICT', 'OFFLINE', 'ERROR')),
  metadata JSONB NOT NULL DEFAULT '{}',
  conflicts JSONB NOT NULL DEFAULT '[]',
  last_synced_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_id TEXT,
  session_id TEXT,
  
  -- Indexes for performance
  CONSTRAINT valid_step CHECK (current_step BETWEEN 1 AND 5),
  CONSTRAINT valid_version CHECK (version > 0)
);

-- Event Store Table (Audit Trail & Event Sourcing)
CREATE TABLE draft_events (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES campaign_drafts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'DRAFT_CREATED', 
    'FIELD_UPDATED', 
    'STEP_CHANGED', 
    'AUTOSAVE_TRIGGERED', 
    'MANUAL_SAVE', 
    'SYNC_COMPLETED', 
    'CONFLICT_DETECTED', 
    'CONFLICT_RESOLVED'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  
  -- Performance indexes
  CONSTRAINT valid_event_version CHECK (version > 0)
);

-- Real-time Sync Log Table (Conflict Detection)
CREATE TABLE draft_sync_log (
  id SERIAL PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES campaign_drafts(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  conflicts_detected INTEGER NOT NULL DEFAULT 0,
  conflicts_resolved INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN,
  error_message TEXT,
  client_id TEXT NOT NULL,
  session_id TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX idx_campaign_drafts_user_id ON campaign_drafts(user_id);
CREATE INDEX idx_campaign_drafts_status ON campaign_drafts(status);
CREATE INDEX idx_campaign_drafts_last_modified ON campaign_drafts(last_modified_at DESC);
CREATE INDEX idx_campaign_drafts_user_status ON campaign_drafts(user_id, status);

CREATE INDEX idx_draft_events_draft_id ON draft_events(draft_id);
CREATE INDEX idx_draft_events_type ON draft_events(type);
CREATE INDEX idx_draft_events_timestamp ON draft_events(timestamp DESC);
CREATE INDEX idx_draft_events_user_id ON draft_events(user_id);

CREATE INDEX idx_draft_sync_log_draft_id ON draft_sync_log(draft_id);
CREATE INDEX idx_draft_sync_log_started_at ON draft_sync_log(sync_started_at DESC);

-- Row Level Security (RLS)
ALTER TABLE campaign_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own drafts"
  ON campaign_drafts
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own draft events"
  ON draft_events
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sync logs"
  ON draft_sync_log
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM campaign_drafts 
    WHERE campaign_drafts.id = draft_sync_log.draft_id 
    AND campaign_drafts.user_id = auth.uid()
  ));

-- Real-time Subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_events;

-- Functions for Advanced Queries
CREATE OR REPLACE FUNCTION get_user_draft_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'totalDrafts', COUNT(*),
    'completedDrafts', COUNT(*) FILTER (WHERE (metadata->>'completionPercentage')::INTEGER >= 80),
    'averageCompletion', COALESCE(AVG((metadata->>'completionPercentage')::INTEGER), 0),
    'totalWordCount', COALESCE(SUM((metadata->>'wordCount')::INTEGER), 0),
    'syncedDrafts', COUNT(*) FILTER (WHERE status = 'SYNCED'),
    'conflictedDrafts', COUNT(*) FILTER (WHERE jsonb_array_length(conflicts) > 0)
  ) INTO stats
  FROM campaign_drafts
  WHERE user_id = user_uuid;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Conflict Detection
CREATE OR REPLACE FUNCTION detect_draft_conflicts(
  draft_uuid TEXT,
  local_data JSONB,
  local_version INTEGER
)
RETURNS JSONB AS $$
DECLARE
  remote_draft RECORD;
  conflicts JSONB DEFAULT '[]';
  field_name TEXT;
  field_conflicts JSONB;
BEGIN
  -- Get current remote state
  SELECT * INTO remote_draft
  FROM campaign_drafts
  WHERE id = draft_uuid;
  
  IF NOT FOUND THEN
    RETURN conflicts;
  END IF;
  
  -- Check if remote version is newer
  IF remote_draft.version <= local_version THEN
    RETURN conflicts;
  END IF;
  
  -- Compare each field
  FOR field_name IN SELECT jsonb_object_keys(local_data)
  LOOP
    IF (local_data->field_name) IS DISTINCT FROM (remote_draft.form_data->field_name) THEN
      conflicts := conflicts || jsonb_build_array(
        jsonb_build_object(
          'id', generate_random_uuid()::TEXT,
          'field', field_name,
          'localValue', local_data->field_name,
          'remoteValue', remote_draft.form_data->field_name,
          'timestamp', extract(epoch from now()) * 1000,
          'resolved', false
        )
      );
    END IF;
  END LOOP;
  
  RETURN conflicts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Auto-Resolution
CREATE OR REPLACE FUNCTION auto_resolve_conflicts(
  draft_uuid TEXT,
  conflicts_array JSONB
)
RETURNS JSONB AS $$
DECLARE
  resolved_conflicts JSONB DEFAULT '[]';
  conflict JSONB;
  resolution TEXT;
BEGIN
  FOR conflict IN SELECT jsonb_array_elements(conflicts_array)
  LOOP
    -- Smart resolution logic
    IF conflict->>'field' IN ('title', 'description') THEN
      -- Prefer longer text
      IF length(conflict->>'localValue') > length(conflict->>'remoteValue') THEN
        resolution := 'local';
      ELSE
        resolution := 'remote';
      END IF;
    ELSIF conflict->>'field' = 'goal_amount' THEN
      -- Prefer non-zero values
      IF (conflict->>'localValue')::NUMERIC > 0 THEN
        resolution := 'local';
      ELSE
        resolution := 'remote';
      END IF;
    ELSE
      -- Default to local (most recent user input)
      resolution := 'local';
    END IF;
    
    resolved_conflicts := resolved_conflicts || jsonb_build_array(
      conflict || jsonb_build_object(
        'resolved', true,
        'resolution', resolution
      )
    );
  END LOOP;
  
  RETURN resolved_conflicts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Auto-Updating Metadata
CREATE OR REPLACE FUNCTION update_draft_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at := NOW();
  NEW.version := OLD.version + 1;
  
  -- Auto-calculate completion percentage if form_data changed
  IF NEW.form_data IS DISTINCT FROM OLD.form_data THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'wordCount', length(COALESCE(NEW.form_data->>'description', '')),
      'completionPercentage', (
        CASE WHEN NEW.form_data->>'title' != '' THEN 25 ELSE 0 END +
        CASE WHEN NEW.form_data->>'description' != '' THEN 25 ELSE 0 END +
        CASE WHEN NEW.form_data->>'bitcoin_address' != '' THEN 25 ELSE 0 END +
        CASE WHEN (NEW.form_data->>'goal_amount')::NUMERIC > 0 THEN 25 ELSE 0 END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_draft_metadata
  BEFORE UPDATE ON campaign_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_metadata(); 