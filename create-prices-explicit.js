require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
    try {
        const product = 'prod_TixCueVxNOw6Ge';
        console.log('Creating prices for:', product);

        const monthly = await stripe.prices.create({
            product,
            unit_amount: 2999,
            currency: 'brl',
            recurring: { interval: 'month' },
            nickname: 'Pro Monthly (29.99)'
        });
        console.log('Monthly Price ID:', monthly.id);

        const yearly = await stripe.prices.create({
            product,
            unit_amount: 29999,
            currency: 'brl',
            recurring: { interval: 'year' },
            nickname: 'Pro Yearly (299.99)'
        });
        console.log('Yearly Price ID:', yearly.id);
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
