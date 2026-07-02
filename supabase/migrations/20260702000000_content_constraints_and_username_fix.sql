-- ========================================================
-- WATCHLIST ID - CONTENT CONSTRAINTS & USERNAME COLLISION FIX
-- Jalankan ini melalui `supabase db push` (setelah baseline migrasi
-- sebelumnya) ATAU tempel langsung ke Supabase SQL Editor.
-- ========================================================

-- ────────────────────────────────────────────────────────────────
-- BAGIAN 0: CEK DATA LAMA SEBELUM MENAMBAH CONSTRAINT
-- ────────────────────────────────────────────────────────────────
-- Jalankan dulu 4 SELECT di bawah ini secara terpisah. Kalau ada baris
-- yang muncul, constraint di Bagian 1 akan GAGAL sampai data itu
-- dirapikan (mis. dipotong manual) atau limitnya kamu naikkan.
--
-- select id, char_length(content) from public.reviews where char_length(content) > 5000;
-- select id, char_length(content) from public.review_comments where char_length(content) > 1000;
-- select id, char_length(review_text) from public.movie_logs where char_length(review_text) > 5000;
-- select id, char_length(bio) from public.profiles where char_length(bio) > 150;
-- select id, username, char_length(username) from public.profiles where char_length(username) not between 3 and 30;


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 1: CHECK CONSTRAINT PANJANG KONTEN
-- ────────────────────────────────────────────────────────────────
-- Mencegah payload sangat besar dikirim langsung lewat API/RPC,
-- melewati batas yang selama ini hanya divalidasi di klien (TextInput).

alter table public.reviews
  drop constraint if exists reviews_content_length;
alter table public.reviews
  add constraint reviews_content_length
  check (char_length(content) between 1 and 5000);

alter table public.review_comments
  drop constraint if exists review_comments_content_length;
alter table public.review_comments
  add constraint review_comments_content_length
  check (char_length(content) between 1 and 1000);

alter table public.movie_logs
  drop constraint if exists movie_logs_review_text_length;
alter table public.movie_logs
  add constraint movie_logs_review_text_length
  check (review_text is null or char_length(review_text) <= 5000);

alter table public.profiles
  drop constraint if exists profiles_bio_length;
alter table public.profiles
  add constraint profiles_bio_length
  check (bio is null or char_length(bio) <= 150);

-- Username sudah divalidasi format 3-30 karakter di RegisterScreen.tsx,
-- tapi belum ditegakkan di database — lewat API langsung batas ini bisa
-- dilewati.
alter table public.profiles
  drop constraint if exists profiles_username_length;
alter table public.profiles
  add constraint profiles_username_length
  check (char_length(username) between 3 and 30);


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 2: FIX handle_new_user — COLLISION USERNAME SAAT SIGNUP
-- ────────────────────────────────────────────────────────────────
-- Masalah lama: fallback username dari split_part(email, '@', 1) bisa
-- collide antar-user (mis. budi@gmail.com vs budi@yahoo.com), lalu
-- INSERT gagal karena `username unique` → trigger error → SIGNUP KEDUA
-- GAGAL TOTAL meski akun auth.users-nya sudah terlanjur dibuat oleh
-- Supabase Auth (menyisakan akun "yatim" tanpa profile).
--
-- Perbaikan: kalau username dasar sudah dipakai, coba tambahkan suffix
-- angka (budi2, budi3, ...) hingga 20 percobaan; kalau masih gagal,
-- fallback ke potongan UUID supaya signup TIDAK PERNAH gagal karena ini.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_base_username text;
  v_candidate      text;
  v_suffix         int := 1;
  v_max_attempts    constant int := 20;
begin
  v_base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Bersihkan karakter di luar aturan RegisterScreen.tsx (huruf, angka,
  -- titik, underscore, strip) supaya fallback dari full_name/email tidak
  -- pernah menghasilkan username yang lolos di sini tapi ditolak di app.
  v_base_username := lower(regexp_replace(v_base_username, '[^a-zA-Z0-9._-]', '', 'g'));
  if v_base_username is null or length(v_base_username) < 3 then
    v_base_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  v_base_username := left(v_base_username, 30);

  v_candidate := v_base_username;

  loop
    begin
      insert into public.profiles (id, username, avatar_url)
      values (new.id, v_candidate, new.raw_user_meta_data->>'avatar_url');
      exit; -- berhasil, keluar dari loop
    exception when unique_violation then
      v_suffix := v_suffix + 1;
      if v_suffix > v_max_attempts then
        -- Jalan terakhir: suffix acak dari sisa UUID, hampir mustahil collide.
        v_candidate := left(v_base_username, 23) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
      else
        v_candidate := left(v_base_username, 27) || v_suffix::text;
      end if;
    end;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger-nya sudah ada (on_auth_user_created di auth.users), tidak perlu
-- dibuat ulang karena kita hanya mengganti isi fungsinya lewat CREATE OR REPLACE.


-- ────────────────────────────────────────────────────────────────
-- BAGIAN 3: SAMAKAN FILTER FORBIDDEN USERNAME (klien vs database)
-- ────────────────────────────────────────────────────────────────
-- Masalah lama: RegisterScreen.tsx menolak username yang MENGANDUNG kata
-- terlarang (mis. "admin_official123"), tapi trigger DB cuma menolak
-- KECOCOKAN PERSIS ("admin"). Lewat API langsung / kalau ada jalur signup
-- lain, username seperti "official_admin_2" tetap lolos ke database.

create or replace function public.check_forbidden_username()
returns trigger as $$
declare
  v_forbidden text[] := array[
    'admin','root','watchlistid','system','moderator','owner',
    'official','support','staff','administrator','mod'
  ];
  v_word text;
begin
  foreach v_word in array v_forbidden loop
    if position(v_word in lower(new.username)) > 0 then
      raise exception 'Username tidak diizinkan untuk alasan keamanan.';
    end if;
  end loop;
  return new;
end;
$$ language plpgsql;

-- Trigger enforce_forbidden_usernames sudah ada di profiles (BEFORE INSERT
-- OR UPDATE); CREATE OR REPLACE di atas otomatis dipakai olehnya.
--
-- CATATAN: handle_new_user() di Bagian 2 memakai `security definer` dan
-- berjalan lewat trigger on_auth_user_created di tabel auth.users, SETELAH
-- itu trigger enforce_forbidden_usernames di profiles tetap berjalan pada
-- INSERT tersebut — jadi signup dengan fallback yang mengandung kata
-- terlarang tetap akan gagal sebagaimana mestinya (fail loudly), bukan
-- lolos diam-diam.
