-- ========================================================
-- WATCHLIST ID - WRAP auth.uid() FOR RLS INITPLAN OPTIMIZATION
-- ========================================================
-- Found via `supabase db advisors --linked --type performance`
-- (auth_rls_initplan). Postgres re-evaluates a bare `auth.uid()` call
-- inside a RLS policy ONCE PER ROW scanned, because it cannot prove the
-- function is stable across the scan. Wrapping it as `(select auth.uid())`
-- turns it into an InitPlan that Postgres evaluates ONCE per query and
-- reuses for every row — same result, meaningfully cheaper at scale.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- This migration only rewrites the qual/with_check expression syntax —
-- the access logic (who can do what) is byte-for-byte unchanged. Policies
-- belonging to `favorites`, `movie_logs`, `review_likes`, and
-- `tv_episode_logs` are handled by migration 20260703000007 instead
-- (they were being restructured there anyway, so the wrap was applied
-- directly rather than touched twice).
--
-- Postgres has no `CREATE OR REPLACE POLICY`, so each policy below is
-- dropped and recreated with an identical definition except for the
-- auth.uid() wrapping.

-- ── favorites ──────────────────────────────────────────────────────────
-- (ALL/INSERT/UPDATE/DELETE handled in 20260703000007; nothing else here)

-- ── follows ────────────────────────────────────────────────────────────
drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
on public.follows for delete
using ((select auth.uid()) = follower_id);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
on public.follows for insert
with check ((select auth.uid()) = follower_id);

-- ── notifications ──────────────────────────────────────────────────────
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
using ((select auth.uid()) = user_id);

-- ── profiles ───────────────────────────────────────────────────────────
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using ((select auth.uid()) = id);

-- ── recently_viewed ────────────────────────────────────────────────────
drop policy if exists "recently_viewed: delete own" on public.recently_viewed;
create policy "recently_viewed: delete own"
on public.recently_viewed for delete
using ((select auth.uid()) = user_id);

drop policy if exists "recently_viewed: insert own" on public.recently_viewed;
create policy "recently_viewed: insert own"
on public.recently_viewed for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "recently_viewed: select own" on public.recently_viewed;
create policy "recently_viewed: select own"
on public.recently_viewed for select
using ((select auth.uid()) = user_id);

drop policy if exists "recently_viewed: update own" on public.recently_viewed;
create policy "recently_viewed: update own"
on public.recently_viewed for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ── review_comments ────────────────────────────────────────────────────
drop policy if exists "Users can delete own comments" on public.review_comments;
create policy "Users can delete own comments"
on public.review_comments for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can update own comments" on public.review_comments;
create policy "Users can update own comments"
on public.review_comments for update
using ((select auth.uid()) = user_id);

-- ── reviews ────────────────────────────────────────────────────────────
drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
on public.reviews for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
on public.reviews for update
using ((select auth.uid()) = user_id);

-- ── user_ratings ───────────────────────────────────────────────────────
drop policy if exists "user_ratings: delete own" on public.user_ratings;
create policy "user_ratings: delete own"
on public.user_ratings for delete
using ((select auth.uid()) = user_id);

drop policy if exists "user_ratings: select own" on public.user_ratings;
create policy "user_ratings: select own"
on public.user_ratings for select
using ((select auth.uid()) = user_id);

drop policy if exists "user_ratings: update own" on public.user_ratings;
create policy "user_ratings: update own"
on public.user_ratings for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ── watchlist ──────────────────────────────────────────────────────────
drop policy if exists "watchlist: delete own" on public.watchlist;
create policy "watchlist: delete own"
on public.watchlist for delete
using ((select auth.uid()) = user_id);

drop policy if exists "watchlist: update own" on public.watchlist;
create policy "watchlist: update own"
on public.watchlist for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
