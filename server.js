const express = require('express');
const cors = require('cors');
// Railway securely injects your hidden Secret Key here
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serves your index.html file

app.post('/create-payment-intent', async (req, res) => {
    const { cart } = req.body;

    try {
        let totalCents = 0;
        let orderSummary = "";

        // Calculates exact math and builds the itemized receipt for your Stripe dashboard
        cart.forEach((item, index) => {
            totalCents += Math.round(item.price * 100);
            let details = item.option ? `(${item.option})` : '';
            if (item.customText) details += ` [Text: ${item.customText}]`;
            orderSummary += `${index + 1}. ${item.name} ${details} | `;
        });

        // Stripe has a 500-character limit for metadata, this trims it safely if they buy 20 things
        if (orderSummary.length > 500) {
            orderSummary = orderSummary.substring(0, 497) + "...";
        }

        // Whispers to Stripe to lock in the payment amount and attach the order details
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            description: 'Pricepoint Jewelry Order',
            metadata: {
                exact_order_details: orderSummary
            }
        });

        // Sends the green light back to the frontend to open the card box
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e) {
        console.error("Stripe Backend Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
