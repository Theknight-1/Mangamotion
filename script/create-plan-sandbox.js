/**
 * Creates a PayPal Product + two monthly billing Plans (Creator $19, Pro $49)
 * directly against the Sandbox API — there's no dashboard UI for this in
 * Sandbox mode, only Live accounts get the Products & Plans screen.
 *
 * Usage:
 *   PAYPAL_CLIENT_ID=xxx PAYPAL_CLIENT_SECRET=xxx node script/create-plan-sandbox.js
 *
 * Requires: Node 18+ (built-in fetch). No other dependencies.
 */

const BASE = "https://api-m.sandbox.paypal.com";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET first.");
  process.exit(1);
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token request failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function createProduct(accessToken) {
  const res = await fetch(`${BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `mangamotion-product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: "MangaMotion",
      description: "AI manga-to-video recap generator",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Product creation failed: ${JSON.stringify(data)}`);
  return data.id;
}

async function createPlan(accessToken, productId, name, price) {
  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `mangamotion-plan-${name.toLowerCase()}-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: `MangaMotion ${name}`,
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: price, currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Plan creation failed (${name}): ${JSON.stringify(data)}`);
  return data.id;
}

(async () => {
  try {
    console.log("→ Getting access token...");
    const accessToken = await getAccessToken();
    console.log("  ✓ token acquired");

    console.log("→ Creating product...");
    const productId = await createProduct(accessToken);
    console.log(`  ✓ product_id: ${productId}`);

    console.log("→ Creating Creator plan ($19/mo)...");
    const creatorPlanId = await createPlan(accessToken, productId, "Creator", "19.00");
    console.log(`  ✓ PAYPAL_PLAN_CREATOR=${creatorPlanId}`);

    console.log("→ Creating Pro plan ($49/mo)...");
    const proPlanId = await createPlan(accessToken, productId, "Pro", "49.00");
    console.log(`  ✓ PAYPAL_PLAN_PRO=${proPlanId}`);

    console.log("\nAdd these to your .env:");
    console.log(`PAYPAL_PLAN_CREATOR=${creatorPlanId}`);
    console.log(`PAYPAL_PLAN_PRO=${proPlanId}`);
  } catch (err) {
    console.error("\n✗ Failed:", err.message);
    process.exit(1);
  }
})();