-- ========================================================
-- FAVORITES FEATURE MIGRATION
-- Paste into Supabase SQL Editor
-- ========================================================

-- 1. Tabel Favorites
create table if not exists public.favorites (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  movie_id    integer not null,
  media_type  text not null check (media_type in ('movie', 'tv')),
  title       text not null,
  poster_path text,
  position    integer not null default 0,
  added_at    timestamptz default timezone('utc', now()),

  unique(user_id, movie_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Favorites viewable by everyone" on public.favorites;
create policy "Favorites viewable by everyone"
  on public.favorites for select using (true);

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
  on public.favorites for all using (auth.uid() = user_id);

-- 2. RPC: Tambah favorite di posisi terakhir
create or replace function public.add_favorite(
  p_movie_id  integer,
  p_media_type text,
  p_title     text,
  p_poster_path text
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_count   integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Cek max 20
  select count(*) into v_count from public.favorites where user_id = v_user_id;
  if v_count >= 20 then
    raise exception 'Maximum 20 favorites allowed';
  end if;

  insert into public.favorites (user_id, movie_id, media_type, title, poster_path, position)
  values (v_user_id, p_movie_id, p_media_type, p_title, p_poster_path, v_count + 1)
  on conflict (user_id, movie_id) do nothing;
end;
$$;

-- 3. RPC: Reorder favorites (swap posisi dua item)
create or replace function public.reorder_favorites(
  p_ordered_movie_ids integer[]
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_id      integer;
  v_pos     integer := 1;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  foreach v_id in array p_ordered_movie_ids loop
    update public.favorites
    set position = v_pos
    where user_id = v_user_id and movie_id = v_id;
    v_pos := v_pos + 1;
  end loop;
end;
$$;

-- 4. RPC: Move up/down (swap dengan neighbor)
create or replace function public.move_favorite(
  p_movie_id    integer,
  p_direction   text  -- 'up' or 'down'
)
returns void language plpgsql security definer as $$
declare
  v_user_id   uuid := auth.uid();
  v_cur_pos   integer;
  v_target_pos integer;
  v_neighbor_movie integer;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select position into v_cur_pos
  from public.favorites
  where user_id = v_user_id and movie_id = p_movie_id;

  if p_direction = 'up' then
    v_target_pos := v_cur_pos - 1;
  else
    v_target_pos := v_cur_pos + 1;
  end if;

  select movie_id into v_neighbor_movie
  from public.favorites
  where user_id = v_user_id and position = v_target_pos;

  if v_neighbor_movie is null then return; end if;

  -- Swap
  update public.favorites set position = v_cur_pos
  where user_id = v_user_id and movie_id = v_neighbor_movie;

  update public.favorites set position = v_target_pos
  where user_id = v_user_id and movie_id = p_movie_id;
end;
$$;
