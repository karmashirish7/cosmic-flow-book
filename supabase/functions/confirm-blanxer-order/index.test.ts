import "https://deno.land/std@0.224.0/dotenv/load.ts";

const STORE_ID = "692143375d92ef3244957b89";
const ORDER_ID = "69b13a6d6365132d1a7a6bc2";
const TRANSACTION_ID = "69b13a6d6365132d1a7a6bd7";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";
const testPayload = { transaction: TRANSACTION_ID, prn: "69b13a6d6365132d1a7a6bd7gjic" };

const tests = [
  { url: `https://api.blanxer.com/order/public/confirm/${ORDER_ID}`, method: "POST" },
  { url: `https://api.blanxer.com/order/public/confirm/${TRANSACTION_ID}`, method: "POST" },
  { url: `https://api.blanxer.com/order/public/confirm/${STORE_ID}`, method: "PUT" },
  { url: `https://api.blanxer.com/order/public/confirm/${ORDER_ID}`, method: "PUT" },
  { url: `https://api.blanxer.com/payment/confirm/${STORE_ID}`, method: "POST" },
  { url: `https://api.blanxer.com/payment/dynamic_qr/confirm`, method: "POST" },
];

for (const { url, method } of tests) {
  Deno.test(`${method} ${url}`, async () => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify(testPayload),
    });
    const body = await res.text();
    console.log(`Status: ${res.status} | Body: ${body.substring(0, 300)}`);
  });
}
