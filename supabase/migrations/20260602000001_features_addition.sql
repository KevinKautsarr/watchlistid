-- ========================================================
-- WATCHLIST ID - SCHEMA EXPANSION MIGRATION
-- Paste this into the Supabase "SQL Editor" to apply features
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

-- RLS
alter table public.tv_episode_logs enable row level security;

drop policy if exists "Episode logs are viewable by everyone" on public.tv_episode_logs;
create policy "Episode logs are viewable by everyone" on public.tv_episode_logs
  for select using (true);

drop policy if exists "Users can manage their own episode logs" on public.tv_episode_logs;
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

-- RLS
alter table public.review_comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.review_comments;
create policy "Comments are viewable by everyone" on public.review_comments
  for select using (true);

drop policy if exists "Users can insert own comments" on public.review_comments;
create policy "Users can insert own comments" on public.review_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on public.review_comments;
create policy "Users can update own comments" on public.review_comments
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.review_comments;
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

drop trigger if exists on_review_comment on public.review_comments;
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
  -- Total Watched
  select count(*) into v_total_watched from public.movie_logs where user_id = p_user_id;

  -- Rating Distribution
  select jsonb_object_agg(rating::text, count) into v_rating_distribution
  from (
    select rating, count(*) as count
    from public.movie_logs
    where user_id = p_user_id and rating is not null
    group by rating
  ) r;

  -- Genre Breakdown (from logged movies)
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
