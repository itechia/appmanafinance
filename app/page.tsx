"use client"

import { useState, useMemo } from "react"
import { WalletIcon, TrendingUp, TrendingDown, Target } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { TransactionCalendar } from "@/components/dashboard/transaction-calendar"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { BudgetProgress } from "@/components/dashboard/budget-progress"
import { GoalsOverview } from "@/components/dashboard/goals-overview"
import { CardsOverview } from "@/components/dashboard/cards-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { Header } from "@/components/header"
import { useUser } from "@/lib/user-context"
import { calculateBalance } from "@/lib/balance-calculator"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { getInvoiceAmountForMonth, getInvoiceCycleForMonth } from "@/lib/invoice-utils"

export default function DashboardPage() {
  const { currentUser, transactions, goals, cards, wallets, categories, budgets, selectedDate: currentDate, setSelectedDate } = useUser()
  const { isCollapsed } = useSidebar()

  const stats = useMemo(() => {
    // ... (keep existing stats logic, it depends on transactions which are already dynamic)
    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && t.userId === currentUser?.id
    })

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear

    const previousMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear && t.userId === currentUser?.id
    })

    const balanceResult = calculateBalance(transactions, cards, wallets)


    // ...

    // Inside stats useMemo:
    // ...

    // Get IDs of credit cards to filter out their direct expenses
    const creditCardIds = cards.filter(c => c.hasCredit).map(c => c.id);

    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === "income" && t.category !== "Transferência")
      .reduce((sum, t) => sum + t.amount, 0)

    const prevIncome = previousMonthTransactions
      .filter((t) => t.type === "income" && t.category !== "Transferência")
      .reduce((sum, t) => sum + t.amount, 0)

    // 1. Calculate Standard Expenses (Wallet + Debit)
    // Exclude direct credit card expenses.
    const standardExpenses = currentMonthTransactions
      .filter((t) => {
        const isCreditCardExpense = t.type === "expense" && creditCardIds.includes(t.account) && t.cardFunction !== 'debit';
        const isWalletTransferExpense = t.type === "expense" && t.category === "Transferência" && wallets.some(w => w.id === t.account);

        return t.type === "expense" && !isCreditCardExpense && (t.category !== "Transferência" || isWalletTransferExpense);
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // 2. Calculate Credit Card Expenses (Projected vs Realized)
    let creditCardTotal = 0
    cards.filter(c => c.hasCredit).forEach(card => {
      // Check if there is a Payment (Transfer) to this card in the current month
      const payment = currentMonthTransactions.find(t =>
        t.type === 'income' &&
        t.category === 'Transferência' &&
        t.account === card.id
      )

      if (payment) {
        // If paid, use the payment amount (Realized)
        // Note: Payment enters as income to Card, but expense from Wallet. 
        // The "standardExpenses" already counts the expense from Wallet side (isWalletTransferExpense).
        // So we DO NOT add it again here.
        // Wait. 
        // If I paid R$ 100 via Transfer:
        // Wallet: -100 (Expense, Transfer). Included in standardExpenses.
        // Card: +100 (Income).
        // So "standardExpenses" ALREADY covers the realized payment.

        // Logic: If Paid, do NOTHING (standardExpenses covers it).
        // If NOT Paid, add Projected Invoice.

      } else {
        // Not paid yet. Add Projected Invoice.
        const projected = getInvoiceAmountForMonth(card, selectedYear, selectedMonth, transactions)
        creditCardTotal += projected
      }
    })

    const totalExpenses = standardExpenses + creditCardTotal

    // --- REPEAT FOR PREVIOUS MONTH (for diff) ---
    // (Simplified logic for previous month to keep it consistent)

    // Prev Standard
    const prevStandardExpenses = previousMonthTransactions
      .filter((t) => {
        const isCreditCardExpense = t.type === "expense" && creditCardIds.includes(t.account) && t.cardFunction !== 'debit';
        const isWalletTransferExpense = t.type === "expense" && t.category === "Transferência" && wallets.some(w => w.id === t.account);
        return t.type === "expense" && !isCreditCardExpense && (t.category !== "Transferência" || isWalletTransferExpense);
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Prev Credit
    let prevCreditCardTotal = 0
    cards.filter(c => c.hasCredit).forEach(card => {
      const payment = previousMonthTransactions.find(t => t.type === 'income' && t.category === 'Transferência' && t.account === card.id)
      if (!payment) {
        const projected = getInvoiceAmountForMonth(card,
          prevMonth, // Correct var from scope
          prevYear,
          transactions
        )
        prevCreditCardTotal += projected
      }
    })

    const prevExpenses = prevStandardExpenses + prevCreditCardTotal


    const prevTotalIncome = prevIncome
    const prevTotalExpenses = prevExpenses
    const prevNetChange = prevTotalIncome - prevTotalExpenses
    const currentNetChange = totalIncome - totalExpenses

    const prevTotalBalance = balanceResult.total - currentNetChange + prevNetChange

    const balanceChange = prevTotalBalance > 0 ? ((balanceResult.total - prevTotalBalance) / prevTotalBalance) * 100 : 0
    const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0
    const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0

    return {
      totalBalance: balanceResult.total,
      totalIncome,
      totalExpenses,
      budgetRemaining: totalIncome - totalExpenses,
      balanceChange,
      incomeChange,
      expenseChange,
    }
  }, [currentDate, currentUser?.id, transactions, cards, wallets])

  const categoryData = useMemo(() => {
    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    // Pre-calculate billing cycles for all credit cards for the selected month
    const cardCycles: Record<string, { start: Date, end: Date }> = {}
    cards.filter(c => c.hasCredit).forEach(c => {
      cardCycles[c.id] = getInvoiceCycleForMonth(c, selectedYear, selectedMonth)
    })

    const currentMonthExpenses = transactions.filter((t) => {
      if (t.type !== "expense" || t.category === "Transferência" || t.userId !== currentUser?.id) {
        return false
      }

      const tDate = new Date(t.date)

      // Determine if it's a credit operation
      // Check if account is a credit card
      const card = cards.find(c => c.id === t.account)
      const isCredit = card?.hasCredit && (t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit'))

      if (isCredit && card) {
        // Use Cash Basis: Match transaction to the INVOICE billing cycle
        // If the transaction date falls within the cycle for the Invoice DUE in this month, include it.
        const cycle = cardCycles[card.id]
        if (!cycle) return false
        return tDate >= cycle.start && tDate <= cycle.end
      } else {
        // Standard: Match Calendar Month
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear
      }
    })

    const categoryMap: { [key: string]: { value: number; color: string } } = {}

    // Initialize with all expense categories
    categories.filter(c => c.type === 'expense').forEach(c => {
      categoryMap[c.name] = { value: 0, color: c.color }
    })

    currentMonthExpenses.forEach((t) => {
      if (categoryMap[t.category]) {
        categoryMap[t.category].value += Math.abs(t.amount)
      } else {
        // Handle transactions with categories that might not be in the list (e.g. deleted)
        // or if they are just not in the initial filter
        if (!categoryMap[t.category]) {
          // Try to find color from categories list even if not expense (unlikely but possible)
          const cat = categories.find(c => c.name === t.category)
          categoryMap[t.category] = { value: 0, color: cat?.color || "#808080" }
        }
        categoryMap[t.category].value += Math.abs(t.amount)
      }
    })

    return Object.entries(categoryMap)
      .map(([name, data]) => ({ name, ...data }))
      .filter((item) => item.value > 0)
  }, [currentDate, currentUser?.id, transactions, categories])

  const filteredTransactions = useMemo(() => {
    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    return transactions
      .filter((t) => {
        const date = new Date(t.date)
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && t.userId === currentUser?.id
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [currentDate, currentUser?.id, transactions])

  // Removed local budgetData calculation as BudgetProgress now handles it centrally


  const creditCards = cards.filter((c) => c.hasCredit)
  // Include dual function cards in debit list as well so their balance counts towards total wallet balance
  const debitCards = cards.filter((c) => c.hasDebit)

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  if (!currentUser) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isCollapsed ? "lg:left-20" : "lg:left-64",
        )}
      >
        <Header />
      </div>

      <div className="space-y-3 md:space-y-4 lg:space-y-6 pt-0">
        <div className="flex flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground truncate">
                {getGreeting()}, {currentUser.name}
              </h1>
              <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                Acompanhe suas finanças em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Saldo Total"
            value={`R$ ${formatCurrency(stats.totalBalance)}`}
            icon={WalletIcon}
            trend={{
              value: `${Math.abs(stats.balanceChange).toFixed(1)}%`,
              isPositive: stats.balanceChange >= 0,
            }}
            colorClass="text-primary"
          />
          <StatCard
            title="Receitas"
            value={`R$ ${formatCurrency(stats.totalIncome)}`}
            icon={TrendingUp}
            trend={{
              value: `${Math.abs(stats.incomeChange).toFixed(1)}%`,
              isPositive: stats.incomeChange >= 0,
            }}
            colorClass="text-secondary"
          />
          <StatCard
            title="Despesas"
            value={`R$ ${formatCurrency(stats.totalExpenses)}`}
            icon={TrendingDown}
            trend={{
              value: `${Math.abs(stats.expenseChange).toFixed(1)}%`,
              isPositive: stats.expenseChange <= 0,
            }}
            colorClass="text-destructive"
          />
          <StatCard
            title="Saldo Mês"
            value={`R$ ${formatCurrency(stats.budgetRemaining)}`}
            icon={Target}
            colorClass="text-primary"
          />
        </div>

        <div className="grid gap-3 md:gap-4 lg:gap-6 lg:grid-cols-2">
          <TransactionCalendar
            transactions={transactions}
            cards={creditCards}
            wallets={wallets}
            currentDate={currentDate}
            onDateChange={setSelectedDate}
          />
          <CategoryChart data={categoryData} />
        </div>

        <RecentTransactions transactions={filteredTransactions} />

        <div className="grid gap-3 md:gap-4 lg:gap-6 lg:grid-cols-2">
          <GoalsOverview goals={goals} />
          <CardsOverview cards={creditCards} wallets={wallets} debitCards={debitCards} currentDate={currentDate} transactions={transactions} />
        </div>

        <BudgetProgress budgets={budgets} currentDate={currentDate} />
      </div>
    </>
  )
}
