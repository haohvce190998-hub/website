-- Run once in Supabase SQL Editor.
-- Creates secure roles and limits souvenir catalog writes to admins.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

insert into public.profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  'customer'
from auth.users
on conflict (id) do nothing;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins insert souvenir catalog" on storage.objects;
create policy "Admins insert souvenir catalog"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'VIDEOS'
  and name = 'souvenirs.json'
  and public.is_admin()
);

drop policy if exists "Admins update souvenir catalog" on storage.objects;
create policy "Admins update souvenir catalog"
on storage.objects for update
to authenticated
using (
  bucket_id = 'VIDEOS'
  and name = 'souvenirs.json'
  and public.is_admin()
)
with check (
  bucket_id = 'VIDEOS'
  and name = 'souvenirs.json'
  and public.is_admin()
);

drop policy if exists "Admins delete souvenir catalog" on storage.objects;
create policy "Admins delete souvenir catalog"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'VIDEOS'
  and name = 'souvenirs.json'
  and public.is_admin()
);

-- After creating your Auth user, replace the email and run this separately:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
