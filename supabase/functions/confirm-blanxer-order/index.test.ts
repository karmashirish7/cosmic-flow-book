import "https://deno.land/std@0.224.0/dotenv/load.ts";

const STORE_ID = "692143375d92ef3244957b89";
const BLANXER_SITE_URL = "https://akashvani-astrology.blanxer.io";
const testPayload = { transaction: "69b13a6d6365132d1a7a6bd7", prn: "69b13a6d6365132d1a7a6bd7gjic" };

const urls = [
  `https://api.blanxer.com/order/public/confirm/${STORE_ID}`,
  `https://api.blanxer.com/order/confirm/${STORE_ID}`,
  `https://api.blanxer.com/public/order/confirm/${STORE_ID}`,
  `https://api.blanxer.com/order/public/confirm`,
  `https://api.blanxer.com/order/${STORE_ID}/confirm`,
];

for (const url of urls) {
  Deno.test(`Test: ${url}`, async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BLANXER_SITE_URL}/`,
        Origin: BLANXER_SITE_URL,
      },
      body: JSON.stringify(testPayload),
    });
    const body = await res.text();
    console.log(`Status: ${res.status} | Body: ${body.substring(0, 200)}`);
  });
}
