# Supabase — Database & Edge Functions

The full database schema is version-controlled here as ordered, CLI-managed
migrations so it can be reproduced deterministically.

```
supabase/
├── config.toml                     # CLI project config
├── migrations/
│   ├── 20260101000000_initial_schema.sql      # base tables, RLS, triggers, RPCs
│   ├── 20260526000000_username_search_index.sql
│   ├── 20260602000000_favorites.sql           # favorites table + RPCs
│   └── 20260602000001_features_addition.sql   # tv_episode_logs, review_comments, analytics
└── functions/
    └── tmdb-proxy/                 # Edge Function proxying TMDB (keeps the API key server-side)
```

> The root `supabase_schema.sql` is kept as a human-readable blueprint and is
> mirrored by `migrations/20260101000000_initial_schema.sql`.

## Fresh database (local or a new project)

```bash
supabase db reset          # runs every migration in timestamp order
```

## Existing production database (already provisioned manually)

The live database was set up before these migration files existed, so its tables
already exist. **Do not run `supabase db push` blindly** — it would try to
re-create existing objects and fail. Baseline first, then push only new changes:

```bash
supabase link --project-ref <your-project-ref>
# Mark the existing migrations as already applied (baseline):
supabase migration repair --status applied 20260101000000 20260526000000 20260602000000 20260602000001
# From now on, new migrations apply cleanly:
supabase db push
```

## Edge Functions

```bash
# TMDB API key is a server-side secret (never EXPO_PUBLIC):
supabase secrets set TMDB_API_KEY=<your-tmdb-key>
supabase functions deploy tmdb-proxy
```

The proxy enforces an **origin allowlist** and an **endpoint allowlist** — update
`ALLOWED_ORIGINS` / `ALLOWED_ENDPOINT` in `functions/tmdb-proxy/index.ts` if you
add a new deployment domain or TMDB path.
