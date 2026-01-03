import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
import { getStripeServer } from "@/lib/stripe-server";

export async function POST(req: NextRequest) {
    try {
        const { customerId } = await req.json();

        if (!customerId) {
            return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
        }

        const stripe = getStripeServer();

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.nextUrl.origin}/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating portal session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
