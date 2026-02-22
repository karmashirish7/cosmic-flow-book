const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, location, amount } = await req.json();

    const apiKey = Deno.env.get('BLANXER_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Authenticate with Blanxer to get token and storeId
    const authRes = await fetch('https://api.blanxer.com/api-key/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const authData = await authRes.json();
    if (!authData.success) {
      return new Response(JSON.stringify({ error: 'Blanxer authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storeId = authData.store._id;
    const token = authData.token;

    // Step 2: Determine which product to use
    // Product mapping:
    // Love & Relationship → MATCHMAKING (699b26e63ccc0711c1f85b0c)
    // Any service + Outside Nepal → CONSULTATION ABROAD (699744003ccc0711c1c52260)
    // All other Nepal services → BASIC ASTROLOGY CONSULTATION (692157465d92ef3244969f12)
    let productId: string;

    if (service === 'Love & Relationship') {
      productId = '699b26e63ccc0711c1f85b0c'; // MATCHMAKING
    } else if (location === 'outside') {
      productId = '699744003ccc0711c1c52260'; // CONSULTATION ABROAD
    } else {
      productId = '692157465d92ef3244969f12'; // BASIC ASTROLOGY CONSULTATION
    }

    // Step 3: Create order via Blanxer POS API
    const orderRes = await fetch(`https://api.blanxer.com/order/create-via-pos/${storeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        outlet: '',
        customer_id: '',
        payment_method: 'qr',
        products: [
          {
            product: productId,
            variant: '',
            quantity: 1,
            price: Number(amount),
          },
        ],
        discount: 0,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      return new Response(JSON.stringify({ error: 'Order creation failed', details: orderData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Return QR data and socket URL
    const qrData = orderData.qr_data;
    const qrMessage = qrData?.extras?.qrMessage || qrData?.qr_payload;
    const socketUrl = qrData?.extras?.merchantWebSocketUrl || qrData?.socket_url;

    return new Response(JSON.stringify({
      success: true,
      order_id: orderData.order._id,
      order_number: orderData.order.order_number,
      qr_url: `https://api.blanxer.com/public/qr?q=${encodeURIComponent(qrMessage)}`,
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
