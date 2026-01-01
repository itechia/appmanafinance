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

        const { priceId, interval } = await req.json()

        // Real Recurring Price IDs verified from Stripe (New Account)
        const MONTHLY_PRICE_ID = "price_1Sko1WQfKOjb4zhJyzSnNH4S"
        const YEARLY_PRICE_ID = "price_1Sko1WQfKOjb4zhJ1AtgiBKW"

        // Determine correct price ID if not provided specific one, or validate
        let finalPriceId = priceId
        if (interval === "year") finalPriceId = YEARLY_PRICE_ID
        if (interval === "month") finalPriceId = MONTHLY_PRICE_ID

        // Verify if it is one of our valid prices
        if (finalPriceId !== MONTHLY_PRICE_ID && finalPriceId !== YEARLY_PRICE_ID) {
            // Fallback to monthly if something is wrong, or return error. 
            // Let's default to Monthly for safety if invalid input.
            finalPriceId = MONTHLY_PRICE_ID
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "boleto"],
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: "subscription", // Restored 'subscription' mode for recurring billing
            allow_promotion_codes: true, // Enable Coupons!
            success_url: `${req.headers.get("origin")}/settings?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get("origin")}/pricing`,
            client_reference_id: user.id,
            customer_email: user.email,
            metadata: {
                userId: user.id, // Redundant but good for double check
                planType: finalPriceId === YEARLY_PRICE_ID ? "yearly" : "monthly"
            }
        })

        return new Response(JSON.stringify({ sessionId: session.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Checkout error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }
})
