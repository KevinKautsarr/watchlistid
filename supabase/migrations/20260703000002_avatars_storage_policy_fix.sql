-- ========================================================
-- WATCHLIST ID - FIX AVATARS STORAGE POLICIES (OWNERSHIP + LISTING)
-- ========================================================
-- Found via `supabase db advisors --linked --type security`
-- (public_bucket_allows_listing) and confirmed by inspecting
-- pg_policies directly: all 4 policies on the `avatars` bucket only
-- checked `bucket_id = 'avatars'`, with NO ownership check at all.
--
-- Concrete impact of the OLD policies:
--   - avatars_insert_policy (authenticated): any logged-in user could
--     upload into ANY other user's folder, e.g. `{victim_id}/x.jpg`.
--   - avatars_update_policy (authenticated): any logged-in user could
--     overwrite any other user's avatar file.
--   - avatars_delete_policy (authenticated): any logged-in user could
--     delete any other user's avatar file.
--   - avatars_select_policy (public): allowed listing the entire
--     bucket's contents, not just reading a known file by path.
--
-- Client upload path is `{user.id}/{timestamp}.{ext}` (see
-- hooks/useProfileData.tsx), so ownership is enforced by checking that
-- the first path segment equals the caller's auth.uid().
--
-- IMPORTANT — public readability is intentionally preserved: avatars are
-- shown to other users throughout the app (profile pages, activity feed,
-- etc.) via `supabase.storage.from('avatars').getPublicUrl(path)`. Per
-- Supabase's own docs, public bucket object URLs are served through a
-- public CDN path and do NOT require a SELECT RLS policy to work — so
-- SELECT is simply dropped (not narrowed), which fixes the "list entire
-- bucket" exposure while leaving direct-URL avatar reads unaffected.

drop policy if exists "avatars_select_policy" on storage.objects;
drop policy if exists "avatars_insert_policy" on storage.objects;
drop policy if exists "avatars_update_policy" on storage.objects;
drop policy if exists "avatars_delete_policy" on storage.objects;

create policy "avatars_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- No SELECT policy is (re)created — see comment above. If avatar images
-- stop loading after this migration, the bucket's public/private toggle
-- may need to be checked in Supabase Dashboard → Storage → avatars →
-- "Public bucket" (should already be ON, since the app relies on
-- getPublicUrl()). Re-verify with:
--   select id, public from storage.buckets where id = 'avatars';
