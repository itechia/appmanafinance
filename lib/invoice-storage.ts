import { localStorage } from "./storage-helpers"
import type { CreditCardInvoice, InvoicePayment } from "./types/card"

const INVOICES_KEY = "credit_card_invoices"
const PAYMENTS_KEY = "invoice_payments"

class InvoiceStorage {
  // ==================== INVOICES ====================

  getInvoices(userId: string, workspaceId: string): CreditCardInvoice[] {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    return allInvoices.filter((inv) => inv.userId === userId && inv.workspaceId === workspaceId)
  }

  getInvoicesByCard(userId: string, workspaceId: string, cardId: string): CreditCardInvoice[] {
    return this.getInvoices(userId, workspaceId).filter((inv) => inv.cardId === cardId)
  }

  getCurrentInvoice(userId: string, workspaceId: string, cardId: string): CreditCardInvoice | null {
    const now = new Date()
    const invoices = this.getInvoicesByCard(userId, workspaceId, cardId)

    return (
      invoices.find(
        (inv) => inv.month === now.getMonth() + 1 && inv.year === now.getFullYear() && inv.status === "open",
      ) || null
    )
  }

  addInvoice(invoice: Omit<CreditCardInvoice, "id" | "createdAt" | "updatedAt">): CreditCardInvoice {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []

    const newInvoice: CreditCardInvoice = {
      ...invoice,
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    allInvoices.push(newInvoice)
    localStorage.set(INVOICES_KEY, allInvoices)

    return newInvoice
  }

  updateInvoice(invoiceId: string, updates: Partial<CreditCardInvoice>): void {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const index = allInvoices.findIndex((inv) => inv.id === invoiceId)

    if (index !== -1) {
      allInvoices[index] = {
        ...allInvoices[index],
        ...updates,
        updatedAt: new Date(),
      }
      localStorage.set(INVOICES_KEY, allInvoices)
    }
  }

  deleteInvoice(invoiceId: string): void {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const filtered = allInvoices.filter((inv) => inv.id !== invoiceId)
    localStorage.set(INVOICES_KEY, filtered)
  }

  // ==================== PAYMENTS ====================

  getPayments(userId: string, workspaceId: string): InvoicePayment[] {
    const allPayments = localStorage.get<InvoicePayment[]>(PAYMENTS_KEY) || []
    return allPayments.filter((pay) => pay.userId === userId && pay.workspaceId === workspaceId)
  }

  getPaymentsByInvoice(invoiceId: string): InvoicePayment[] {
    const allPayments = localStorage.get<InvoicePayment[]>(PAYMENTS_KEY) || []
    return allPayments.filter((pay) => pay.invoiceId === invoiceId)
  }

  addPayment(payment: Omit<InvoicePayment, "id" | "createdAt">): InvoicePayment {
    const allPayments = localStorage.get<InvoicePayment[]>(PAYMENTS_KEY) || []

    const newPayment: InvoicePayment = {
      ...payment,
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    allPayments.push(newPayment)
    localStorage.set(PAYMENTS_KEY, allPayments)

    return newPayment
  }

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Determina a qual fatura uma transação pertence baseado na data e dia de fechamento
   */
  getInvoiceForTransaction(
    userId: string,
    workspaceId: string,
    cardId: string,
    transactionDate: Date,
    closingDay: number,
  ): CreditCardInvoice {
    const txDate = new Date(transactionDate)
    const txDay = txDate.getDate()
    const txMonth = txDate.getMonth() + 1
    const txYear = txDate.getFullYear()

    // Se a transação foi feita no dia ou após o fechamento, vai para o mês seguinte
    let invoiceMonth = txMonth
    let invoiceYear = txYear

    if (txDay >= closingDay) {
      invoiceMonth++
      if (invoiceMonth > 12) {
        invoiceMonth = 1
        invoiceYear++
      }
    }

    // Busca ou cria a fatura
    let invoice = this.getInvoices(userId, workspaceId).find(
      (inv) => inv.cardId === cardId && inv.month === invoiceMonth && inv.year === invoiceYear,
    )

    if (!invoice) {
      // Cria nova fatura
      const closingDate = new Date(invoiceYear, invoiceMonth - 1, closingDay)
      const dueDate = new Date(closingDate)
      dueDate.setDate(dueDate.getDate() + 7) // Vencimento 7 dias após fechamento (ajustável)

      invoice = this.addInvoice({
        cardId,
        userId,
        workspaceId,
        month: invoiceMonth,
        year: invoiceYear,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        minimumPayment: 0,
        closingDate,
        dueDate,
        status: "open",
        transactionIds: [],
      })
    }

    return invoice
  }

  /**
   * Adiciona uma transação à fatura e atualiza os valores
   */
  addTransactionToInvoice(invoiceId: string, transactionId: string, amount: number): void {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const index = allInvoices.findIndex((inv) => inv.id === invoiceId)

    if (index !== -1) {
      const invoice = allInvoices[index]

      if (!invoice.transactionIds.includes(transactionId)) {
        invoice.transactionIds.push(transactionId)
        invoice.totalAmount += amount
        invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount
        invoice.minimumPayment = invoice.totalAmount * 0.15 // 15% do total como mínimo
        invoice.updatedAt = new Date()

        localStorage.set(INVOICES_KEY, allInvoices)
      }
    }
  }

  /**
   * Processa pagamento de fatura
   */
  processInvoicePayment(
    invoiceId: string,
    amount: number,
    paymentMethod: "wallet" | "debit_card",
    paymentSourceId: string,
    userId: string,
    workspaceId: string,
  ): InvoicePayment {
    // Registra o pagamento
    const payment = this.addPayment({
      invoiceId,
      userId,
      workspaceId,
      amount,
      paymentDate: new Date(),
      paymentMethod,
      paymentSourceId,
    })

    // Atualiza a fatura
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const index = allInvoices.findIndex((inv) => inv.id === invoiceId)

    if (index !== -1) {
      const invoice = allInvoices[index]
      invoice.paidAmount += amount
      invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount

      // Atualiza status
      if (invoice.remainingAmount <= 0) {
        invoice.status = "paid"
        invoice.paidDate = new Date()
      } else if (invoice.paidAmount > 0) {
        invoice.status = "partial"
      }

      invoice.updatedAt = new Date()
      localStorage.set(INVOICES_KEY, allInvoices)
    }

    return payment
  }

  /**
   * Cria plano de parcelamento para fatura atrasada
   */
  createInstallmentPlan(invoiceId: string, downPayment: number, totalInstallments: number, interestRate: number): void {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const index = allInvoices.findIndex((inv) => inv.id === invoiceId)

    if (index !== -1) {
      const invoice = allInvoices[index]
      const remainingAfterDown = invoice.remainingAmount - downPayment

      // Calcula valor da parcela com juros
      const monthlyRate = interestRate / 100
      const installmentAmount = (remainingAfterDown * (1 + monthlyRate * totalInstallments)) / totalInstallments

      invoice.installmentPlan = {
        totalInstallments,
        paidInstallments: 0,
        installmentAmount,
        interestRate,
        downPayment,
      }

      // Processa entrada se houver
      if (downPayment > 0) {
        invoice.paidAmount += downPayment
        invoice.remainingAmount -= downPayment
      }

      invoice.updatedAt = new Date()
      localStorage.set(INVOICES_KEY, allInvoices)
    }
  }

  /**
   * Verifica faturas vencidas e atualiza status
   */
  checkOverdueInvoices(userId: string, workspaceId: string): CreditCardInvoice[] {
    const allInvoices = localStorage.get<CreditCardInvoice[]>(INVOICES_KEY) || []
    const now = new Date()
    const overdueInvoices: CreditCardInvoice[] = []

    allInvoices.forEach((invoice) => {
      if (
        invoice.userId === userId &&
        invoice.workspaceId === workspaceId &&
        invoice.status === "open" &&
        new Date(invoice.dueDate) < now
      ) {
        invoice.status = "overdue"
        invoice.updatedAt = new Date()
        overdueInvoices.push(invoice)
      }
    })

    if (overdueInvoices.length > 0) {
      localStorage.set(INVOICES_KEY, allInvoices)
    }

    return overdueInvoices
  }
}

export const invoiceStorage = new InvoiceStorage()
