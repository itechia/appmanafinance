/**
 * Balance Calculator
 * Calcula saldos de forma consistente e confiável
 *
 * REGRA IMPORTANTE:
 * - Saldo Total = Carteiras + Cartões Débito + Objetivos
 * - Cartões de Crédito NÃO entram no saldo (apenas mostram limite disponível)
 */

import type { Transaction, Card, Wallet, Goal } from "./types/app-types"

export interface BalanceResult {
  total: number // Saldo real (dinheiro disponível)
  income: number // Total de receitas
  expenses: number // Total de despesas
  creditAvailable: number // Limite de crédito disponível (não é dinheiro real)
  creditUsed: number // Valor usado em cartões de crédito
  goalsBalance: number // Valor aplicado em objetivos
}

/**
 * Calcula o saldo total baseado na nova lógica:
 * Saldo Total = Carteiras + Cartões Débito + Objetivos
 * (NÃO inclui limite de cartão de crédito)
 */
export function calculateBalance(
  transactions: Transaction[],
  cards: Card[],
  wallets: Wallet[],
  goals: Goal[] = [],
): BalanceResult {
  // Calcular receitas e despesas das transações
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Saldo de carteiras (dinheiro real)
  const walletsBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)

  // Saldo de cartões de DÉBITO apenas (dinheiro real)
  const debitCardsBalance = cards
    .filter((c) => c.type === "debit" || (c.type === "both" && c.hasDebit))
    .reduce((sum, c) => sum + (c.balance || 0), 0)

  // Valor aplicado em objetivos (dinheiro real, mas "bloqueado")
  const goalsBalance = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0)

  // Limite de crédito disponível (NÃO é dinheiro real)
  const creditAvailable = cards
    .filter((c) => c.type === "credit" || (c.type === "both" && c.hasCredit))
    .reduce((sum, c) => {
      const limit = c.creditLimit || c.limit || 0
      const used = c.used || 0
      return sum + Math.max(0, limit - used)
    }, 0)

  // Valor usado em cartões de crédito
  const creditUsed = cards
    .filter((c) => c.type === "credit" || (c.type === "both" && c.hasCredit))
    .reduce((sum, c) => sum + (c.used || 0), 0)

  // SALDO TOTAL = Carteiras + Cartões Débito + Objetivos
  // (NÃO inclui crédito)
  const total = walletsBalance + debitCardsBalance + goalsBalance

  return {
    total,
    income,
    expenses,
    creditAvailable,
    creditUsed,
    goalsBalance,
  }
}

/**
 * Calcula o saldo de uma carteira específica baseado em transações
 */
export function calculateWalletBalance(walletId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.account === walletId || t.fromAccount === walletId || t.toAccount === walletId)
    .reduce((balance, t) => {
      if (t.type === "income" && t.account === walletId) {
        return balance + Math.abs(t.amount)
      } else if (t.type === "expense" && t.account === walletId) {
        return balance - Math.abs(t.amount)
      } else if (t.type === "transfer") {
        if (t.fromAccount === walletId) {
          return balance - Math.abs(t.amount)
        } else if (t.toAccount === walletId) {
          return balance + Math.abs(t.amount)
        }
      }
      return balance
    }, 0)
}

/**
 * Calcula o saldo de um cartão de DÉBITO específico
 */
export function calculateDebitCardBalance(cardId: string, transactions: Transaction[]): number {
  return transactions
    .filter(
      (t) => (t.account === cardId && t.cardFunction === "debit") || t.fromAccount === cardId || t.toAccount === cardId,
    )
    .reduce((balance, t) => {
      if (t.type === "income" && t.account === cardId) {
        return balance + Math.abs(t.amount)
      } else if (t.type === "expense" && t.account === cardId && t.cardFunction === "debit") {
        return balance - Math.abs(t.amount)
      } else if (t.type === "transfer") {
        if (t.fromAccount === cardId) {
          return balance - Math.abs(t.amount)
        } else if (t.toAccount === cardId) {
          return balance + Math.abs(t.amount)
        }
      }
      return balance
    }, 0)
}

/**
 * Calcula o valor USADO em um cartão de CRÉDITO específico
 * (não é saldo, é quanto foi gasto do limite)
 */
export function calculateCreditCardUsed(cardId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.account === cardId && t.cardFunction === "credit" && t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

/**
 * Calcula o saldo de um cartão (débito ou crédito)
 */
export function calculateCardBalance(cardId: string, transactions: Transaction[], card?: Card): number {
  if (!card) {
    // Fallback: assume débito
    return calculateDebitCardBalance(cardId, transactions)
  }

  if (card.type === "debit") {
    return calculateDebitCardBalance(cardId, transactions)
  } else if (card.type === "credit") {
    // Para crédito, retorna o limite disponível (não é saldo real)
    const used = calculateCreditCardUsed(cardId, transactions)
    const limit = card.creditLimit || card.limit || 0
    return Math.max(0, limit - used)
  } else if (card.type === "both") {
    // Para cartões mistos, retorna o saldo de débito
    return calculateDebitCardBalance(cardId, transactions)
  }

  return 0
}

/**
 * Valida se uma transação pode ser realizada
 */
export function validateTransaction(
  transaction: Omit<Transaction, "id" | "userId" | "date">,
  wallets: Wallet[],
  cards: Card[],
  transactions: Transaction[],
): { valid: boolean; error?: string } {
  // Validar transferência
  if (transaction.type === "transfer") {
    if (!transaction.fromAccount || !transaction.toAccount) {
      return { valid: false, error: "Origem e destino são obrigatórios para transferências" }
    }

    if (transaction.fromAccount === transaction.toAccount) {
      return { valid: false, error: "Origem e destino não podem ser iguais" }
    }

    // Verificar saldo da origem
    const fromWallet = wallets.find((w) => w.id === transaction.fromAccount)
    if (fromWallet) {
      const currentBalance = calculateWalletBalance(transaction.fromAccount, transactions)
      if (currentBalance < Math.abs(transaction.amount)) {
        return { valid: false, error: "Saldo insuficiente na carteira de origem" }
      }
    }

    const fromCard = cards.find((c) => c.id === transaction.fromAccount)
    if (fromCard && (fromCard.type === "debit" || fromCard.type === "both")) {
      const currentBalance = calculateDebitCardBalance(transaction.fromAccount, transactions)
      if (currentBalance < Math.abs(transaction.amount)) {
        return { valid: false, error: "Saldo insuficiente no cartão de origem" }
      }
    }
  }

  // Validar despesa
  if (transaction.type === "expense" && transaction.account) {
    const wallet = wallets.find((w) => w.id === transaction.account)
    if (wallet) {
      const currentBalance = calculateWalletBalance(transaction.account, transactions)
      if (currentBalance < Math.abs(transaction.amount)) {
        return { valid: false, error: "Saldo insuficiente na carteira" }
      }
    }

    const card = cards.find((c) => c.id === transaction.account)
    if (card) {
      if (transaction.cardFunction === "credit" || card.type === "credit") {
        // Validar limite de crédito
        const currentUsed = calculateCreditCardUsed(transaction.account, transactions)
        const limit = card.creditLimit || card.limit || 0
        if (currentUsed + Math.abs(transaction.amount) > limit) {
          return { valid: false, error: "Limite do cartão de crédito excedido" }
        }
      } else {
        // Validar saldo de débito usando o saldo atual do cartão
        // (calculateDebitCardBalance recalcula do zero e ignora saldo inicial se não hover transação)
        if ((card.balance || 0) < Math.abs(transaction.amount)) {
          return { valid: false, error: "Saldo insuficiente no cartão de débito" }
        }
      }
    }
  }

  return { valid: true }
}
