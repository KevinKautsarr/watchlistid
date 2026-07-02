-- ========================================================
-- WATCHLIST ID - search_path FIX FOR 2 FUNCTIONS MISSED EARLIER
-- ========================================================
-- The previous migration (20260703000000) fixed search_path on 11
-- SECURITY DEFINER functions found via manual grep. Running Supabase's
-- built-in Security Advisor afterwards (`supabase db advisors --linked
-- --type security`) caught 2 more that the manual audit missed:
-- notify_new_follow() and notify_review_like() — both trigger functions
-- with no parameters, defined in 20260101000000_initial_schema.sql.
--
-- Metadata-only change (ALTER FUNCTION), does not touch any data — safe
-- to run in production.

alter function public.notify_new_follow() set search_path = public, pg_temp;
alter function public.notify_review_like() set search_path = public, pg_temp;
