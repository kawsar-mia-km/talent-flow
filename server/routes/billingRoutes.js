const express = require("express");
const { createCheckoutSession, handleWebhook } = require("../controllers/billingController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/checkout", protect, authorize("recruiter"), createCheckoutSession);
// NOTE: the webhook route is mounted separately in app.js with express.raw(),
// since Stripe's signature check needs the untouched raw request body.

module.exports = { router, handleWebhook };
