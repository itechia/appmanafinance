const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
console.log('Key:', process.env.STRIPE_SECRET_KEY ? 'Found' : 'Missing');
(async () => {
    try {
        const p = await stripe.prices.create({
            product: 'prod_TixCueVxNOw6Ge',
            unit_amount: 2999,
            currency: 'brl',
            recurring: { interval: 'month' },
            nickname: 'Pro Monthly'
        });
        console.log('Monthly:', p.id);
        const y = await stripe.prices.create({
            product: 'prod_TixCueVxNOw6Ge',
            unit_amount: 29999,
            currency: 'brl',
            recurring: { interval: 'year' },
            nickname: 'Pro Yearly'
        });
        console.log('Yearly:', y.id);
    } catch (e) { console.error(e.message); }
})();
