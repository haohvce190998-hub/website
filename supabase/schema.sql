-- Enable extensions
create extension if not exists "pgcrypto";

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'organizer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own full name only"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Trigger create profile after auth signup
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

-- Helper: check admin/organizer role
create or replace function public.is_admin_or_organizer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'organizer')
  );
$$;

-- =========================
-- EVENTS / GAMESHOWS
-- =========================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date timestamptz,
  location text not null default '',
  capacity integer not null check (capacity > 0),
  ticket_price numeric(12,2) not null default 0,
  video_url text,
  cloudinary_public_id text,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Anyone can view published events"
on public.events for select
using (is_published = true or public.is_admin_or_organizer());

create policy "Admins can insert events"
on public.events for insert
with check (public.is_admin_or_organizer());

create policy "Admins can update events"
on public.events for update
using (public.is_admin_or_organizer())
with check (public.is_admin_or_organizer());

create policy "Admins can delete events"
on public.events for delete
using (public.is_admin_or_organizer());

-- =========================
-- TICKETS
-- =========================
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.tickets enable row level security;

create policy "Customers can view own tickets"
on public.tickets for select
using (auth.uid() = user_id or public.is_admin_or_organizer());

create policy "Admins can update tickets"
on public.tickets for update
using (public.is_admin_or_organizer())
with check (public.is_admin_or_organizer());

-- Customers do not insert directly. They use RPC buy_ticket.

-- Atomic ticket reservation/purchase function
create or replace function public.buy_ticket(p_event_id uuid)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_sold_count integer;
  v_ticket public.tickets;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id and is_published = true
  for update;

  if not found then
    raise exception 'Event not found or not published.';
  end if;

  if exists (
    select 1 from public.tickets
    where event_id = p_event_id
    and user_id = auth.uid()
    and status <> 'cancelled'
  ) then
    raise exception 'You already have a ticket for this event.';
  end if;

  select count(*) into v_sold_count
  from public.tickets
  where event_id = p_event_id
  and status <> 'cancelled';

  if v_sold_count >= v_event.capacity then
    raise exception 'Tickets are sold out.';
  end if;

  insert into public.tickets (event_id, user_id, status)
  values (p_event_id, auth.uid(), 'confirmed')
  returning * into v_ticket;

  return v_ticket;
end;
$$;

grant execute on function public.buy_ticket(uuid) to authenticated;

-- Admin view for ticket counts
create or replace view public.event_ticket_stats as
select
  e.id as event_id,
  e.title,
  e.capacity,
  count(t.id) filter (where t.status <> 'cancelled') as sold_count,
  greatest(e.capacity - count(t.id) filter (where t.status <> 'cancelled'), 0) as remaining_count
from public.events e
left join public.tickets t on t.event_id = e.id
group by e.id, e.title, e.capacity;

grant select on public.event_ticket_stats to anon, authenticated;
