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
    const { transaction, orderId } = payload;
    console.log("Confirm request payload:", JSON.stringify(payload));

    // Try multiple endpoint patterns with different methods
    const attempts = [
      { url: `https://api.blanxer.com/order/confirm`, method: "POST", body: { transaction, order: orderId, store: STORE_ID } },
      { url: `https://api.blanxer.com/order/confirm/${orderId}`, method: "POST", body: { transaction, store: STORE_ID } },
      { url: `https://api.blanxer.com/order/${STORE_ID}/${orderId}`, method: "PUT", body: { payment_status: "paid", transaction } },
      { url: `https://api.blanxer.com/order/${STORE_ID}/${orderId}`, method: "PATCH", body: { payment_status: "paid", transaction } },
      { url: `https://api.blanxer.com/payment/verify`, method: "POST", body: { transaction, order: orderId, store: STORE_ID } },
      { url: `https://api.blanxer.com/order/status/${orderId}`, method: "PUT", body: { status: "confirmed", transaction } },
    ];

    const results: Array<{ url: string; method: string; status: number; body: string }> = [];

    for (const attempt of attempts) {
      try {
        console.log(`Trying ${attempt.method} ${attempt.url}`);
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Referer: `${BLANXER_SITE_URL}/`,
            Origin: BLANXER_SITE_URL,
          },
          body: JSON.stringify(attempt.body),
        });

        const body = await res.text();
        console.log(`${attempt.method} ${attempt.url} -> ${res.status}: ${body.substring(0, 200)}`);
        results.push({ url: attempt.url, method: attempt.method, status: res.status, body: body.substring(0, 300) });

        // If we get a non-404 success or meaningful response, return it
        if (res.ok) {
          let data;
          try { data = JSON.parse(body); } catch { data = { raw: body }; }
          return new Response(
            JSON.stringify({ success: true, data, endpoint: `${attempt.method} ${attempt.url}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.error(`Error with ${attempt.method} ${attempt.url}:`, err.message);
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
