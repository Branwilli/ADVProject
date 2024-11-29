const { Semaphore } = require('await-semaphore');  // For concurrency control
const Stripe = require('stripe');
const stripe = new Stripe('sk_test_51QQGb6GPtycaMgaR2rGxc3nvrHuBlGJg3VEGJXWoW0xJTuAdClCb7xATtugGOd0unPH73TJkj06j4kkuDd8mfUTv00gi1vthBF');  // Replace with your Stripe secret key

const MAX_CONCURRENT_TRANSACTIONS = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

class PaymentProcessing {
    constructor() {
        this.semaphore = new Semaphore(MAX_CONCURRENT_TRANSACTIONS);
    }

    // Method to process payment asynchronously using Stripe
    async processPayment(cardNumber, cardExpiry, cvv) {
        const release = await this.semaphore.acquire();
        try {
            if (!this.isValidCardNumber(cardNumber)) {
                console.warn("Invalid card number.");
                return;
            }

            // Send payment to Stripe with retry logic
            const paymentSuccess = await this.sendPaymentToStripeWithRetry(cardNumber, cardExpiry, cvv);
            if (paymentSuccess) {
                this.createPaymentLog(cardNumber, "SUCCESS", "Credit Card");
            } else {
                this.createPaymentLog(cardNumber, "FAILED", "Credit Card");
            }
        } catch (err) {
            console.error(err);
        } finally {
            release();  // Release the semaphore after the transaction is processed
        }
    }

    // Retry logic for API calls with exponential backoff
    async sendPaymentToStripeWithRetry(cardNumber, cardExpiry, cvv) {
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                // Attempt to process payment with Stripe
                return await this.sendPaymentToStripe(cardNumber, cardExpiry, cvv);
            } catch (e) {
                retries++;
                console.warn(`Stripe API call failed. Attempt ${retries} of ${MAX_RETRIES}`);
                if (retries < MAX_RETRIES) {
                    await this.sleep(RETRY_DELAY_MS * Math.pow(2, retries));  // Exponential backoff
                } else {
                    console.error("Max retries reached. Payment failed.");
                }
            }
        }
        return false;
    }

    // Method to send payment details to Stripe and process the payment
    async sendPaymentToStripe(cardNumber, cardExpiry, cvv) {
        const [expMonth, expYear] = cardExpiry.split('/').map(s => s.trim());
        try {
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: cardNumber,
                    exp_month: expMonth,
                    exp_year: expYear,
                    cvc: cvv,
                },
            });

            const paymentIntent = await stripe.paymentIntents.create({
                amount: 2000, // Amount in cents (e.g., $20.00)
                currency: 'usd',
                payment_method: paymentMethod.id,
                confirm: true,
            });

            console.log("Payment processed successfully with Stripe.");
            return paymentIntent.status === 'succeeded';
        } catch (error) {
            console.error("Error processing payment with Stripe:", error);
            throw error;
        }
    }

    // Sleep function for delay
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate card number using Luhn algorithm (to check validity)
    isValidCardNumber(cardNumber) {
        let sum = 0;
        let alternate = false;
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let n = parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 === 0;
    }

    // Log payment details
    createPaymentLog(cardNumber, status, method) {
        const maskedCardNumber = "**** **** **** " + cardNumber.slice(cardNumber.length - 4);  // Mask card number
        console.info(`Payment Log - Card Number: ${maskedCardNumber}, Status: ${status}, Method: ${method}`);
    }
}

// Example Usage
const paymentProcessing = new PaymentProcessing();

// Simulate a payment process with valid card details
paymentProcessing.processPayment("4242424242424242", "12/25", "123");  // Example test card from Stripe
