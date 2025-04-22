-- Function to enable RLS
create or replace function public.enable_rls(table_name text)
returns void as $$
begin
  execute format('alter table %I enable row level security', table_name);
end;
$$ language plpgsql security definer;

-- Function to create policies
create or replace function public.create_policy(
  policy_name text,
  table_name text,
  command text,
  using text default null,
  with_check text default null
)
returns void as $$
begin
  execute format(
    'create policy %I on %I for %s using (%s) %s',
    policy_name,
    table_name,
    command,
    coalesce(using, 'true'),
    case when with_check is not null then format('with check (%s)', with_check) else '' end
  );
end;
$$ language plpgsql security definer;

-- Function to create trigger function
create or replace function public.create_trigger_function()
returns void as $$
begin
  execute $func$
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    if not exists (select 1 from public.profiles where id = new.id) then
      insert into public.profiles (id, username, created_at, updated_at)
      values (new.id, new.email, now(), now());
    end if;
    return new;
  end;
  $$ language plpgsql security definer;
  $func$;
end;
$$ language plpgsql security definer;

-- Function to create trigger
create or replace function public.create_trigger()
returns void as $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
end;
$$ language plpgsql security definer; 