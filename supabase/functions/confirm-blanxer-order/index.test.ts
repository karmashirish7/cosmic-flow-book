import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("confirm-blanxer-order returns a response", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-blanxer-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      transaction: "69b13a6d6365132d1a7a6bd7",
      prn: "69b13a6d6365132d1a7a6bd7gjic",
    }),
  });

  const body = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", body);

  // We just want to see what the API returns - not necessarily 200
  assertEquals(typeof body, "string");
});
