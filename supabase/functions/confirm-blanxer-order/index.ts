import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "692143375d92ef3244957b89";
const CONFIRM_URL = `https://api.blanxer.com/order/confirm/${STORE_ID}`;
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log("Confirm request payload:", JSON.stringify(payload));

    const confirmRes = await fetch(CONFIRM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await confirmRes.text();
    console.log("Confirm response status:", confirmRes.status, "body:", responseText);

    let confirmData;
    try {
      confirmData = JSON.parse(responseText);
    } catch {
      confirmData = { raw: responseText };
    }

    return new Response(
      JSON.stringify({ success: confirmRes.ok, data: confirmData }),
      {
        status: confirmRes.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Confirm error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
