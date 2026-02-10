import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Make sure process.env.STRIPE_SECRET_KEY is set to your test secret key
const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
if (!stripeSecret) {
  console.warn('STRIPE_SECRET_KEY not set. Payment routes will fail until it is configured.');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

// Create a payment intent (TEST MODE when using test key)
// Expects body: { amount, currency?, registrationId?, description? }
router.post('/create-payment-intent', async (req, res) => {
  try {
    let { amount, currency, registrationId, description } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });
    currency = currency || 'usd';

    // Stripe requires amount in smallest currency unit (cents)
    const amountInt = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInt,
      currency,
      metadata: { registrationId: registrationId || '', description: description || '' }
    });

    res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ success: false, message: 'Error creating payment intent', error: err.message });
  }
});

export default router;
