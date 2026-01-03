import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Remove top-level init
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
import { getStripeServer } from "@/lib/stripe-server";

export async function POST(req: NextRequest) {
    try {
        const { priceId, userId, email } = await req.json();

        if (!priceId || !userId) {
            return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 });
        }

        const stripe = getStripeServer();

        // Optional: Search for existing customer by email to avoid duplicates
        let customerId;
        if (email) {
            const customers = await stripe.customers.list({ email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            }
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            customer_email: customerId ? undefined : email,
            mode: "subscription",
            billing_address_collection: 'auto',
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${req.nextUrl.origin}/settings?success=true`,
            cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
            metadata: {
                userId,
            },
            subscription_data: {
                metadata: {
                    userId,
                },
            },
            allow_promotion_codes: true,
            locale: 'pt-BR',
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
