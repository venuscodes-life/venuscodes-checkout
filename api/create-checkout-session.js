import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGINS = new Set([
  "https://venuscodes.life",
  // venuscodes-checkout.vercel.app
]);

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).send("ok");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount } = req.body || {};
    if (!Number.isInteger(amount) || amount < 2200 || amount > 22200) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: "Custom Plan",
              description: "VenusCodes.life — custom amount checkout"
            }
          },
          quantity: 1
        }
      ],
      success_url: "https://venuscodes.life/thanks?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://venuscodes.life/cancelled",
      customer_creation: "if_required",
      automatic_tax: { enabled: false }
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
