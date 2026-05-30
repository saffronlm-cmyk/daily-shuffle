-- Enable Row Level Security on the public tables.
--
-- Context: the app talks to Supabase from the browser using the public `anon`
-- key (hardcoded in index.html). With RLS disabled, anyone with that key could
-- read or modify every row — which is how some `recipes` rows had their
-- ingredient text wiped. RLS by role can't distinguish "the app" from an
-- attacker here (both are `anon`), so the meaningful win is making the shared
-- recipe library read-only while keeping the keyless personal-sync table usable.
--
-- recipes      -> public read-only (anon SELECT of `ready` rows; no writes).
--                 Curation goes through the service_role key, which bypasses RLS.
-- user_library -> anon read+write (SELECT/INSERT/UPDATE) so keyless sync keeps
--                 working. The "always true" INSERT/UPDATE checks are inherent
--                 to having no authentication; the real fix is Supabase Auth.

-- ─── recipes: public read-only curated library ───────────────────────────────
alter table public.recipes enable row level security;

drop policy if exists "Public can read ready recipes" on public.recipes;
create policy "Public can read ready recipes"
  on public.recipes
  for select
  to anon, authenticated
  using (import_status = 'ready');
-- No INSERT/UPDATE/DELETE policies => those operations are denied for anon.

-- ─── user_library: personal sync blob, anon read+write (no auth yet) ─────────
alter table public.user_library enable row level security;

drop policy if exists "Anon can read library" on public.user_library;
create policy "Anon can read library"
  on public.user_library
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anon can insert library" on public.user_library;
create policy "Anon can insert library"
  on public.user_library
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anon can update library" on public.user_library;
create policy "Anon can update library"
  on public.user_library
  for update
  to anon, authenticated
  using (true)
  with check (true);
