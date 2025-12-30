export type PlanType = "free" | "pro"

export interface Subscription {
  id: string
  userId: string
  plan: PlanType
  status: "active" | "canceled" | "expired" | "pending"
  startDate: Date
  expiresAt?: Date
  paymentMethod?: "credit_card" | "pix" | "boleto"
  amount?: number
  interval?: "monthly" | "yearly"
  mercadoPagoSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PlanFeatures {
  name: string
  price: {
    monthly: number
    yearly: number
    yearlyInstallments: { count: number; value: number }
  }
  features: string[]
  restrictions: string[]
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    name: "Gratuito",
    price: {
      monthly: 0,
      yearly: 0,
      yearlyInstallments: { count: 0, value: 0 },
    },
    features: [
      "Dashboard financeiro",
      "Gerenciamento de transações",
      "1 carteira",
      "2 cartões",
      "Orçamentos básicos",
      "Calendário de transações",
    ],
    restrictions: [
      "Máximo 1 carteira",
      "Máximo 2 cartões",
      "Sem relatórios avançados",
      "Sem objetivos financeiros",
      "Sem integração WhatsApp",
    ],
  },
  pro: {
    name: "Pro",
    price: {
      monthly: 39.99,
      yearly: 399.99,
      yearlyInstallments: { count: 10, value: 39.99 },
    },
    features: [
      "Tudo do plano Gratuito",
      "Carteiras e cartões ilimitados",
      "Relatórios avançados e insights",
      "Objetivos financeiros ilimitados",
      "Integração com WhatsApp",
      "Suporte prioritário",
      "Exportação de dados",
      "Análises preditivas",
    ],
    restrictions: [],
  },
}

export const PRO_ONLY_ROUTES = [
  "/relatorios",
  "/reports",
  "/goals",
  "/objetivos",
  "/settings/connections",
  "/settings/whatsapp",
]
