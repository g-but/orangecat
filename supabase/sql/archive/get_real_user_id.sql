-- Get the real authenticated user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%provider@test.orangecat%'
ORDER BY created_at DESC 
LIMIT 1;
