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
    const purchaseCode = payload.purchaseCode || "";

    console.log("Confirming order:", { transaction, purchaseCode });

    const confirmPayload: Record<string, string> = {};
    if (transaction) confirmPayload.transaction = transaction;
    if (purchaseCode) confirmPayload.purchaseCode = purchaseCode;

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

    const data = await res.json();
    console.log("Confirm response:", res.status, JSON.stringify(data));

    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Confirmation failed", details: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Confirm error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
