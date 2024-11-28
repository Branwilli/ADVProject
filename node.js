const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const stripe = Stripe('sk_test_your_secret_key');  // Replace with your Stripe Secret Key

const app = express();
const port = 3000;

// Parse incoming JSON requests
app.use(bodyParser.json());

// Payment processing endpoint
app.post('/payment', async (req, res) => {
    const { token, nameOnCard } = req.body;  // Expect a payment token from the frontend

    try {
        // Create a charge using Stripe's API
        const charge = await stripe.charges.create({
            amount: 2000,  // The amount in cents (e.g., $20.00)
            currency: 'usd',
            description: 'Example Payment',
            source: token,  // Token from Stripe.js
            receipt_email: 'customer@example.com',  // Optional: Send a receipt email
            metadata: { nameOnCard: nameOnCard }
        });

        // Respond with success if the charge was processed successfully
        res.json({ status: "SUCCESS", chargeId: charge.id });
    } catch (err) {
        console.error(err);
        // Respond with failure if there was an error
        res.status(500).json({ status: "FAILED", error: err.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

