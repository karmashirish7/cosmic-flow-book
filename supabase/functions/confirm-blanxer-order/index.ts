import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "692143375d92ef3244957b89";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";

// Try multiple confirm endpoint patterns
const CONFIRM_URLS = [
  `https://api.blanxer.com/payment/dynamic_qr/confirm`,
  `https://api.blanxer.com/payment/confirm`,
  `https://api.blanxer.com/order/${STORE_ID}/confirm`,
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Confirm request payload:", JSON.stringify(payload));

    const results: Array<{ url: string; status: number; body: string }> = [];

    for (const url of CONFIRM_URLS) {
      try {
        console.log(`Trying confirm URL: ${url}`);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Referer: `${BLANXER_SITE_URL}/`,
            Origin: BLANXER_SITE_URL,
          },
          body: JSON.stringify({ ...payload, store: STORE_ID }),
        });

        const body = await res.text();
        console.log(`URL ${url} -> status: ${res.status}, body: ${body}`);
        results.push({ url, status: res.status, body });

        if (res.ok) {
          let data;
          try { data = JSON.parse(body); } catch { data = { raw: body }; }
          return new Response(
            JSON.stringify({ success: true, data, url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.error(`Error with ${url}:`, err.message);
        results.push({ url, status: 0, body: err.message });
      }
    }

    // None worked — return all results for debugging
    return new Response(
      JSON.stringify({ success: false, error: "No confirm endpoint worked", results }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Confirm error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
