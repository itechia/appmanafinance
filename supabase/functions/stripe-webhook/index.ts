import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature")

    if (!signature) {
        return new Response("No signature", { status: 400 })
    }

    const body = await req.text()
    let event

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get("STRIPE_WEBHOOK_SECRET") as string,
            undefined,
            cryptoProvider
        )
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    if (event.type === "checkout.session.completed") {
        const session = event.data.object
        const userId = session.client_reference_id
        const subscriptionId = session.subscription
        const customerId = session.customer

        if (userId) {
            // Calculate end date (default 30 days for monthly, 365 for annual)
            // Ideally we fetch the subscription details from Stripe to get current_period_end
            let endDate = new Date()
            if (session.mode === 'subscription') {
                // For subscriptions, we should fetch the subscription object
                // But for now let's just assume active
            } else {
                // One-time payment (Annual with installments)
                // Assuming annual for one-time payments in this context
                endDate.setFullYear(endDate.getFullYear() + 1)
            }

            await supabase
                .from("users")
                .update({
                    subscription_plan: "pro",
                    subscription_status: "active",
                    subscription_provider: "stripe",
                    subscription_id: typeof subscriptionId === 'string' ? subscriptionId : null,
                    subscription_end_date: endDate.toISOString(),
                })
                .eq("id", userId)
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    })
})
