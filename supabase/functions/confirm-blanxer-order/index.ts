import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "692143375d92ef3244957b89";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { transaction, orderId, wsData } = payload;
    const apiKey = Deno.env.get("BLANXER_API_KEY") || "";
    
    console.log("Confirm payload:", JSON.stringify(payload));
    console.log("Has API key:", !!apiKey);

    // Try various endpoint/method/auth combinations
    const attempts = [
      // With API key auth
      { url: `https://api.blanxer.com/order/confirm`, method: "POST", body: { transaction, order: orderId, store: STORE_ID }, auth: true },
      { url: `https://api.blanxer.com/order/confirm/${STORE_ID}`, method: "POST", body: { transaction, order: orderId }, auth: true },
      { url: `https://api.blanxer.com/order/public/confirm/${STORE_ID}`, method: "POST", body: { transaction, order: orderId }, auth: true },
      // Payment-specific endpoints
      { url: `https://api.blanxer.com/payment/dynamic_qr/verify`, method: "POST", body: { transaction, order: orderId, store: STORE_ID }, auth: false },
      { url: `https://api.blanxer.com/payment/dynamic_qr/complete`, method: "POST", body: { transaction, order: orderId, store: STORE_ID }, auth: false },
      { url: `https://api.blanxer.com/payment/callback`, method: "POST", body: { transaction, order: orderId, store: STORE_ID, ...(wsData || {}) }, auth: false },
      // Order status update with API key
      { url: `https://api.blanxer.com/order/${orderId}`, method: "PUT", body: { payment_status: "paid", status: "confirmed" }, auth: true },
      { url: `https://api.blanxer.com/order/${orderId}`, method: "PATCH", body: { payment_status: "paid", status: "confirmed" }, auth: true },
    ];

    const results: Array<{ url: string; method: string; status: number; body: string }> = [];

    for (const attempt of attempts) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          Referer: `${BLANXER_SITE_URL}/`,
          Origin: BLANXER_SITE_URL,
        };
        if (attempt.auth && apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["x-api-key"] = apiKey;
        }

        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers,
          body: JSON.stringify(attempt.body),
        });

        const body = await res.text();
        const preview = body.substring(0, 300);
        console.log(`${attempt.method} ${attempt.url} [auth:${attempt.auth}] -> ${res.status}: ${preview}`);
        results.push({ url: attempt.url, method: attempt.method, status: res.status, body: preview });

        if (res.ok) {
          let data;
          try { data = JSON.parse(body); } catch { data = { raw: body }; }
          return new Response(
            JSON.stringify({ success: true, data, endpoint: `${attempt.method} ${attempt.url}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        results.push({ url: attempt.url, method: attempt.method, status: 0, body: err.message });
      }
    }

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
