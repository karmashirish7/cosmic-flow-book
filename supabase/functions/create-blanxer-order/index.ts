import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORE_ID = "652b9138aebd132f108cb75f";
const ORDER_URL = `https://api.blanxer.com/order/${STORE_ID}`;
const QR_INIT_URL = "https://api.blanxer.com/payment/dynamic_qr/init";
const SITE_URL = "https://cosmic-flow-book.lovable.app";

// For now, all services map to this product
const PRODUCT_ID = "6756c1577481be1b05cfc66a";
const VARIANT_ID = "67f4ee989a4366a2fdcce428";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, email, address, notes, service } = await req.json();

    // Step 1: Create order
    const orderRes = await fetch(ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: SITE_URL + "/",
        Origin: SITE_URL,
      },
      body: JSON.stringify({
        products: [{ product: PRODUCT_ID, variant: VARIANT_ID, quantity: 1 }],
        customer_email: email || "",
        customer_full_name: name || "",
        customer_phone_number: phone || "",
        customer_address: address || "",
        customer_address_landmark: "",
        customer_address_city: "",
        order_note: `${service || "Consultation"}`,
        pan: "",
        company_name: "",
        paymentMethod: "QR_Dynamic",
        url: SITE_URL,
        coupon: "",
      }),
    });

    const orderData = await orderRes.json();
    console.log("Order response:", JSON.stringify(orderData));

    if (!orderData.success && !orderData._id && !orderData.order?._id) {
      return new Response(
        JSON.stringify({ success: false, error: "Order creation failed", details: orderData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = orderData._id || orderData.order?._id || orderData.id;

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: "No order ID returned", details: orderData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Init dynamic QR
    const qrRes = await fetch(QR_INIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: SITE_URL + "/",
        Origin: SITE_URL,
      },
      body: JSON.stringify({
        order: orderId,
        store: STORE_ID,
        url: SITE_URL,
        self: true,
      }),
    });

    const qrData = await qrRes.json();
    console.log("QR init response:", JSON.stringify(qrData));

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
