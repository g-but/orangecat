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
    insert into public.profiles (id, username, email)
    values (new.id, new.email, new.email);
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