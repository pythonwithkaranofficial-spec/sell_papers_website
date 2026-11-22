-- Table privileges (newer Supabase projects do not grant these automatically).
-- Row Level Security from 0001_init.sql still decides WHICH rows each user can see.

grant usage on schema public to anon, authenticated, service_role;

-- catalogue: anyone may read
grant select on public.subjects, public.papers, public.paper_files to anon, authenticated;

-- signed-in users: their own profile, orders and purchases (filtered by RLS)
grant select on public.profiles, public.orders, public.purchases to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- the server (service role) manages everything
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
