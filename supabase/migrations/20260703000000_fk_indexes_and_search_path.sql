-- ========================================================
-- WATCHLIST ID - MISSING FK INDEXES & SECURITY DEFINER search_path FIX
-- Jalankan via `supabase db push` ATAU tempel ke Supabase SQL Editor.
-- Semua statement di sini adalah metadata-only (CREATE INDEX / ALTER
-- FUNCTION) — tidak mengubah baris data apa pun, aman untuk produksi.
-- Index dibuat dengan lock singkat (bukan CONCURRENTLY — lihat catatan
-- di Bagian 1) karena tabel-tabel ini masih kecil.
-- ========================================================

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 1: INDEX YANG HILANG PADA FOREIGN KEY
-- ────────────────────────────────────────────────────────────────
-- Postgres TIDAK otomatis membuat index untuk foreign key (beda dari
-- primary key). Tanpa index, setiap query `WHERE user_id = ...` pada
-- tabel-tabel ini melakukan sequential scan, dan setiap `ON DELETE
-- CASCADE` dari profiles/reviews juga harus scan penuh tabel anak untuk
-- menemukan baris yang harus dihapus. Dampaknya makin terasa seiring
-- data bertambah — di volume kecil belum terasa, tapi ini utang teknis
-- yang sebaiknya dibayar sebelum jadi masalah nyata.
--
-- NOTE: CREATE INDEX CONCURRENTLY (which avoids locking the table while the
-- index builds) cannot run inside a transaction block, and the Supabase SQL
-- Editor always wraps each "Run" in one — so plain CREATE INDEX is used here.
-- These tables are still small, so the brief lock is not a concern; if they
-- grow large before this runs, build the CONCURRENTLY versions manually one
-- statement at a time instead (outside a transaction, e.g. via `psql` or the
-- Supabase CLI's `db execute`).

create index if not exists idx_favorites_user_id
  on public.favorites(user_id);

create index if not exists idx_tv_episode_logs_user_id
  on public.tv_episode_logs(user_id);

create index if not exists idx_review_likes_user_id
  on public.review_likes(user_id);

create index if not exists idx_review_likes_review_id
  on public.review_likes(review_id);

create index if not exists idx_review_comments_user_id
  on public.review_comments(user_id);

create index if not exists idx_review_comments_review_id
  on public.review_comments(review_id);

create index if not exists idx_notifications_actor_id
  on public.notifications(actor_id);


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 2: SET search_path PADA SEMUA FUNGSI SECURITY DEFINER
-- ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER menjalankan fungsi dengan hak akses PEMBUATNYA, bukan
-- pemanggilnya. Tanpa `SET search_path` yang eksplisit, resolusi nama
-- objek di dalam fungsi bergantung pada search_path SESI PEMANGGIL —
-- ini celah privilege-escalation klasik di Postgres (seseorang yang bisa
-- membuat objek bernama sama di schema lain pada search_path bisa
-- membajak fungsi ini untuk berjalan dengan objek palsunya).
--
-- Di Supabase, permission untuk membuat objek di schema `public` sudah
-- dibatasi ketat secara default, jadi risiko eksploitasi langsung di
-- proyek ini rendah — tapi ini tetap best practice standar Postgres, dan
-- Supabase Security Advisor akan menandai fungsi tanpa search_path
-- sebagai warning. `SET search_path = public, pg_temp` mengunci resolusi
-- nama hanya ke schema public (dan pg_temp untuk tabel temporer sesi),
-- menutup celah ini sepenuhnya.

alter function public.trim_recently_viewed() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.get_avg_rating(integer) set search_path = public, pg_temp;
alter function public.toggle_review_like(uuid) set search_path = public, pg_temp;
alter function public.notify_review_comment() set search_path = public, pg_temp;
alter function public.get_profile_analytics(uuid) set search_path = public, pg_temp;
alter function public.add_favorite(integer, text, text, text) set search_path = public, pg_temp;
alter function public.reorder_favorites(integer[]) set search_path = public, pg_temp;
alter function public.move_favorite(integer, text) set search_path = public, pg_temp;
alter function public.check_forbidden_username() set search_path = public, pg_temp;
alter function public.delete_user_account() set search_path = public, pg_temp;
