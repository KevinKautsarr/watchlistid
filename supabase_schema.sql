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

-- Allow users to read their own profile
create policy "Users can view own profile" 
on profiles for select 
using ( auth.uid() = id );

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

create policy "Users can manage their own watchlist" 
on watchlist for all 
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

create policy "Users can manage their own ratings" 
on user_ratings for all 
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

create policy "Users can manage their own recently viewed" 
on recently_viewed for all 
using ( auth.uid() = user_id );


-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up, automatically create a profile
-- ========================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


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

create policy "Users can manage their own logs" 
on movie_logs for all 
using ( auth.uid() = user_id );

-- ==========================================
-- SOCIAL SYSTEM (FOLLOWS)
-- ==========================================

-- Table to store user following relationships
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users not null,
  following_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate follows
  unique(follower_id, following_id),
  
  -- Prevent self-following
  check (follower_id <> following_id)
);

-- Enable RLS
alter table public.follows enable row level security;

-- Policies
create policy "Follows are public" on follows for select using (true);

create policy "Users can follow others" on follows for insert 
with check (auth.uid() = follower_id);

create policy "Users can unfollow" on follows for delete 
using (auth.uid() = follower_id);
