import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // 1. Get user profile to find stripe_customer_id
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", userId)
            .single();

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: "User has no Stripe Customer ID" }, { status: 404 });
        }

        // 2. Check subscriptions in Stripe
        const stripe = getStripeServer();
        const subscriptions = await stripe.subscriptions.list({
            customer: profile.stripe_customer_id,
            status: "active",
            limit: 1,
        });

        const activeSub = subscriptions.data[0];

        if (activeSub) {
            // 3. Update Profile to Pro
            await supabaseAdmin
                .from("profiles")
                .update({
                    plan: "pro",
                    subscription_id: activeSub.id,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

            return NextResponse.json({ success: true, plan: "pro" });
        } else {
            // 3b. Verify if it was just created but maybe status is 'trialing' or similar, 
            // but usually 'active' is enough for paid.
            // If not found, maybe payment failed or delayed.

            // Check for incomplete subscriptions (payment processing)
            const incompleteSubs = await stripe.subscriptions.list({
                customer: profile.stripe_customer_id,
                status: "incomplete",
                limit: 1
            });

            if (incompleteSubs.data.length > 0) {
                return NextResponse.json({ success: false, message: "Pagamento em processamento." });
            }

            return NextResponse.json({ success: false, message: "Nenhuma assinatura ativa encontrada." });
        }

    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
