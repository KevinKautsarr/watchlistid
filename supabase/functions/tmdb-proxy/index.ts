import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Origin allowlist ──────────────────────────────────────────────────────────
// Browsers send an `Origin` header; native apps do not. We reflect the origin
// only when it is on the allowlist (and always allow no-Origin native requests).
const ALLOWED_ORIGINS = new Set([
  "https://watchlistid.vercel.app",
  "https://watchlistid.netlify.app",
  "http://localhost:8081",
  "http://localhost:19006",
]);

// ── Endpoint allowlist ────────────────────────────────────────────────────────
// Only these TMDB path prefixes may be proxied. Prevents the function from being
// used as an open proxy to arbitrary TMDB (or, via crafted input, other) paths.
const ALLOWED_ENDPOINT = /^\/(discover|search|trending|genre|movie|tv|person)(\/|$)/;

// ── Rate limiting (defense-in-depth, best-effort) ─────────────────────────────
// Edge Functions run as short-lived, per-region isolates, so this in-memory
// counter does NOT provide a global guarantee (cold starts reset it, and
// concurrent regions each keep their own count). It still meaningfully blocks
// a single hot instance from being hammered by one client. A durable limit
// would require an external store (e.g. Upstash Redis / Supabase Postgres),
// which is out of scope here.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP per window — generous for normal browsing
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestLog.get(ip) ?? []).filter(t => t > windowStart);
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded across the
  // isolate's lifetime.
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (times.every(t => t <= windowStart)) requestLog.delete(key);
    }
  }

  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = buildCorsHeaders(origin);
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Reject browser requests from disallowed origins (native requests have no Origin)
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin not allowed" }, 403);
  }

  // Defense-in-depth: require the Authorization/apikey header even though the
  // platform-level `verify_jwt = true` (supabase/config.toml) already enforces
  // a valid Supabase JWT before this code runs. This keeps the function safe
  // even if that config setting is ever reverted or misapplied.
  const authHeader = req.headers.get("Authorization") ?? "";
  const apiKeyHeader = req.headers.get("apikey") ?? "";
  if (!authHeader.startsWith("Bearer ") && !apiKeyHeader) {
    return json({ error: "Missing authorization" }, 401);
  }

  // Best-effort per-IP rate limit (see comment on requestLog above for caveats).
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  if (isRateLimited(clientIp)) {
    return json({ error: "Too many requests" }, 429);
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      return json({ error: "Endpoint query parameter is required" }, 400);
    }

    // Standardize endpoint leading slash, then validate against the allowlist
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    if (!ALLOWED_ENDPOINT.test(cleanEndpoint)) {
      return json({ error: "Endpoint not allowed" }, 403);
    }

    // Get TMDB API Key from environment variables (configured via Supabase Secrets/Vault)
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      console.error("TMDB_API_KEY is not configured in Supabase environment variables");
      return json({ error: "TMDB API Key is not configured" }, 500);
    }

    const targetUrl = new URL(`https://api.themoviedb.org/3${cleanEndpoint}`);

    // Copy all other search params to target url (api_key is injected last so a
    // client cannot override it)
    url.searchParams.forEach((value, key) => {
      if (key !== "endpoint" && key !== "api_key") {
        targetUrl.searchParams.set(key, value);
      }
    });
    targetUrl.searchParams.set("api_key", tmdbApiKey);

    console.log(`Proxying request to: ${targetUrl.pathname} (params omitted for privacy)`);

    const tmdbResponse = await fetch(targetUrl.toString());
    const data = await tmdbResponse.json();

    return json(data, tmdbResponse.status);
  } catch (error) {
    console.error("Proxy error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
