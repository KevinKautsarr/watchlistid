-- ========================================================
-- WATCHLIST ID - SPLIT ALL POLICIES TO ELIMINATE SELECT OVERLAP
-- ========================================================
-- Found via `supabase db advisors --linked --type performance`
-- (multiple_permissive_policies), remaining 19 findings after the
-- duplicate cleanup in 20260703000006. All 19 come from the same
-- pattern on 4 tables: an owner-facing `ALL` policy sits alongside a
-- separate public `SELECT` policy. `ALL` implicitly covers SELECT too,
-- so Postgres evaluates BOTH policies on every SELECT query — wasted
-- work, since the public SELECT policy (`qual = true`) already covers
-- everyone, owners included.
--
-- Fix: replace each `ALL` policy with three policies covering only
-- INSERT/UPDATE/DELETE (never SELECT). This changes zero access
-- behavior — every owner action that worked before still works, and
-- SELECT continues to be governed solely by the existing public policy
-- — it just removes the redundant evaluation path.
--
-- These new policies also wrap auth.uid() as (select auth.uid()), which
-- addresses the same Advisor's `auth_rls_initplan` finding for these
-- rows at the same time: it lets Postgres evaluate auth.uid() ONCE per
-- query (via an InitPlan) instead of re-evaluating it for every row
-- scanned. See migration 20260703000008 for the rest of the
-- auth_rls_initplan fixes on policies that already existed as
-- INSERT/UPDATE/DELETE/SELECT (not part of an ALL policy).
--
-- affected tables: favorites, movie_logs, review_likes, tv_episode_logs

-- ── favorites ──────────────────────────────────────────────────────────
drop policy if exists "Users manage own favorites" on public.favorites;

create policy "favorites: insert own"
on public.favorites for insert
with check ((select auth.uid()) = user_id);

create policy "favorites: update own"
on public.favorites for update
using ((select auth.uid()) = user_id);

create policy "favorites: delete own"
on public.favorites for delete
using ((select auth.uid()) = user_id);

-- ── movie_logs ─────────────────────────────────────────────────────────
drop policy if exists "Users can manage their own logs" on public.movie_logs;

create policy "movie_logs: insert own"
on public.movie_logs for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "movie_logs: update own"
on public.movie_logs for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "movie_logs: delete own"
on public.movie_logs for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ── review_likes ───────────────────────────────────────────────────────
drop policy if exists "Users can manage their own likes" on public.review_likes;

create policy "review_likes: insert own"
on public.review_likes for insert
with check ((select auth.uid()) = user_id);

create policy "review_likes: update own"
on public.review_likes for update
using ((select auth.uid()) = user_id);

create policy "review_likes: delete own"
on public.review_likes for delete
using ((select auth.uid()) = user_id);

-- ── tv_episode_logs ────────────────────────────────────────────────────
drop policy if exists "Users can manage their own episode logs" on public.tv_episode_logs;

create policy "tv_episode_logs: insert own"
on public.tv_episode_logs for insert
with check ((select auth.uid()) = user_id);

create policy "tv_episode_logs: update own"
on public.tv_episode_logs for update
using ((select auth.uid()) = user_id);

create policy "tv_episode_logs: delete own"
on public.tv_episode_logs for delete
using ((select auth.uid()) = user_id);
