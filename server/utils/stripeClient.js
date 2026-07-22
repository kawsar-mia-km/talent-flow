/**
 * Minimal Stripe Checkout integration for an optional recruiter "Pro"
 * plan. Disabled by default — set STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO
 * and STRIPE_WEBHOOK_SECRET in server/.env to turn it on. Every function
 * fails soft with a clear error if Stripe isn't configured, matching the
 * fail-soft pattern already used for the AI service and email.
 */
const ENABLED = !!process.env.STRIPE_SECRET_KEY;

let stripe = null;
function getStripe() {
  if (!stripe) stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

function isEnabled() {
  return ENABLED;
}

async function createCheckoutSession(user) {
  if (!ENABLED) throw new Error("Billing isn't configured on this server yet.");
  const client = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await client.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
  }

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/recruiter?billing=success`,
    cancel_url: `${process.env.CLIENT_URL}/recruiter?billing=cancelled`
  });

  return { url: session.url, customerId };
}

function constructWebhookEvent(rawBody, signature) {
  const client = getStripe();
  return client.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { isEnabled, createCheckoutSession, constructWebhookEvent };
