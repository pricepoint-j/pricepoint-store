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
        let metadataObj = {};

        // Calculates exact math and builds a clean, itemized list for your Stripe dashboard
        cart.forEach((item, index) => {
            totalCents += Math.round(item.price * 100);
            
            let details = item.option ? `Size/Style: ${item.option}` : '';
            if (item.customText) details += ` | Custom Text: ${item.customText}`;
            
            let val = `${item.name} ${details ? '- ' + details : ''}`;
            
            // Stripe limits metadata values to 500 characters per row.
            if (val.length > 500) val = val.substring(0, 497) + "...";
            
            // Creates a clean vertical list in your dashboard: Item_1, Item_2, etc.
            metadataObj[`Item_${index + 1}`] = val;
        });

        // Whispers to Stripe to lock in the payment amount and attach the clean order details
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            description: 'Pricepoint Jewelry Order',
            metadata: metadataObj
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
