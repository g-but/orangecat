-- Create initial profile for existing user
do $$
declare
  v_user_id uuid;
begin
  -- Get the user ID for the email
  select id into v_user_id
  from auth.users
  where email = 'mao@gmail.com'
  limit 1;

  -- Create profile if it doesn't exist
  if v_user_id is not null and not exists (
    select 1 from public.profiles where id = v_user_id
  ) then
    insert into public.profiles (id, username, email)
    values (v_user_id, 'mao', 'mao@gmail.com');
  end if;
end $$; 