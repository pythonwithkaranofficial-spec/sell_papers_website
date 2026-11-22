-- BoardPrep Papers — initial schema.
-- Run in Supabase: Dashboard → SQL Editor → paste this file → Run. Then run supabase/seed.sql.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ catalog
create table if not exists public.subjects (
  id text primary key,                     -- e.g. class-12-physics
  class_level text not null check (class_level in ('10', '12')),
  slug text not null,
  name text not null,
  code text not null,
  stream text,
  sort_order int not null default 0,
  bundle_price_paise int not null default 99900 check (bundle_price_paise >= 100),
  is_bundle_on_sale boolean not null default true,
  unique (class_level, slug)
);

create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects (id) on delete cascade,
  set_no int not null check (set_no between 1 and 100),
  title text not null,                     -- "Paper 1 · Set 1"
  price_paise int not null default 4900 check (price_paise >= 100),
  is_published boolean not null default false, -- becomes true once its files are uploaded
  updated_at timestamptz not null default now(),
  unique (subject_id, set_no)
);

create table if not exists public.paper_files (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers (id) on delete cascade,
  kind text not null check (kind in ('docx', 'pdf', 'answer_key')),
  storage_path text not null,              -- path inside the private "papers" bucket
  file_name text not null,
  size_bytes bigint,
  uploaded_at timestamptz not null default now(),
  unique (paper_id, kind)
);

-- ------------------------------------------------------------------ commerce
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('paper', 'subject')),
  paper_id uuid references public.papers (id),
  subject_id text references public.subjects (id),
  amount_paise int not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((item_type = 'paper' and paper_id is not null) or (item_type = 'subject' and subject_id is not null))
);

-- A purchase grants access either to one set (paper_id) or to a whole subject (subject_id).
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id),
  paper_id uuid references public.papers (id),
  subject_id text references public.subjects (id),
  created_at timestamptz not null default now(),
  check (paper_id is not null or subject_id is not null)
);
create unique index if not exists purchases_user_paper on public.purchases (user_id, paper_id) where paper_id is not null;
create unique index if not exists purchases_user_subject on public.purchases (user_id, subject_id) where subject_id is not null;

create index if not exists papers_subject on public.papers (subject_id, set_no);
create index if not exists orders_user on public.orders (user_id, created_at desc);

-- ------------------------------------------------------------------ row level security
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.papers enable row level security;
alter table public.paper_files enable row level security;
alter table public.orders enable row level security;
alter table public.purchases enable row level security;

-- catalog is public to read (file metadata only — the files themselves are in a private bucket)
drop policy if exists "subjects readable" on public.subjects;
create policy "subjects readable" on public.subjects for select using (true);
drop policy if exists "papers readable" on public.papers;
create policy "papers readable" on public.papers for select using (true);
drop policy if exists "paper files readable" on public.paper_files;
create policy "paper files readable" on public.paper_files for select using (true);

-- users read only their own profile, orders and purchases; all writes go through the server (service role)
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "own purchases" on public.purchases;
create policy "own purchases" on public.purchases for select using (auth.uid() = user_id);

-- ------------------------------------------------------------------ storage (private bucket)
insert into storage.buckets (id, name, public, file_size_limit)
values ('papers', 'papers', false, 52428800)
on conflict (id) do update set public = false;
-- No storage policies are created on purpose: only the server (service role) can read or write,
-- and buyers receive short-lived signed download links after their purchase is checked.
