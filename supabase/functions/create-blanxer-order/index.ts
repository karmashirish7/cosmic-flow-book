const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Store ID for Akashvani Astrology on Blanxer
const STORE_ID = '652b9138aebd132f108cb75f';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, location, amount, name, phone, email } = await req.json();

    // Determine which product to use
    // Love & Relationship → MATCHMAKING
    // Outside Nepal → CONSULTATION ABROAD
    // All other Nepal services → BASIC ASTROLOGY CONSULTATION
    let productId: string;

    if (service === 'Love & Relationship') {
      productId = '699b26e63ccc0711c1f85b0c'; // MATCHMAKING
    } else if (location === 'outside') {
      productId = '699744003ccc0711c1c52260'; // CONSULTATION ABROAD
    } else {
      productId = '692157465d92ef3244969f12'; // BASIC ASTROLOGY CONSULTATION
    }

    // Create order via Blanxer Public Order API
    const orderRes = await fetch(`https://api.blanxer.com/order/${STORE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://cosmic-flow-book.lovable.app/',
      },
      body: JSON.stringify({
        products: [
          {
            product: productId,
            variant: '',
            quantity: 1,
          },
        ],
        customer_email: email || '',
        customer_full_name: name || '',
        customer_phone_number: phone || '',
        customer_address: '',
        customer_address_landmark: '',
        customer_address_city: '',
        order_note: `${service} consultation`,
        pan: '',
        company_name: '',
        paymentMethod: 'fonepay',
        url: 'https://cosmic-flow-book.lovable.app',
        coupon: '',
      }),
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      return new Response(JSON.stringify({ error: 'Order creation failed', details: orderData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return QR data and socket URL
    const qrData = orderData.qr_data;
    const qrMessage = qrData?.extras?.qrMessage || qrData?.qr_payload;
    const socketUrl = qrData?.extras?.merchantWebSocketUrl || qrData?.socket_url;

    return new Response(JSON.stringify({
      success: true,
      order_id: orderData.order?._id,
      order_number: orderData.order?.order_number,
      qr_url: qrMessage ? `https://api.blanxer.com/public/qr?q=${encodeURIComponent(qrMessage)}` : null,
      socket_url: socketUrl,
      amount: Number(amount),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
