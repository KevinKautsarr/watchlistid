-- ========================================================
-- WATCHLIST ID - FIX 4 INSERT POLICIES MISSED IN 20260703000008
-- ========================================================
-- 20260703000008 wrapped auth.uid() on the SELECT/UPDATE/DELETE policies
-- for reviews, review_comments, user_ratings, and watchlist, but missed
-- each table's INSERT policy (same with_check = auth.uid() = user_id
-- pattern). Re-running the Security Advisor afterwards caught the 4
-- that were left unwrapped.
--
-- Same fix as before: drop + recreate with (select auth.uid()), no
-- change to access logic.

drop policy if exists "watchlist: insert own" on public.watchlist;
create policy "watchlist: insert own"
on public.watchlist for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "user_ratings: insert own" on public.user_ratings;
create policy "user_ratings: insert own"
on public.user_ratings for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own reviews" on public.reviews;
create policy "Users can insert own reviews"
on public.reviews for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own comments" on public.review_comments;
create policy "Users can insert own comments"
on public.review_comments for insert
with check ((select auth.uid()) = user_id);
