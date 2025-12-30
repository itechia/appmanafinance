import type { Transaction, Card } from "./types/app-types"
import { format, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getTransactionAccountDate } from "./invoice-utils"

export interface ReportFilters {
  startDate: Date
  endDate: Date
  userIds: string[]
  categories: string[]
  accounts: string[]
  types: ("income" | "expense" | "transfer")[]
}

export interface ReportMetrics {
  totalIncome: number
  totalExpense: number
  netBalance: number
  savingsRate: number
  transactionCount: number
  averageTransaction: number
  largestIncome: Transaction | null
  largestExpense: Transaction | null
  categoryBreakdown: { category: string; amount: number; percentage: number; count: number }[]
  monthlyTrend: { month: string; income: number; expense: number; balance: number }[]
  accountBreakdown: { account: string; income: number; expense: number; balance: number }[]
  userBreakdown: { userId: string; userName: string; income: number; expense: number; transactions: number }[]
  dailyAverage: { income: number; expense: number }
  topExpenseCategories: { category: string; amount: number; percentage: number }[]
  topIncomeCategories: { category: string; amount: number; percentage: number }[]
}

export function filterTransactions(transactions: Transaction[], filters: ReportFilters, cards: Card[] = []): Transaction[] {
  return transactions.filter((t) => {
    // Use Accounting Date (Invoice Date) for Credit Cards if cards are provided
    const accountingDate = cards.length > 0 ? getTransactionAccountDate(t, cards) : new Date(t.date)

    // Check Date Range using Accounting Date
    const dateInRange = isWithinInterval(accountingDate, { start: filters.startDate, end: filters.endDate })

    const userMatch = filters.userIds.length === 0 || filters.userIds.includes(t.userId)
    const categoryMatch = filters.categories.length === 0 || filters.categories.includes(t.category)
    const accountMatch = filters.accounts.length === 0 || filters.accounts.includes(t.account)
    const typeMatch = filters.types.length === 0 || filters.types.includes(t.type)

    return dateInRange && userMatch && categoryMatch && accountMatch && typeMatch
  })
}

export function calculateReportMetrics(transactions: Transaction[], filters: ReportFilters, cards: Card[] = []): ReportMetrics {
  const filteredTransactions = filterTransactions(transactions, filters, cards)

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netBalance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  const incomeTransactions = filteredTransactions.filter((t) => t.type === "income")
  const expenseTransactions = filteredTransactions.filter((t) => t.type === "expense")

  const largestIncome =
    incomeTransactions.length > 0
      ? incomeTransactions.reduce((max, t) => (Math.abs(t.amount) > Math.abs(max.amount) ? t : max))
      : null

  const largestExpense =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce((max, t) => (Math.abs(t.amount) > Math.abs(max.amount) ? t : max))
      : null

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number; type: "income" | "expense" }>()
  filteredTransactions.forEach((t) => {
    if (t.type === "transfer") return
    const current = categoryMap.get(t.category) || { amount: 0, count: 0, type: t.type }
    categoryMap.set(t.category, {
      amount: current.amount + Math.abs(t.amount),
      count: current.count + 1,
      type: t.type,
    })
  })

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: data.type === "expense" ? (data.amount / totalExpense) * 100 : (data.amount / totalIncome) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Top categories
  const topExpenseCategories = categoryBreakdown
    .filter((c) => filteredTransactions.find((t) => t.category === c.category && t.type === "expense"))
    .slice(0, 5)

  const topIncomeCategories = categoryBreakdown
    .filter((c) => filteredTransactions.find((t) => t.category === c.category && t.type === "income"))
    .slice(0, 5)

  // Monthly trend
  const monthlyMap = new Map<string, { income: number; expense: number }>()
  filteredTransactions.forEach((t) => {
    // Correctly attribute transaction to its accounting month (invoice month for credit)
    const date = cards.length > 0 ? getTransactionAccountDate(t, cards) : new Date(t.date)
    const monthKey = format(date, "MMM/yy", { locale: ptBR })
    const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 }
    if (t.type === "income") {
      current.income += Math.abs(t.amount)
    } else {
      current.expense += Math.abs(t.amount)
    }
    monthlyMap.set(monthKey, current)
  })

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Account breakdown
  const accountMap = new Map<string, { income: number; expense: number }>()
  filteredTransactions.forEach((t) => {
    const current = accountMap.get(t.account) || { income: 0, expense: 0 }
    if (t.type === "income") {
      current.income += Math.abs(t.amount)
    } else {
      current.expense += Math.abs(t.amount)
    }
    accountMap.set(t.account, current)
  })

  const accountBreakdown = Array.from(accountMap.entries()).map(([account, data]) => ({
    account,
    income: data.income,
    expense: data.expense,
    balance: data.income - data.expense,
  }))

  // User breakdown
  const userMap = new Map<string, { userName: string; income: number; expense: number; transactions: number }>()
  filteredTransactions.forEach((t) => {
    const current = userMap.get(t.userId) || { userName: t.userName || 'Usuário', income: 0, expense: 0, transactions: 0 }
    if (t.type === "income") {
      current.income += Math.abs(t.amount)
    } else if (t.type === "expense") {
      current.expense += Math.abs(t.amount)
    }
    current.transactions += 1
    userMap.set(t.userId, current)
  })

  const userBreakdown = Array.from(userMap.entries()).map(([userId, data]) => ({
    userId,
    userName: data.userName,
    income: data.income,
    expense: data.expense,
    transactions: data.transactions,
  }))

  // Daily averages
  const daysDiff = Math.max(
    1,
    Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const dailyAverage = {
    income: totalIncome / daysDiff,
    expense: totalExpense / daysDiff,
  }

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    transactionCount: filteredTransactions.length,
    averageTransaction:
      filteredTransactions.length > 0 ? (totalIncome + totalExpense) / filteredTransactions.length : 0,
    largestIncome,
    largestExpense,
    categoryBreakdown,
    monthlyTrend,
    accountBreakdown,
    userBreakdown,
    dailyAverage,
    topExpenseCategories,
    topIncomeCategories,
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
