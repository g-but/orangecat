-- TEMPORARY TEST: Bypass RLS to verify schema works
-- This temporarily disables RLS to test that the database schema is correct

-- Temporarily disable RLS on user_services for testing
ALTER TABLE user_services DISABLE ROW LEVEL SECURITY;

-- Test insert
INSERT INTO user_services (user_id, title, description, category, fixed_price_sats, currency, status)
VALUES ('366a5c5b-277c-47ea-8cef-507d5092f923', 'Car Repair Service Test', 'Testing database schema', 'Other', 100000, 'SATS', 'draft');

-- Check if insert worked
SELECT id, title, category, fixed_price_sats FROM user_services WHERE title LIKE '%Test%';

-- Re-enable RLS
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
