#!/bin/bash
# Final attempt: Apply just the trigger part using Supabase Management API
# This assumes the tables already exist

set -e

echo "🔄 Applying funding sync trigger..."
echo ""

PROJECT_REF="ohkueislstxomdjavyhs"
ACCESS_TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

# Part 1: Drop existing trigger/function
echo "📝 Step 1: Dropping existing trigger/function if they exist..."
curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "DROP TRIGGER IF EXISTS transaction_funding_sync ON transactions; DROP FUNCTION IF EXISTS sync_project_funding();"}' | jq '.'

echo ""

# Part 2: Create function
echo "📝 Step 2: Creating sync_project_funding() function..."
SQL_FUNC='CREATE OR REPLACE FUNCTION sync_project_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = '\''INSERT'\'') THEN
    IF NEW.to_entity_type = '\''project'\'' AND NEW.status = '\''confirmed'\'' THEN
      UPDATE projects
      SET
        raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
        contributor_count = CASE
          WHEN NEW.from_entity_type = '\''profile'\'' THEN COALESCE(contributor_count, 0) + 1
          ELSE COALESCE(contributor_count, 0)
        END,
        updated_at = NOW()
      WHERE id = NEW.to_entity_id;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = '\''UPDATE'\'') THEN
    IF NEW.to_entity_type = '\''project'\'' AND OLD.status != NEW.status THEN
      IF OLD.status = '\''confirmed'\'' AND NEW.status != '\''confirmed'\'' THEN
        UPDATE projects
        SET
          raised_amount = GREATEST(0, COALESCE(raised_amount, 0) - OLD.amount_sats),
          contributor_count = CASE
            WHEN OLD.from_entity_type = '\''profile'\'' THEN GREATEST(0, COALESCE(contributor_count, 0) - 1)
            ELSE COALESCE(contributor_count, 0)
          END,
          updated_at = NOW()
        WHERE id = OLD.to_entity_id;
      END IF;

      IF NEW.status = '\''confirmed'\'' AND OLD.status != '\''confirmed'\'' THEN
        UPDATE projects
        SET
          raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
          contributor_count = CASE
            WHEN NEW.from_entity_type = '\''profile'\'' THEN COALESCE(contributor_count, 0) + 1
            ELSE COALESCE(contributor_count, 0)
          END,
          updated_at = NOW()
        WHERE id = NEW.to_entity_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = '\''DELETE'\'') THEN
    IF OLD.to_entity_type = '\''project'\'' AND OLD.status = '\''confirmed'\'' THEN
      UPDATE projects
      SET
        raised_amount = GREATEST(0, COALESCE(raised_amount, 0) - OLD.amount_sats),
        contributor_count = CASE
          WHEN OLD.from_entity_type = '\''profile'\'' THEN GREATEST(0, COALESCE(contributor_count, 0) - 1)
          ELSE COALESCE(contributor_count, 0)
        END,
        updated_at = NOW()
      WHERE id = OLD.to_entity_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;'

curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "{\"query\": $(echo "$SQL_FUNC" | jq -Rs .)}" | jq '.'

echo ""

# Part 3: Create trigger
echo "📝 Step 3: Creating trigger..."
curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TRIGGER transaction_funding_sync AFTER INSERT OR UPDATE OF status, amount_sats OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION sync_project_funding();"}' | jq '.'

echo ""

# Part 4: Backfill existing data
echo "📝 Step 4: Backfilling existing projects..."
BACKFILL_SQL='UPDATE projects p
SET
  raised_amount = COALESCE((
    SELECT SUM(amount_sats)
    FROM transactions
    WHERE to_entity_type = '\''project'\''
      AND to_entity_id = p.id
      AND status = '\''confirmed'\''
  ), 0),
  contributor_count = COALESCE((
    SELECT COUNT(DISTINCT from_entity_id)
    FROM transactions
    WHERE to_entity_type = '\''project'\''
      AND to_entity_id = p.id
      AND status = '\''confirmed'\''
      AND from_entity_type = '\''profile'\''
  ), 0),
  updated_at = NOW();'

curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "{\"query\": $(echo "$BACKFILL_SQL" | jq -Rs .)}" | jq '.'

echo ""

# Verify trigger exists
echo "🔍 Verifying trigger..."
curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_name = '\''transaction_funding_sync'\''"}' | jq '.'

echo ""
echo "✅ Migration complete!"
echo ""
echo "🎉 The trigger is now active. Future transactions will auto-update raised_amount!"
