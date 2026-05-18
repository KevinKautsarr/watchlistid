import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Endpoint query parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get TMDB API Key from environment variables (configured via Supabase Secrets/Vault)
    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
    if (!tmdbApiKey) {
      console.error('TMDB_API_KEY is not configured in Supabase environment variables');
      return new Response(JSON.stringify({ error: 'TMDB API Key is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standardize endpoint leading slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const targetUrl = new URL(`https://api.themoviedb.org/3${cleanEndpoint}`);
    
    // Copy all other search params to target url
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        targetUrl.searchParams.set(key, value);
      }
    });
    
    // Inject the TMDB API Key securely
    targetUrl.searchParams.set('api_key', tmdbApiKey);

    console.log(`Proxying request to: ${targetUrl.pathname} (params omitted for privacy)`);

    const tmdbResponse = await fetch(targetUrl.toString());
    const data = await tmdbResponse.json();

    return new Response(JSON.stringify(data), {
      status: tmdbResponse.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json; charset=utf-8' 
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
