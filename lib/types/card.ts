export type CardType = "debit" | "credit"
export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "other"

export interface Card {
  id: string
  userId: string
  workspaceId: string
  name: string
  type: CardType
  brand: CardBrand
  lastFourDigits: string
  color: string
  icon: string
  balance: number // Para débito: saldo disponível; Para crédito: limite disponível

  // Campos específicos para cartão de crédito
  creditLimit?: number // Limite total do cartão
  closingDay?: number // Dia do fechamento da fatura (1-31)
  dueDay?: number // Dia do vencimento da fatura (1-31)

  createdAt: Date
  updatedAt: Date
}

export interface CreditCardInvoice {
  id: string
  cardId: string
  userId: string
  workspaceId: string

  // Período da fatura
  month: number // 1-12
  year: number

  // Valores
  totalAmount: number // Valor total da fatura
  paidAmount: number // Valor já pago
  remainingAmount: number // Valor restante
  minimumPayment: number // Valor mínimo para pagamento

  // Datas
  closingDate: Date // Data de fechamento
  dueDate: Date // Data de vencimento
  paidDate?: Date // Data do pagamento (se pago)

  // Status
  status: "open" | "paid" | "overdue" | "partial" // open: aberta, paid: paga, overdue: atrasada, partial: parcialmente paga

  // Parcelamento (se houver)
  installmentPlan?: {
    totalInstallments: number
    paidInstallments: number
    installmentAmount: number
    interestRate: number // Taxa de juros (%)
    downPayment: number // Valor de entrada
  }

  // Transações da fatura
  transactionIds: string[]

  createdAt: Date
  updatedAt: Date
}

export interface InvoicePayment {
  id: string
  invoiceId: string
  userId: string
  workspaceId: string

  amount: number
  paymentDate: Date
  paymentMethod: "wallet" | "debit_card" // De onde saiu o dinheiro
  paymentSourceId: string // ID da carteira ou cartão de débito

  notes?: string

  createdAt: Date
}
