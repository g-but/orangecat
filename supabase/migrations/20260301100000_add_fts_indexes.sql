-- Full-Text Search Indexes for Platform Discovery
--
-- Enables Cat to search for users and entities across the platform.
-- Uses PostgreSQL's built-in FTS (tsvector + GIN index) — free, no extra infrastructure.
--
-- Scope: public-facing content only (active entities, profiles with usernames)
-- Language: 'english' for stemming (good default for a global platform)

-- Profiles: search by username, display_name, bio
CREATE INDEX IF NOT EXISTS idx_profiles_fts
  ON profiles
  USING gin(
    to_tsvector('english',
      coalesce(username, '') || ' ' ||
      coalesce(display_name, '') || ' ' ||
      coalesce(bio, '')
    )
  );

-- Projects (table: projects)
CREATE INDEX IF NOT EXISTS idx_projects_fts
  ON projects
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  );

-- Causes (table: user_causes)
CREATE INDEX IF NOT EXISTS idx_user_causes_fts
  ON user_causes
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  );

-- Products (table: user_products)
CREATE INDEX IF NOT EXISTS idx_user_products_fts
  ON user_products
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  );

-- Services (table: user_services)
CREATE INDEX IF NOT EXISTS idx_user_services_fts
  ON user_services
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  );

-- Events (table: events)
CREATE INDEX IF NOT EXISTS idx_events_fts
  ON events
  USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  );
