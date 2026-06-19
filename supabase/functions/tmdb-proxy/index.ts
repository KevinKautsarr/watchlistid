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
