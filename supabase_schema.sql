-- ========================================================
-- WATCHLIST ID - SUPABASE DATABASE SCHEMA
-- Paste this entire code into the Supabase "SQL Editor"
-- ========================================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Allow anyone to view profiles (needed for social features)
create policy "Profiles are viewable by everyone" 
on profiles for select 
using ( true );

-- Allow users to update their own profile
create policy "Users can update own profile" 
on profiles for update 
using ( auth.uid() = id );


-- 2. Create Watchlist Table
create table public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  movie_id integer not null,
  title text not null,
  poster_path text,
  release_date text,
  vote_average numeric,
  runtime integer,
  genres jsonb,
  overview text,
  media_type text default 'movie',
  watched boolean default false not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate movies in the same user's watchlist
  unique(user_id, movie_id)
);

alter table public.watchlist enable row level security;

drop policy if exists "Watchlist is viewable by everyone" on public.watchlist;
drop policy if exists "Users can insert own watchlist" on public.watchlist;
drop policy if exists "Users can update own watchlist" on public.watchlist;
drop policy if exists "Users can delete own watchlist" on public.watchlist;
drop policy if exists "watchlist: select own" on public.watchlist;
drop policy if exists "watchlist: select public" on public.watchlist;
drop policy if exists "watchlist: insert own" on public.watchlist;
drop policy if exists "watchlist: update own" on public.watchlist;
drop policy if exists "watchlist: delete own" on public.watchlist;

create policy "watchlist: select public"
  on public.watchlist for select
  using ( true );

create policy "watchlist: insert own"
  on public.watchlist for insert
  with check ( auth.uid() = user_id );

create policy "watchlist: update own"
  on public.watchlist for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "watchlist: delete own"
  on public.watchlist for delete
  using ( auth.uid() = user_id );


-- 3. Create User Ratings Table
create table public.user_ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  movie_id integer not null,
  rating integer not null check (rating >= 1 and rating <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, movie_id)
);

alter table public.user_ratings enable row level security;

drop policy if exists "Users can manage their own ratings" on public.user_ratings;
drop policy if exists "user_ratings: select own" on public.user_ratings;
drop policy if exists "user_ratings: insert own" on public.user_ratings;
drop policy if exists "user_ratings: update own" on public.user_ratings;
drop policy if exists "user_ratings: delete own" on public.user_ratings;

create policy "user_ratings: select own"
  on public.user_ratings for select
  using ( auth.uid() = user_id );

create policy "user_ratings: insert own"
  on public.user_ratings for insert
  with check ( auth.uid() = user_id );

create policy "user_ratings: update own"
  on public.user_ratings for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "user_ratings: delete own"
  on public.user_ratings for delete
  using ( auth.uid() = user_id );


-- 4. Create Recently Viewed Table
create table public.recently_viewed (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  movie_id integer not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, movie_id)
);

alter table public.recently_viewed enable row level security;

drop policy if exists "Users can manage their own recently viewed" on public.recently_viewed;
drop policy if exists "recently_viewed: select own" on public.recently_viewed;
drop policy if exists "recently_viewed: insert own" on public.recently_viewed;
drop policy if exists "recently_viewed: update own" on public.recently_viewed;
drop policy if exists "recently_viewed: delete own" on public.recently_viewed;

create policy "recently_viewed: select own"
  on public.recently_viewed for select
  using ( auth.uid() = user_id );

create policy "recently_viewed: insert own"
  on public.recently_viewed for insert
  with check ( auth.uid() = user_id );

create policy "recently_viewed: update own"
  on public.recently_viewed for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "recently_viewed: delete own"
  on public.recently_viewed for delete
  using ( auth.uid() = user_id );

-- Auto-cleanup recently_viewed (max 50 per user)
create or replace function public.trim_recently_viewed()
returns trigger as $$
begin
  delete from public.recently_viewed
  where user_id = new.user_id
    and id not in (
      select id
        from public.recently_viewed
       where user_id = new.user_id
       order by viewed_at desc
       limit 50
    );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists limit_recently_viewed on public.recently_viewed;
create trigger limit_recently_viewed
  after insert on public.recently_viewed
  for each row execute function public.trim_recently_viewed();


-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up, automatically create a profile
-- ========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fix 7: Forbidden Usernames Trigger
CREATE OR REPLACE FUNCTION check_forbidden_username()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(NEW.username) = ANY(ARRAY['admin','root','watchlistid','system','moderator','owner','official','support','staff']) THEN
    RAISE EXCEPTION 'Username tidak diizinkan untuk alasan keamanan.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_forbidden_usernames
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_forbidden_username();


-- 5. Create Movie Logs Table (Diary)
create table public.movie_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  movie_id integer not null,
  media_type text default 'movie',
  movie_title text not null,
  poster_path text,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rating integer check (rating >= 1 and rating <= 10),
  review_text text,
  is_spoiler boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.movie_logs enable row level security;

create policy "Logs are viewable by everyone" 
on movie_logs for select 
using ( true );

create policy "Users can insert own logs" 
on movie_logs for insert 
with check ( auth.uid() = user_id );

create policy "Users can update own logs" 
on movie_logs for update 
using ( auth.uid() = user_id );

create policy "Users can delete own logs" 
on movie_logs for delete 
using ( auth.uid() = user_id );

-- ==========================================
-- SOCIAL SYSTEM (FOLLOWS)
-- ==========================================

-- Table to store user following relationships
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate follows
  unique(follower_id, following_id),
  
  -- Prevent self-following
  check (follower_id <> following_id)
);

-- Fix follows table cascade delete
ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_follower_id_fkey,
  DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_id_fkey
    FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT follows_following_id_fkey
    FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- Enable RLS
alter table public.follows enable row level security;

-- Policies
create policy "Follows are public" on follows for select using (true);

create policy "Users can follow others" on follows for insert 
with check (auth.uid() = follower_id);

create policy "Users can unfollow" on follows for delete 
using (auth.uid() = follower_id);


-- 6. Create Reviews Table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  movie_id integer not null,
  media_type text default 'movie' not null,
  content text not null, -- Markdown supported
  rating integer check (rating >= 1 and rating <= 10),
  is_spoiler boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- One official review per user per movie
  unique(user_id, movie_id)
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone" on reviews for select using (true);
create policy "Users can manage their own reviews" on reviews for all using (auth.uid() = user_id);

-- 7. Create Review Likes Table
create table public.review_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  review_id uuid references public.reviews(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, review_id)
);

alter table public.review_likes enable row level security;

create policy "Likes are viewable by everyone" on review_likes for select using (true);
create policy "Users can manage their own likes" on review_likes for all using (auth.uid() = user_id);


-- ========================================================
-- PHASE 2: PERFORMANCE, SECURITY & FEATURE ADDITIONS
-- Run these statements against your LIVE Supabase database
-- via the SQL Editor after the initial schema is set up.
-- ========================================================

-- ─── C1: PERFORMANCE INDEXES ──────────────────────────────────────────────
create index if not exists idx_movie_logs_user_id    on public.movie_logs(user_id);
create index if not exists idx_movie_logs_watched_at on public.movie_logs(watched_at desc);
create index if not exists idx_follows_follower_id   on public.follows(follower_id);
create index if not exists idx_follows_following_id  on public.follows(following_id);
create index if not exists idx_reviews_movie_id      on public.reviews(movie_id);
create index if not exists idx_watchlist_user_id     on public.watchlist(user_id);
create index if not exists idx_recently_viewed_user  on public.recently_viewed(user_id);
-- pg_trgm extension for fast ilike '%keyword%' search
create extension if not exists pg_trgm;

drop index if exists idx_profiles_username;
create index if not exists idx_profiles_username_trgm
  on public.profiles using gin(username gin_trgm_ops);


-- ─── M6a: Add bio column to profiles ──────────────────────────────────────
alter table public.profiles add column if not exists bio text;


-- ─── M6b: Add updated_at to all mutable tables ────────────────────────────
alter table public.profiles     add column if not exists updated_at timestamp with time zone default now();
alter table public.watchlist    add column if not exists updated_at timestamp with time zone default now();
alter table public.movie_logs   add column if not exists updated_at timestamp with time zone default now();
alter table public.reviews      add column if not exists updated_at timestamp with time zone default now();
alter table public.user_ratings add column if not exists updated_at timestamp with time zone default now();


-- ─── M6c: moddatetime triggers (auto-update updated_at on every UPDATE) ───
-- moddatetime is a pre-installed Postgres extension on all Supabase projects
create extension if not exists moddatetime schema extensions;

create or replace trigger handle_updated_at_profiles
  before update on public.profiles
  for each row execute procedure extensions.moddatetime(updated_at);

create or replace trigger handle_updated_at_watchlist
  before update on public.watchlist
  for each row execute procedure extensions.moddatetime(updated_at);

create or replace trigger handle_updated_at_movie_logs
  before update on public.movie_logs
  for each row execute procedure extensions.moddatetime(updated_at);

create or replace trigger handle_updated_at_reviews
  before update on public.reviews
  for each row execute procedure extensions.moddatetime(updated_at);

create or replace trigger handle_updated_at_user_ratings
  before update on public.user_ratings
  for each row execute procedure extensions.moddatetime(updated_at);


-- ─── M7: Fix Reviews RLS — replace broad 'for all' with explicit policies ─
drop policy if exists "Users can manage their own reviews" on public.reviews;
drop policy if exists "Users can insert own reviews" on public.reviews;
drop policy if exists "Users can update own reviews" on public.reviews;
drop policy if exists "Users can delete own reviews" on public.reviews;

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);


-- ─── C2: notifications Table ──────────────────────────────────────────────
drop table if exists public.notifications cascade;

create table public.notifications (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  actor_id     uuid references public.profiles(id) on delete cascade,
  reference_id uuid, -- Can be review_id, movie_id, etc.
  title        text not null,
  message      text not null,
  type         text not null default 'info' check (type in ('info', 'success', 'warning', 'follow', 'review_like')),
  is_read      boolean not null default false,
  movie_id     integer,
  created_at   timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- Indexes for fast per-user notification queries
create index if not exists idx_notifications_user_id
  on public.notifications(user_id);
create index if not exists idx_notifications_unread
  on public.notifications(user_id, is_read)
  where is_read = false;

-- RLS: users can only read and update their own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Notifications are created by backend triggers / Edge Functions (service role)
-- Uncomment the policy below if you use Edge Functions with the anon key:
-- create policy "Service role can insert notifications"
--   on public.notifications for insert with check (true);


-- ─── M1: get_avg_rating — Postgres aggregate RPC ──────────────────────────
-- Replaces JS-side computation in SocialContext.getAverageRating()
create or replace function public.get_avg_rating(p_movie_id integer)
returns table(average numeric, count bigint)
language sql
stable
security definer
as $$
  select
    coalesce(round(avg(rating)::numeric, 2), 0) as average,
    count(*)::bigint                             as count
  from public.reviews
  where movie_id = p_movie_id
    and rating is not null;
$$;


-- ─── M4: toggle_review_like — atomic like/unlike RPC ──────────────────────
-- Replaces the SELECT-then-INSERT/DELETE race condition in SocialContext
create or replace function public.toggle_review_like(p_review_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Attempt DELETE first (unlike). FOUND is true if a row was deleted.
  delete from public.review_likes
  where user_id = v_user_id and review_id = p_review_id;

  if found then
    return false; -- was liked → now unliked
  end if;

  -- No existing like found → insert (like)
  insert into public.review_likes (user_id, review_id)
  values (v_user_id, p_review_id);

  return true; -- now liked
end;
$$;


-- ─── M8: Notification Triggers ──────────────────────────────────────────

-- Trigger: notifikasi saat ada follow baru
CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  SELECT coalesce(username, 'Seseorang') INTO v_follower_name FROM public.profiles WHERE id = NEW.follower_id;
  
  INSERT INTO public.notifications (user_id, type, actor_id, title, message)
  VALUES (
    NEW.following_id, 
    'follow', 
    NEW.follower_id, 
    'Pengikut Baru', 
    v_follower_name || ' mulai mengikuti Anda'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follow();

-- Trigger: notifikasi saat review di-like
CREATE OR REPLACE FUNCTION public.notify_review_like()
RETURNS TRIGGER AS $$
DECLARE
  v_review_owner_id UUID;
  v_movie_id        INTEGER;  -- ← fix: was TEXT (type mismatch)
  v_liker_name      TEXT;
BEGIN
  SELECT user_id, movie_id
    INTO v_review_owner_id, v_movie_id
    FROM public.reviews
   WHERE id = NEW.review_id;

  SELECT username
    INTO v_liker_name
    FROM public.profiles
   WHERE id = NEW.user_id;

  IF v_review_owner_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications
      (user_id, type, actor_id, reference_id, title, message, movie_id)
    VALUES (
      v_review_owner_id,
      'review_like',
      NEW.user_id,
      NEW.review_id,
      'Ulasan Disukai',
      COALESCE(v_liker_name, 'Seseorang') || ' menyukai ulasan Anda',
      v_movie_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_liked ON public.review_likes;

CREATE TRIGGER on_review_liked
  AFTER INSERT ON public.review_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_like();


-- ─── M9: delete_user_account — Safe Account Deletion RPC ─────────────────
-- Deletes the authenticated user's account safely from auth.users.
-- Since profiles/reviews/watchlist have "on delete cascade", all related
-- records in the public schema will be automatically and safely purged.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;


-- ========================================================
-- FEATURE EXPANSIONS (MIGRATION 20260602)
-- ========================================================

-- 1. TV Episode Logs Table
create table if not exists public.tv_episode_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tv_show_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, tv_show_id, season_number, episode_number)
);

alter table public.tv_episode_logs enable row level security;

create policy "Episode logs are viewable by everyone" on public.tv_episode_logs
  for select using (true);

create policy "Users can manage their own episode logs" on public.tv_episode_logs
  for all using (auth.uid() = user_id);

-- 2. Review Comments Table
create table if not exists public.review_comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  review_id uuid references public.reviews(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.review_comments enable row level security;

create policy "Comments are viewable by everyone" on public.review_comments
  for select using (true);

create policy "Users can insert own comments" on public.review_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own comments" on public.review_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on public.review_comments
  for delete using (auth.uid() = user_id);

-- 3. Trigger Function for Comment Notifications
create or replace function public.notify_review_comment()
returns trigger as $$
declare
  v_review_owner_id uuid;
  v_commenter_name text;
  v_movie_id integer;
begin
  select user_id, movie_id into v_review_owner_id, v_movie_id from public.reviews where id = new.review_id;
  select username into v_commenter_name from public.profiles where id = new.user_id;

  if v_review_owner_id is distinct from new.user_id then
    insert into public.notifications (user_id, type, actor_id, reference_id, title, message, movie_id)
    values (
      v_review_owner_id,
      'info',
      new.user_id,
      new.review_id,
      'Komentar Baru',
      coalesce(v_commenter_name, 'Seseorang') || ' mengomentari ulasan Anda',
      v_movie_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_comment
  after insert on public.review_comments
  for each row execute function public.notify_review_comment();

-- 4. Profile Analytics RPC
create or replace function public.get_profile_analytics(p_user_id uuid)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_total_watched bigint;
  v_rating_distribution jsonb;
  v_genre_breakdown jsonb;
begin
  select count(*) into v_total_watched from public.movie_logs where user_id = p_user_id;

  select jsonb_object_agg(rating::text, count) into v_rating_distribution
  from (
    select rating, count(*) as count
    from public.movie_logs
    where user_id = p_user_id and rating is not null
    group by rating
  ) r;

  select jsonb_object_agg(genre_name, count) into v_genre_breakdown
  from (
    select g->>'name' as genre_name, count(*) as count
    from public.watchlist w,
    jsonb_array_elements(w.genres) g
    where w.user_id = p_user_id
    group by genre_name
    order by count desc
  ) gens;

  return jsonb_build_object(
    'total_watched', coalesce(v_total_watched, 0),
    'rating_distribution', coalesce(v_rating_distribution, '{}'::jsonb),
    'genre_breakdown', coalesce(v_genre_breakdown, '{}'::jsonb)
  );
end;
$$;



