require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
    try {
        console.log("Checking Live Account...");
        const account = await stripe.accounts.retrieve();
        console.log("Account ID:", account.id);

        const productId = 'prod_TixCueVxNOw6Ge'; // The ID currently in products.ts
        // Check if product exists
        try {
            await stripe.products.retrieve(productId);
            console.log("Product exists:", productId);
        } catch (e) {
            console.log("Product not found, creating new 'Maná Finance Pro'...");
            const prod = await stripe.products.create({ name: 'Maná Finance Pro' });
            console.log("New Product Created:", prod.id);
            // We need to update products.ts with this new ID if the old one didn't exist
            console.log("UPDATE_PRODUCT_ID:" + prod.id);
        }

        // Create Prices (we'll just create new ones to be sure they are linked to the correct product and account)
        // Or we could list prices for the product.

        console.log("Creating/Verifying Prices...");

        // We will create new prices to ensure we have valid ones for this account.
        // Since we don't store the "new" product ID in a variable if we just found it, let's just make a new set of prices for the valid product.
        // Wait, if I created a new product, I need to use THAT id.

        // Let's just create a fresh Product and Prices to be absolutely safe and clean for this new Key.
        // This ensures no mismatch.

        const newProduct = await stripe.products.create({ name: 'Maná Finance Pro ' + new Date().toISOString().split('T')[0] });
        console.log("Created Fresh Product:", newProduct.id);

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

        console.log("--- CONFIG DATA ---");
        console.log("PRODUCT_ID:" + newProduct.id);
        console.log("PRICE_MONTHLY:" + monthly.id);
        console.log("PRICE_YEARLY:" + yearly.id);
        console.log("-------------------");

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
