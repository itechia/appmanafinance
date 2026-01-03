const fetch = require('node-fetch'); // Might need generic fetch if node 18+
// In Node 18+ fetch is global.

(async () => {
    try {
        console.log('Testing Checkout API...');
        const response = await fetch('http://localhost:3000/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: 'price_fake',
                userId: 'user_fake',
                email: 'test@example.com'
            })
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response Content-Type:', response.headers.get('content-type'));
        console.log('Response Body Preview:', text.substring(0, 500));
    } catch (e) {
        console.error('Request failed:', e);
    }
})();
