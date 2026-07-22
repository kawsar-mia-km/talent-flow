const stripeClient = require("../utils/stripeClient");
const User = require("../models/User");
const logger = require("../utils/logger");

async function createCheckoutSession(req, res, next) {
  try {
    if (!stripeClient.isEnabled()) {
      return res.status(503).json({
        message: "Billing isn't configured on this server. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO to enable it."
      });
    }
    const { url, customerId } = await stripeClient.createCheckoutSession(req.user);
    if (customerId && customerId !== req.user.stripeCustomerId) {
      req.user.stripeCustomerId = customerId;
      await req.user.save();
    }
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

/** Stripe calls this directly (raw body, signature-verified) — not behind `protect`. */
async function handleWebhook(req, res) {
  if (!stripeClient.isEnabled()) return res.status(503).end();

  let event;
  try {
    event = stripeClient.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await User.updateOne({ stripeCustomerId: session.customer }, { billingPlan: "pro" });
  }
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await User.updateOne({ stripeCustomerId: subscription.customer }, { billingPlan: "free" });
  }

  res.json({ received: true });
}

module.exports = { createCheckoutSession, handleWebhook };
