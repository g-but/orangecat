-- Add avatar_url column to profiles table if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' 
    and column_name = 'avatar_url'
    and table_schema = 'public'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;
end $$; 