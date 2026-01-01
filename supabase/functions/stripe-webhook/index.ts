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
            await supabase
                .from("profiles")
                .update({
                    plan: "pro",
                    stripe_customer_id: customerId,
                    stripe_subscription_id: typeof subscriptionId === 'string' ? subscriptionId : null,
                    subscription_status: "active",
                })
                .eq("id", userId)
        }
    } else if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object
        const status = subscription.status
        // We need to find the user by subscription_id or customer_id since client_reference_id is not here
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single()

        if (profile) {
            const isPro = status === 'active' || status === 'trialing'
            await supabase
                .from("profiles")
                .update({
                    plan: isPro ? "pro" : "free",
                    subscription_status: status,
                })
                .eq("id", profile.id)
        }
    } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object

        await supabase
            .from("profiles")
            .update({
                plan: "free",
                subscription_status: "canceled",
            })
            .eq("stripe_subscription_id", subscription.id)
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    })
})
