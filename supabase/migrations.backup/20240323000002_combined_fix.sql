-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users can delete their own profile" on profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read any profile
create policy "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Create policy to allow users to insert their own profile
create policy "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Create policy to allow users to delete their own profile
create policy "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create new function with better error handling
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile already exists
  if not exists (select 1 from public.profiles where id = new.id) then
    -- Create profile with email as initial username
    insert into public.profiles (
      id, 
      username,
      created_at,
      updated_at
    )
    values (
      new.id, 
      new.email,
      now(),
      now()
    );
  end if;
  return new;
exception
  when others then
    -- Log the error but don't fail the transaction
    raise warning 'Error creating profile for user %: %', new.id, SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Create new trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add comment to explain the trigger
comment on function public.handle_new_user() is 'Creates a profile for new users with their email as initial username';

-- Create initial profile for existing user
do $$
declare
  v_user_id uuid;
begin
  -- Get the user ID for the email
  select id into v_user_id
  from auth.users
  where email = 'butaeff@gmail.com'
  limit 1;

  -- Create profile if it doesn't exist
  if v_user_id is not null and not exists (
    select 1 from public.profiles where id = v_user_id
  ) then
    insert into public.profiles (
      id, 
      username,
      created_at,
      updated_at
    )
    values (
      v_user_id, 
      'butaeff',
      now(),
      now()
    );
  end if;
end $$; 