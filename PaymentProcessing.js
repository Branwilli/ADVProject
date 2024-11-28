const crypto = require('crypto');
const fetch = require('node-fetch');  // You can also use 'axios' in Node.js
const { Semaphore } = require('await-semaphore');  // For concurrency control
const MAX_CONCURRENT_TRANSACTIONS = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const ENCRYPTION_KEY = "my-secret-encryption-key";  // Should be stored securely

class PaymentProcessing {
    constructor() {
        this.semaphore = new Semaphore(MAX_CONCURRENT_TRANSACTIONS);
    }

    // Method to process payment asynchronously
    async processPayment(cardNumber, cardExpiry, cvv) {
        const release = await this.semaphore.acquire();
        try {
            if (!this.isValidCardNumber(cardNumber)) {
                console.warn("Invalid card number.");
                return;
            }

            // Encrypt card details before transmission
            const encryptedCardNumber = this.encrypt(cardNumber);
            const encryptedCvv = this.encrypt(cvv);

            // Send payment to bank API with retry logic
            const paymentSuccess = await this.sendPaymentToBankAPIWithRetry(encryptedCardNumber, encryptedCvv, cardExpiry);
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
    async sendPaymentToBankAPIWithRetry(encryptedCardNumber, encryptedCvv, cardExpiry) {
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                // Simulating an API call to the bank's payment gateway
                return await this.sendPaymentToBankAPI(encryptedCardNumber, encryptedCvv, cardExpiry);
            } catch (e) {
                retries++;
                console.warn(`API call failed. Attempt ${retries} of ${MAX_RETRIES}`);
                if (retries < MAX_RETRIES) {
                    await this.sleep(RETRY_DELAY_MS * Math.pow(2, retries));  // Exponential backoff
                } else {
                    console.error("Max retries reached. Payment failed.");
                }
            }
        }
        return false;
    }

    // Simulated API call to the bank (replace with actual API call)
    async sendPaymentToBankAPI(encryptedCardNumber, encryptedCvv, cardExpiry) {
        const apiUrl = "https://api.bank.com/payment";  // Use the actual bank's API URL here

        // Ensure the API URL is HTTPS
        if (!apiUrl.startsWith("https://")) {
            throw new Error("Only HTTPS is allowed for communication with the payment gateway.");
        }

        // Setup the HTTPS request to the bank API using fetch
        const payload = JSON.stringify({
            cardNumber: encryptedCardNumber,
            cvv: encryptedCvv,
            expiry: cardExpiry
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });

        if (response.ok) {
            console.log("Payment processed successfully.");
            return true;
        } else {
            console.warn(`Payment failed with response code: ${response.status}`);
            return false;
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

    // Encrypt data using AES encryption
    encrypt(data) {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf-8'), Buffer.from(ENCRYPTION_KEY, 'utf-8').slice(0, 16)); // Initialization vector
        let encrypted = cipher.update(data, 'utf-8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
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
paymentProcessing.processPayment("4111111111111111", "12/25", "123");
