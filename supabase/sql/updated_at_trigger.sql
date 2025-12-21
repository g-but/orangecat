-- Updated_at trigger function and triggers for core tables
-- Safe to run multiple times; existence is checked per trigger

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to create trigger if not exists
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY[
    'projects', 'user_products', 'user_services', 'assets', 'loans', 'loan_offers', 'loan_payments', 'messages'
  ]) AS tbl LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.tgname = format('trg_set_updated_at_%s', r.tbl)
        AND n.nspname = 'public'
        AND c.relname = r.tbl
    ) THEN
      EXECUTE format('CREATE TRIGGER trg_set_updated_at_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();', r.tbl, r.tbl);
    END IF;
  END LOOP;
END$$;

