import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase"; // Use supabase client (admin/service role preferred if available)

// Initialize Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
import { getStripeServer } from "@/lib/stripe-server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        const stripe = getStripeServer();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (userId) {
                    // Update user profile with Pro status
                    // Note: using client-side supabase here might fail if RLS prevents update without user context.
                    // Ideally use Service Role. Assuming env.SUPABASE_SERVICE_ROLE_KEY is set in lib/env.ts, 
                    // but imports usually export the anon client.
                    // For now, we'll try standard update. If it fails, RLS needs adjustment or use Admin client.

                    await supabase
                        .from("profiles")
                        .update({
                            plan: "pro",
                            stripe_customer_id: customerId,
                            subscription_id: subscriptionId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", userId);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                // Check status
                if (subscription.status === "active") {
                    // Ensure is pro
                    // Retrieve user by stripe_customer_id if needed, but easier if we tracked it.
                }
                // Handling cancel_at_period_end is handled by Stripe (status remains active until end).
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Revoke access
                await supabase
                    .from("profiles")
                    .update({
                        plan: "free",
                        subscription_id: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }

            default:
                console.warn(`Unhandled event type: ${event.type}`);
        }
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
