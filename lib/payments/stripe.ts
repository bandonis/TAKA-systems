import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return key;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-06-20'
    });
  }
  return stripeClient;
}

export function getPublicUrl() {
  const url = process.env.PUBLIC_URL;
  if (!url) {
    throw new Error('PUBLIC_URL is not configured');
  }
  return url.replace(/\/$/, '');
}


