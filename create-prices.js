require('dotenv').config({ path: '.env.local' });
console.log('Script started');
const key = process.env.STRIPE_SECRET_KEY;
console.log('Key length:', key ? key.length : 'undefined');

try {
    var stripe = require('stripe')(key);
    console.log('Stripe initialized');
} catch (e) {
    console.error('Failed to init stripe:', e);
    process.exit(1);
}

async function main() {
    const product = 'prod_TixCueVxNOw6Ge';
    console.log('Product:', product);

    try {
        const monthly = await stripe.prices.create({
            product,
            unit_amount: 2999,
            currency: 'brl',
            recurring: { interval: 'month' },
            nickname: 'Pro Monthly 29.99'
        });
        console.log('Monthly Price ID:', monthly.id);

        const yearly = await stripe.prices.create({
            product,
            unit_amount: 29999,
            currency: 'brl',
            recurring: { interval: 'year' },
            nickname: 'Pro Yearly 299.99'
        });
        console.log('Yearly Price ID:', yearly.id);
    } catch (e) {
        console.error('Error creating prices:', e);
    }
}

main();
