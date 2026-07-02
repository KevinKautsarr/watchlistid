-- ========================================================
-- WATCHLIST ID - REMOVE DUPLICATE RLS POLICIES
-- ========================================================
-- Found via `supabase db advisors --linked --type performance`
-- (multiple_permissive_policies). Cross-referenced every policy against
-- migration history: policies with the exact same qual/with_check that
-- do NOT appear in any tracked migration file were almost certainly
-- created ad-hoc via the Supabase Dashboard at some point and left
-- duplicating an already-tracked policy. Postgres evaluates every
-- permissive policy for a given (table, role, action) on each query, so
-- these duplicates were pure wasted work with zero behavior difference
-- (both sides of each pair have an identical qual/with_check).
--
-- This migration ONLY removes exact duplicates — it does not change
-- what any policy allows. No access pattern changes.

-- ── favorites: exact duplicates, kept the versions tracked in
-- 20260602000000_favorites.sql ──────────────────────────────────────────
drop policy if exists "Users can manage their own favorites" on public.favorites;
drop policy if exists "Favorites are viewable by everyone" on public.favorites;

-- ── profiles: exact duplicates, kept the versions tracked in
-- 20260101000000_initial_schema.sql ─────────────────────────────────────
drop policy if exists "Profiles are public" on public.profiles;
drop policy if exists "Users can update their own profiles" on public.profiles;

-- ── movie_logs: the granular SELECT/INSERT/DELETE policies duplicated
-- what the pre-existing "Users can manage their own logs" (ALL) policy
-- already covered for the `authenticated` role (identical
-- `auth.uid() = user_id` check). Kept the ALL policy plus the public
-- SELECT policy (guests must still be able to view logs).
drop policy if exists "Users can view their own logs" on public.movie_logs;
drop policy if exists "Users can insert their own logs" on public.movie_logs;
drop policy if exists "Users can delete their own logs" on public.movie_logs;

-- ── watchlist: the ALL policy duplicated what the 4 granular policies
-- (tracked in 20260101000000_initial_schema.sql) already covered. Kept
-- the granular set since it's the one on record in migration history.
drop policy if exists "Users can manage their own watchlist" on public.watchlist;
