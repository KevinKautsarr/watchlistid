-- ========================================================
-- WATCHLIST ID - REVOKE UNNECESSARY RPC EXECUTE PERMISSIONS
-- ========================================================
-- Found via `supabase db advisors --linked --type security`
-- (anon_security_definer_function_executable /
-- authenticated_security_definer_function_executable). All 13 SECURITY
-- DEFINER functions were executable via `/rest/v1/rpc/<name>` by both
-- `anon` and `authenticated` by default (Postgres grants EXECUTE on new
-- functions to PUBLIC unless revoked). Every function already checks
-- auth.uid() internally where relevant, so this was not an active
-- exploit — but tightening EXECUTE grants is defense-in-depth: a bug in
-- future function logic fails closed at the permission layer instead of
-- relying solely on application logic.
--
-- Classification (verified by grepping client call sites — see
-- context/FavoritesContext.tsx, AuthContext.tsx, LogContext.tsx,
-- ReviewContext.tsx, and hooks/useMovieDetail.ts):
--
-- 1) TRIGGER-ONLY functions — never called manually via RPC, only fire
--    automatically from `on ... trigger`. Revoked from BOTH anon and
--    authenticated; there is no legitimate reason to call these directly.
--      handle_new_user, notify_new_follow, notify_review_comment,
--      notify_review_like, trim_recently_viewed, check_forbidden_username
--
-- 2) PUBLIC READ RPC — called from the movie detail screen, which guests
--    can view without logging in (community rating must still show for
--    anonymous visitors). Kept executable by anon.
--      get_avg_rating
--
-- 3) AUTHENTICATED-ONLY RPC — every client call site requires an active
--    session (behind a `if (!user) return` guard or similar). Revoked
--    from anon, kept for authenticated.
--      add_favorite, delete_user_account, move_favorite,
--      reorder_favorites, toggle_review_like, get_profile_analytics
--      (get_profile_analytics has no current client call site, but takes
--      a user id and returns their data — restricting it to authenticated
--      is the safe default rather than leaving it open to anon).

-- ── Category 1: trigger-only, no legitimate direct-RPC use case ──────────
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.notify_new_follow() from anon, authenticated;
revoke execute on function public.notify_review_comment() from anon, authenticated;
revoke execute on function public.notify_review_like() from anon, authenticated;
revoke execute on function public.trim_recently_viewed() from anon, authenticated;
revoke execute on function public.check_forbidden_username() from anon, authenticated;

-- ── Category 3: must stay logged-in only ──────────────────────────────────
revoke execute on function public.add_favorite(integer, text, text, text) from anon;
revoke execute on function public.delete_user_account() from anon;
revoke execute on function public.move_favorite(integer, text) from anon;
revoke execute on function public.reorder_favorites(integer[]) from anon;
revoke execute on function public.toggle_review_like(uuid) from anon;
revoke execute on function public.get_profile_analytics(uuid) from anon;

-- ── Category 2: get_avg_rating(integer) — intentionally left untouched.
-- No revoke statement: guests must still be able to fetch community
-- ratings on public movie detail pages.
