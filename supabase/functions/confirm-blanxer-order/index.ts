import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "692143375d92ef3244957b89";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";
const CONFIRM_URL = `https://api.blanxer.com/order/public/confirm/${STORE_ID}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const transaction = payload.transaction || "";
    const prn = payload.prn || "";

    const confirmPayload: Record<string, string> = {};
    if (transaction) confirmPayload.transaction = transaction;
    if (prn) confirmPayload.prn = prn;

    console.log("Confirm URL:", CONFIRM_URL);
    console.log("Confirm payload:", JSON.stringify(confirmPayload));

    const res = await fetch(CONFIRM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify(confirmPayload),
    });

    const rawText = await res.text();
    console.log("Confirm response status:", res.status);
    console.log("Confirm response body:", rawText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Non-JSON response from Blanxer", status: res.status, body: rawText.substring(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: res.ok, data }),
      { status: res.ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Confirm error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
