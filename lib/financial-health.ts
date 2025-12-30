import type { Transaction, Goal, Card } from "./types/app-types"
import type { Budget } from "./user-context"
import { differenceInMonths, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { getTransactionAccountDate } from "./invoice-utils"

export interface FinancialHealthScore {
  overall: number
  savings: number
  budgetCompliance: number
  goalProgress: number
  debtManagement: number
  consistency: number
}

export interface BudgetAnalysis {
  budgetId: string
  category: string
  limit: number
  spent: number
  remaining: number
  percentUsed: number
  status: "excellent" | "good" | "warning" | "critical" | "exceeded"
  trend: "improving" | "stable" | "worsening"
  recommendation: string
}

export interface GoalAnalysis {
  goalId: string
  name: string
  targetAmount: number
  currentAmount: number
  percentComplete: number
  daysRemaining: number
  requiredMonthlyContribution: number
  onTrack: boolean
  recommendation: string
  projectedCompletion: string
}

export interface SpendingPattern {
  category: string
  totalSpent: number
  transactionCount: number
  averageTransaction: number
  percentOfTotal: number
  trend: "increasing" | "stable" | "decreasing"
  isProblematic: boolean
  recommendation: string
}

export interface FinancialInsight {
  type: "success" | "warning" | "error" | "info"
  title: string
  description: string
  priority: number
}

/**
 * Calculates financial health score based on a specific date range.
 */
export function calculateFinancialHealth(
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  cards: Card[],
  userId?: string,
  startDate?: Date,
  endDate?: Date
): FinancialHealthScore {
  const safeTransactions = transactions || []
  const safeBudgets = budgets || []
  const safeGoals = goals || []
  const safeCards = cards || []

  const userTransactions = userId ? safeTransactions.filter((t) => t.userId === userId) : safeTransactions

  // Use provided range or default to current month
  const rangeStart = startDate || startOfMonth(new Date())
  const rangeEnd = endDate || endOfMonth(new Date())

  // Calculate number of months in range (min 1)
  const monthCount = Math.max(1, differenceInMonths(rangeEnd, rangeStart) + 1)

  // Filter transactions for period using ACCOUNTING DATE (Invoice cycle for credit)
  const periodTransactions = userTransactions.filter((t) => {
    const accDate = getTransactionAccountDate(t, safeCards)
    return isWithinInterval(accDate, { start: rangeStart, end: rangeEnd })
  })

  const income = periodTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const expenses = periodTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // 1. Savings Score (0-100)
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const savingsScore = Math.min(100, Math.max(0, savingsRate * 5)) // 20% savings = 100 points

  // 2. Budget Compliance Score (0-100)
  let budgetScore = 100
  if (safeBudgets.length > 0) {
    const budgetCompliance = safeBudgets.map((budget) => {
      const spent = periodTransactions
        .filter((t) => t.type === "expense" && t.category === budget.categoryName)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      // Pro-rate budget limit for the number of months in the filter
      const adjustLimit = budget.limit * monthCount
      return Math.min(150, (spent / adjustLimit) * 100) // Allow up to 150% for variance
    })
    const avgCompliance = budgetCompliance.reduce((sum, c) => sum + c, 0) / budgetCompliance.length
    budgetScore = Math.max(0, 100 - (avgCompliance > 100 ? (avgCompliance - 100) * 2 : 0))
  }

  // 3. Goal Progress Score (0-100)
  let goalScore = 50
  if (safeGoals.length > 0) {
    const goalProgress = safeGoals.map((goal) => (goal.currentAmount / goal.targetAmount) * 100)
    goalScore = goalProgress.reduce((sum, p) => sum + p, 0) / safeGoals.length
  }

  // 4. Debt Management Score (0-100)
  let debtScore = 100
  const creditCards = safeCards.filter((c) => (c.type === 'credit' || c.hasCredit) && c.limit)
  if (creditCards.length > 0) {
    const avgUtilization =
      creditCards.reduce((sum, c) => sum + ((c.used || 0) / (c.limit || 1)) * 100, 0) / creditCards.length
    debtScore = Math.max(0, 100 - avgUtilization * 1.5)
  }

  // 5. Consistency Score (0-100)
  // Simplified consistency for the period filtered vs previous equivalent period
  const consistencyScore = 85 // Fallback

  // Overall Score
  const overall = savingsScore * 0.35 + budgetScore * 0.25 + goalScore * 0.2 + debtScore * 0.2

  return {
    overall: Math.round(overall),
    savings: Math.round(savingsScore),
    budgetCompliance: Math.round(budgetScore),
    goalProgress: Math.round(goalScore),
    debtManagement: Math.round(debtScore),
    consistency: Math.round(consistencyScore),
  }
}

export function analyzeBudgets(
  transactions: Transaction[],
  budgets: Budget[],
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  cards: Card[] = []
): BudgetAnalysis[] {
  const safeTransactions = transactions || []
  const safeBudgets = budgets || []

  const userTransactions = userId ? safeTransactions.filter((t) => t.userId === userId) : safeTransactions
  const rangeStart = startDate || startOfMonth(new Date())
  const rangeEnd = endDate || endOfMonth(new Date())
  const monthCount = Math.max(1, differenceInMonths(rangeEnd, rangeStart) + 1)

  return safeBudgets.map((budget) => {
    // Current period spending
    const periodSpent = userTransactions
      .filter((t) => {
        const accDate = getTransactionAccountDate(t, cards)
        return (
          t.type === "expense" &&
          t.category === budget.categoryName &&
          isWithinInterval(accDate, { start: rangeStart, end: rangeEnd })
        )
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const adjustedLimit = budget.limit * monthCount
    const remaining = adjustedLimit - periodSpent
    const percentUsed = (periodSpent / adjustedLimit) * 100

    let status: BudgetAnalysis["status"]
    if (percentUsed > 100) status = "exceeded"
    else if (percentUsed >= 90) status = "critical"
    else if (percentUsed >= (budget.alertThreshold || 80)) status = "warning"
    else if (percentUsed >= 50) status = "good"
    else status = "excellent"

    let recommendation = ""
    if (status === "exceeded") {
      recommendation = `Orçamento excedido em R$ ${(periodSpent - adjustedLimit).toFixed(2)} para este período de ${monthCount} mês(es).`
    } else if (status === "critical") {
      recommendation = `Atenção! Você já usou ${percentUsed.toFixed(0)}% do orçamento total do período. Sobram R$ ${remaining.toFixed(2)}.`
    } else {
      recommendation = `Bom controle. Você utilizou ${percentUsed.toFixed(0)}% do teto proporcional para ${monthCount} mês(es).`
    }

    return {
      budgetId: budget.id,
      category: budget.categoryName || "Geral",
      limit: adjustedLimit,
      spent: periodSpent,
      remaining,
      percentUsed,
      status,
      trend: "stable",
      recommendation,
    }
  })
}

export function analyzeGoals(goals: Goal[], transactions: Transaction[], userId?: string): GoalAnalysis[] {
  const safeGoals = goals || []
  const now = new Date()

  return safeGoals.map((goal) => {
    const deadline = new Date(goal.deadline)
    const daysRemaining = Math.max(0, differenceInDays(deadline, now))
    const monthsRemaining = Math.max(0.1, daysRemaining / 30)

    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)
    const requiredMonthlyContribution = remainingAmount / monthsRemaining
    const percentComplete = (goal.currentAmount / goal.targetAmount) * 100

    // For simplicity, we check if the user is contributing enough based on historical context
    const onTrack = percentComplete >= (100 - (monthsRemaining * 5)) // Rough estimate

    let recommendation = ""
    if (percentComplete >= 100) {
      recommendation = `Parabéns! Meta ${goal.name} alcançada!`
    } else {
      recommendation = `Faltam R$ ${remainingAmount.toFixed(2)}. Contribua R$ ${requiredMonthlyContribution.toFixed(2)}/mês para atingir o prazo.`
    }

    return {
      goalId: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      percentComplete,
      daysRemaining,
      requiredMonthlyContribution,
      onTrack,
      recommendation,
      projectedCompletion: deadline.toLocaleDateString("pt-BR"),
    }
  })
}

export function analyzeSpendingPatterns(
  transactions: Transaction[],
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  cards: Card[] = []
): SpendingPattern[] {
  const safeTransactions = transactions || []
  const userTransactions = userId ? safeTransactions.filter((t) => t.userId === userId) : safeTransactions

  const rangeStart = startDate || startOfMonth(new Date())
  const rangeEnd = endDate || endOfMonth(new Date())

  const periodExpenses = userTransactions.filter((t) => {
    const accDate = getTransactionAccountDate(t, cards)
    return t.type === "expense" && isWithinInterval(accDate, { start: rangeStart, end: rangeEnd })
  })

  const totalExpenses = periodExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const categoryMap = new Map<string, Transaction[]>()
  periodExpenses.forEach((t) => {
    const existing = categoryMap.get(t.category) || []
    categoryMap.set(t.category, [...existing, t])
  })

  const patterns: SpendingPattern[] = []

  categoryMap.forEach((txs, category) => {
    const totalSpent = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const transactionCount = txs.length
    const averageTransaction = totalSpent / transactionCount
    const percentOfTotal = totalExpenses > 0 ? (totalSpent / totalExpenses) * 100 : 0

    const isProblematic = percentOfTotal > 25

    patterns.push({
      category,
      totalSpent,
      transactionCount,
      averageTransaction,
      percentOfTotal,
      trend: "stable",
      isProblematic,
      recommendation: isProblematic
        ? `${category} representa ${percentOfTotal.toFixed(0)}% das despesas. Considere reduzir.`
        : `Gastos em ${category} estão saudáveis.`,
    })
  })

  return patterns.sort((a, b) => b.totalSpent - a.totalSpent)
}

export function generateFinancialInsights(
  budgetAnalysis: BudgetAnalysis[],
  goalAnalysis: GoalAnalysis[],
  spendingPatterns: SpendingPattern[],
  healthScore: FinancialHealthScore,
): FinancialInsight[] {
  const insights: FinancialInsight[] = []

  // Budget insights
  const exceededBudgets = budgetAnalysis.filter((b) => b.status === "exceeded")
  if (exceededBudgets.length > 0) {
    insights.push({
      type: "error",
      title: `${exceededBudgets.length} Orçamento(s) Excedido(s)`,
      description: `Revise: ${exceededBudgets.map((b) => b.category).join(", ")}`,
      priority: 10,
    })
  }

  // Savings insight
  if (healthScore.savings < 30) {
    insights.push({
      type: "warning",
      title: "Taxa de Poupança Baixa",
      description: "Sua taxa de poupança está abaixo do ideal para o período.",
      priority: 8,
    })
  } else if (healthScore.savings > 70) {
    insights.push({
      type: "success",
      title: "Excelente Poupança!",
      description: "Você está convertendo grande parte da renda em patrimônio.",
      priority: 9,
    })
  }

  // Debt insight
  if (healthScore.debtManagement < 50) {
    insights.push({
      type: "error",
      title: "Uso Elevado de Crédito",
      description: "Seu limite de cartão está muito comprometido. Cuidado com os juros.",
      priority: 9,
    })
  }

  return insights.sort((a, b) => b.priority - a.priority)
}
