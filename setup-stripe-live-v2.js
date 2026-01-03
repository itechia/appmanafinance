require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
    try {
        const newProduct = await stripe.products.create({ name: 'Maná Finance Pro ' + Date.now() });
        const monthly = await stripe.prices.create({
            product: newProduct.id,
            unit_amount: 2999,
            currency: 'brl',
            recurring: { interval: 'month' },
            nickname: 'Pro Monthly'
        });
        const yearly = await stripe.prices.create({
            product: newProduct.id,
            unit_amount: 29999,
            currency: 'brl',
            recurring: { interval: 'year' },
            nickname: 'Pro Yearly'
        });

        console.log("PID=" + newProduct.id);
        console.log("PM=" + monthly.id);
        console.log("PY=" + yearly.id);

    } catch (e) {
        console.error("ERR=" + e.message);
    }
})();
