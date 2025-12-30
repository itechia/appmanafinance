import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders })
        }

        const { priceId } = await req.json()

        // Determine mode based on price (hacky check or just assume subscription for monthly)
        // For this specific implementation:
        // Monthly (price_1SYtDfHDtWNlSWhd0uorbFl1) -> Subscription
        // Annual (price_1SYtDhHDtWNlSWhdBIP57Are) -> Payment (with installments) OR Subscription

        // Since we created them as one-time prices in the previous step (my mistake/limitation),
        // we should treat them as one-time payments that grant access for a period.
        // However, for "subscription", Stripe expects 'subscription' mode and a recurring price.
        // If we use 'payment' mode, it's a one-time charge.

        // Let's assume for now we use 'payment' mode for both since the prices are one-time.
        // We will handle the "subscription" logic manually in the webhook (expiring date).

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "boleto"], // Add 'pix' if enabled in Stripe Dashboard
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${req.headers.get("origin")}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get("origin")}/settings`,
            client_reference_id: user.id,
            customer_email: user.email,
            // Enable installments for the annual plan if it's the annual price
            payment_method_options: priceId === 'price_1SYtDhHDtWNlSWhdBIP57Are' ? {
                card: {
                    installments: {
                        enabled: true,
                    },
                },
            } : undefined,
        })

        return new Response(JSON.stringify({ sessionId: session.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }
})
