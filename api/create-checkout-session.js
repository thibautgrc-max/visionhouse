export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const order = req.body || {};
  const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000';

  /*
  VERSION STRIPE RÉELLE :

  1) npm install stripe
  2) ajoute STRIPE_SECRET_KEY dans Vercel
  3) décommente ce bloc

  import Stripe from 'stripe';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.customerEmail,
    success_url: `${siteUrl}/admin.html?paid=1`,
    cancel_url: `${siteUrl}/index.html?canceled=1`,
    metadata: {
      orderId: order.id,
      reference: order.reference,
      shippingMethod: order.shippingMethod,
      relayId: order.relayId || ''
    },
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${order.reference} x${order.quantity}`
          },
          unit_amount: Math.round((order.total / order.quantity) * 100)
        },
        quantity: Number(order.quantity || 1)
      }
    ]
  });

  return res.status(200).json({ url: session.url });
  */

  return res.status(200).json({
    url: `${siteUrl}/admin.html?mockCheckout=1&orderId=${encodeURIComponent(order.id || '')}`,
    mode: 'mock'
  });
}
