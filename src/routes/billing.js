const express = require('express');
const Stripe = require('stripe');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const logger = require('../utils/logger');

const router = express.Router();
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const PLANS = {
  free:        { price: 0,     credits: 10 },
  starter:     { price: 900,   credits: 50,  priceId: 'price_starter' },
  creator_pro: { price: 1900,  credits: 200, priceId: 'price_creator_pro' },
  business:    { price: 4900,  credits: 500, priceId: 'price_business' },
  agency:      { price: 9900,  credits: 99999, priceId: 'price_agency' },
};

// ─── POST /api/billing/create-checkout ────────────────────────
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const session = await getStripe().checkout.sessions.create({
      customer_email: req.user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: PLANS[plan].priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/settings/billing?cancelled=true`,
      metadata: { userId: req.user.id, plan }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    logger.error('Create checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// ─── POST /api/billing/webhook ────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        
        await query(
          'UPDATE users SET plan = $1, ai_credits = $2, ai_credits_used = 0 WHERE id = $3',
          [plan, PLANS[plan].credits, userId]
        );
        
        await query(
          `INSERT INTO subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, status, amount, currency)
           VALUES ($1, $2, $3, $4, 'active', $5, 'USD')`,
          [userId, plan, session.customer, session.subscription, PLANS[plan].price]
        );
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await query(
          `UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        break;
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── GET /api/billing/subscription ────────────────────────────
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json({ subscription: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

module.exports = router;
