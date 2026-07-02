-- ========================================================
-- WATCHLIST ID - FIX: PREVIOUS REVOKE DID NOT WORK (PUBLIC ROLE)
-- ========================================================
-- Migration 20260703000003 ran `revoke execute ... from anon` (and
-- `authenticated` for trigger-only functions), but re-running the
-- Security Advisor afterwards showed ALL 24 findings unchanged.
--
-- Root cause, confirmed directly against the database:
--   select has_function_privilege('public', <handle_new_user oid>, 'EXECUTE');
--   -> true
--
-- Postgres grants EXECUTE on every newly created function to the PUBLIC
-- pseudo-role by default. `anon` and `authenticated` are regular roles
-- that (like every role) implicitly inherit PUBLIC's privileges — so
-- revoking from `anon`/`authenticated` directly does nothing as long as
-- PUBLIC still has EXECUTE. The fix is to revoke from PUBLIC explicitly,
-- then re-grant only to the roles that should actually have access.

-- ── Category 1: trigger-only — revoke from PUBLIC entirely, grant to no one ──
-- (Postgres executes trigger functions as the function owner regardless
-- of caller privileges, so this does not affect the triggers themselves —
-- verified against PostgreSQL's CREATE TRIGGER docs and by the earlier
-- signup/notification flows continuing to work after 20260703000003.)
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.notify_new_follow() from public;
revoke execute on function public.notify_review_comment() from public;
revoke execute on function public.notify_review_like() from public;
revoke execute on function public.trim_recently_viewed() from public;
revoke execute on function public.check_forbidden_username() from public;

-- ── Category 2: get_avg_rating — revoke from PUBLIC, then explicitly
-- re-grant to both anon and authenticated (guests must still read
-- community ratings on public movie detail pages).
revoke execute on function public.get_avg_rating(integer) from public;
grant execute on function public.get_avg_rating(integer) to anon, authenticated;

-- ── Category 3: authenticated-only — revoke from PUBLIC, then re-grant
-- to authenticated only.
revoke execute on function public.add_favorite(integer, text, text, text) from public;
grant execute on function public.add_favorite(integer, text, text, text) to authenticated;

revoke execute on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;

revoke execute on function public.move_favorite(integer, text) from public;
grant execute on function public.move_favorite(integer, text) to authenticated;

revoke execute on function public.reorder_favorites(integer[]) from public;
grant execute on function public.reorder_favorites(integer[]) to authenticated;

revoke execute on function public.toggle_review_like(uuid) from public;
grant execute on function public.toggle_review_like(uuid) to authenticated;

revoke execute on function public.get_profile_analytics(uuid) from public;
grant execute on function public.get_profile_analytics(uuid) to authenticated;
