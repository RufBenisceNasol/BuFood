const axios = require('axios');

/**
 * Create a PayMongo GCash source and return the checkout URL.
 * If PAYMONGO_SECRET_KEY is not configured or the API call fails,
 * we fall back to returning the provided redirectUrl so the app can
 * continue with a manual/off-platform flow.
 */
async function createGCashSource({ amount, redirectUrl, orderId }) {
  try {
    const secret = process.env.PAYMONGO_SECRET_KEY;
    // Amount should be in the smallest currency unit (centavos)
    const amountInCents = Math.round(Number(amount) * 100);

    if (!secret) {
      // No PayMongo configured: fall back to manual redirect
      return redirectUrl;
    }

    const res = await axios.post(
      'https://api.paymongo.com/v1/sources',
      {
        data: {
          attributes: {
            amount: amountInCents,
            currency: 'PHP',
            type: 'gcash',
            redirect: {
              success: redirectUrl,
              failed: redirectUrl,
            },
            metadata: {
              orderId: String(orderId || ''),
            },
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64'),
        },
        timeout: 10000,
      }
    );

    const checkoutUrl = res?.data?.data?.attributes?.redirect?.checkout_url || redirectUrl;
    return checkoutUrl;
  } catch (err) {
    // On any error, return provided redirect URL so the client can proceed manually
    return redirectUrl;
  }
}

module.exports = { createGCashSource };
