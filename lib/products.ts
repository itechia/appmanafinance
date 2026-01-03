export interface Product {
  id: string
  name: string
  description: string
  priceId?: string // Stripe price ID for real products
  stripeProductId?: string // Real Stripe Product ID
  priceInCents: number
  currency: string
  interval: "month" | "year"
  installments?: number
}

export const PRODUCTS: Product[] = [
  {
    id: "pro-monthly",
    name: "Maná Finance Pro (Mensal)",
    description: "Controle total das suas finanças com recursos avançados",
    priceId: "price_1SlVzxHMLhmVs81Vca5FHOZl",
    stripeProductId: "prod_Tixv59Bji8yvaK",
    priceInCents: 2999, // R$ 29,99
    currency: "brl",
    interval: "month",
  },
  {
    id: "pro-yearly",
    name: "Maná Finance Pro (Anual)",
    description: "Economize com o plano anual",
    priceId: "price_1SlVzxHMLhmVs81VhC3WLPke",
    stripeProductId: "prod_Tixv59Bji8yvaK",
    priceInCents: 29999, // R$ 299,99
    currency: "brl",
    interval: "year",
  },
]
