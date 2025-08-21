-- Update the handle_new_user function to include email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
exception
  when others then
    raise warning 'Error creating profile for user %: %', new.id, SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Add email column to profiles if it doesn't exist
alter table public.profiles
add column if not exists email text;

-- Add policy to allow profile creation
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Add policy to allow profile deletion
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id); 