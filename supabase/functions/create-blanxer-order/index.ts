import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "692143375d92ef3244957b89";
const ORDER_URL = `https://api.blanxer.com/order/${STORE_ID}`;
const QR_INIT_URL = "https://api.blanxer.com/payment/dynamic_qr/init";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";

const PRODUCT_MAP: Record<string, { product: string; variant: string }> = {
  "In-Depth Birth Chart Analysis": { product: "692157465d92ef3244969f12", variant: "" },
  "Test": { product: "69a42581af8a6b363b90c71d", variant: "" },
};
const DEFAULT_PRODUCT = { product: "692157465d92ef3244969f12", variant: "" };

const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const customerName = String(payload.name ?? "").trim();
    const customerPhone = normalizePhone(payload.phone);
    const customerEmail = String(payload.email ?? "").trim();
    const customerAddress = String(payload.address ?? "").trim();
    const customerCity = "Kathmandu Inside Ring Road";
    const serviceName = String(payload.service ?? "Consultation").trim() || "Consultation";
    const customerOrderNote = "Consultation Payment";

    if (customerPhone.length !== 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Phone number must be 10 digits",
          details: { customer_phone_number: customerPhone },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mapped = PRODUCT_MAP[serviceName] || DEFAULT_PRODUCT;

    const orderPayload = {
      products: [{ product: mapped.product, variant: mapped.variant, quantity: 1 }],
      customer_email: customerEmail,
      customer_full_name: customerName,
      customer_phone_number: customerPhone,
      customer_address: customerAddress || customerCity,
      customer_address_landmark: "",
      customer_address_city: customerCity,
      order_note: customerOrderNote,
      pan: "",
      company_name: "",
      paymentMethod: "QR_Dynamic",
      url: BLANXER_SITE_URL,
      coupon: "",
    };

    console.log("Order request payload:", JSON.stringify(orderPayload));

    const orderRes = await fetch(ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();
    console.log("Order response:", JSON.stringify(orderData));

    if (!orderRes.ok || (!orderData._id && !orderData.order?._id && !orderData.id)) {
      return new Response(
        JSON.stringify({ success: false, error: "Order creation failed", details: orderData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = orderData._id || orderData.order?._id || orderData.id;

    // Step 2: Init dynamic QR
    const qrRes = await fetch(QR_INIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify({
        order: orderId,
        store: STORE_ID,
        url: BLANXER_SITE_URL,
      }),
    });

    const qrData = await qrRes.json();
    console.log("QR init response:", JSON.stringify(qrData));

    if (!qrRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "QR initialization failed", details: qrData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, order: orderData, qr: qrData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
