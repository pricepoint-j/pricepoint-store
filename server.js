const express = require('express');
const cors = require('cors');
// Railway will securely inject your Secret Key here later
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serves your index.html file

app.post('/create-checkout-session', async (req, res) => {
    const { cart } = req.body;

    try {
        // Build the itemized list for the Stripe receipt
        const lineItems = cart.map(item => {
            let itemName = item.option ? `${item.name} (${item.option})` : item.name;
            if (item.customText) itemName += ` - Text: ${item.customText}`;

            return {
                price_data: {
                    currency: 'usd',
                    product_data: { 
                        name: itemName.substring(0, 250) // Stripe character limit
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe reads prices in cents ($25.00 = 2500)
                },
                quantity: 1,
            };
        });

        // Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            // Automatically redirects them back to your site after paying
            success_url: `${req.headers.origin}/?success=true`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Stripe Backend Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
