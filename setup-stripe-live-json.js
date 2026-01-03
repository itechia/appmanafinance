require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');

(async () => {
    try {
        // Just create new ones, it's safer to be sure.
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

        const data = {
            product: newProduct.id,
            monthly: monthly.id,
            yearly: yearly.id
        };

        fs.writeFileSync('ids.json', JSON.stringify(data, null, 2));
        console.log("Done");

    } catch (e) {
        console.error("ERR=" + e.message);
    }
})();
