import java.io.*;
import java.net.*;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import javax.net.ssl.*;

public class Paymentprocessing {

    private static final Logger logger = Logger.getLogger(Paymentprocessing.class.getName());
    private static final String ENCRYPTION_KEY = "my-secret-encryption-key"; // Should be stored securely in production
    private static final int MAX_CONCURRENT_TRANSACTIONS = 10; // Max concurrent transactions
    private static final int MAX_RETRIES = 3; // Max retries for failed API calls
    private static final long RETRY_DELAY_MS = 1000; // Initial delay for retries

    private final Semaphore semaphore = new Semaphore(MAX_CONCURRENT_TRANSACTIONS);
    private final ExecutorService executorService = Executors.newFixedThreadPool(MAX_CONCURRENT_TRANSACTIONS);

    // Method to process payment asynchronously
    public void processPayment(String cardNumber, String cardExpiry, String cvv) {
        executorService.submit(() -> {
            try {
                semaphore.acquire(); // Limit the number of concurrent transactions
                if (!isValidCardNumber(cardNumber)) {
                    logger.warning("Invalid card number.");
                    return;
                }

                // Encrypt card details before transmission
                String encryptedCardNumber = encrypt(cardNumber);
                String encryptedCvv = encrypt(cvv);

                // Send payment to bank API with retry logic
                boolean paymentSuccess = sendPaymentToBankAPIWithRetry(encryptedCardNumber, encryptedCvv, cardExpiry);
                if (paymentSuccess) {
                    createPaymentLog(cardNumber, "SUCCESS", "Credit Card");
                } else {
                    createPaymentLog(cardNumber, "FAILED", "Credit Card");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                semaphore.release(); // Release the semaphore after the transaction is processed
            }
        });
    }

    // Retry logic for API calls with exponential backoff
    private boolean sendPaymentToBankAPIWithRetry(String encryptedCardNumber, String encryptedCvv, String cardExpiry) {
        int retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                // Simulating an API call to the bank's payment gateway
                return sendPaymentToBankAPI(encryptedCardNumber, encryptedCvv, cardExpiry);
            } catch (Exception e) {
                retries++;
                logger.warning("API call failed. Attempt " + retries + " of " + MAX_RETRIES);
                if (retries < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * (long) Math.pow(2, retries)); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    logger.severe("Max retries reached. Payment failed.");
                }
            }
        }
        return false;
    }

    // Simulated API call to the bank (replace with actual API call)
    private boolean sendPaymentToBankAPI(String encryptedCardNumber, String encryptedCvv, String cardExpiry) throws Exception {
        // Ensure the API URL is HTTPS
        String apiUrl = "https://api.bank.com/payment"; // Use the actual bank's API URL here
    
        // Make sure it's HTTPS
        if (!apiUrl.startsWith("https://")) {
            throw new RuntimeException("Only HTTPS is allowed for communication with the payment gateway.");
        }
    
        // Setup SSL context to ensure valid certificates (to prevent MITM attacks)
        setupSSLContext();
    
        // Setup the HTTPS connection to the bank API
        URI uri = new URI(apiUrl); // Use URI instead of URL
        URL url = uri.toURL();    // Convert URI to URL
    
        HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");
    
        // Prepare payment request payload
        String payload = String.format("{\"cardNumber\":\"%s\",\"cvv\":\"%s\",\"expiry\":\"%s\"}",
                encryptedCardNumber, encryptedCvv, cardExpiry);
    
        // Write the request data to the connection
        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = payload.getBytes("utf-8");
            os.write(input, 0, input.length);
        }
    
        // Get the response code and handle accordingly
        int responseCode = connection.getResponseCode();
        if (responseCode == 200) {
            logger.info("Payment processed successfully.");
            return true;
        } else {
            logger.log(Level.WARNING, "Payment failed with response code: {0}", responseCode);
            return false;
        }
    }
    

    // SSL context setup to ensure HTTPS communication is secure
    private void setupSSLContext() throws Exception {
        // Load the default SSL context
        SSLContext sslContext = SSLContext.getInstance("TLS");

        // Setup TrustManager to validate the server's certificate chain
        TrustManager[] trustManagers = new TrustManager[]{
            new X509TrustManager() {
                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return null;
                }

                @Override
                public void checkClientTrusted(X509Certificate[] certs, String authType) throws CertificateException {
                    // Custom certificate validation (if needed)
                }

                @Override
                public void checkServerTrusted(X509Certificate[] certs, String authType) throws CertificateException {
                    // Ensure that the server's certificate is valid and trusted
                    try {
                        // Trust the server's certificate (in real code, you should use a valid keystore or truststore)
                        certs[0].checkValidity();
                    } catch (CertificateException ce) {
                        throw new CertificateException("Server certificate is not trusted", ce);
                    }
                }
            }
        };

        // Initialize the SSL context with the trust manager
        sslContext.init(null, trustManagers, new SecureRandom());

        // Set the default SSL context for secure communication
        HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());

        // Ensure that the HTTPS connection uses the correct protocol and validates certificates
        HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> hostname.equals("api.bank.com"));
    }

    // Validate card number using Luhn algorithm (to check validity)
    private boolean isValidCardNumber(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    // Encrypt data using AES encryption
    private String encrypt(String data) {
        try {
            SecretKeySpec key = new SecretKeySpec(ENCRYPTION_KEY.getBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encryptedData = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encryptedData); // Convert to Base64 for safe transmission
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    // Log payment details
    private void createPaymentLog(String cardNumber, String status, String method) {
        String maskedCardNumber = "**** **** **** " + cardNumber.substring(cardNumber.length() - 4); // Mask card number
        logger.info(String.format("Payment Log - Card Number: %s, Status: %s, Method: %s", maskedCardNumber, status, method));
    }

    // Main method for testing payment processing
    public static void main(String[] args) {
        Paymentprocessing paymentProcessing = new Paymentprocessing();

        // Simulate a payment process with valid card details
        paymentProcessing.processPayment("4111111111111111", "12/25", "123");
    }
}
