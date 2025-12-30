"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Transaction, Card as CreditCard, Wallet } from "@/lib/types/app-types"
import { PayInvoiceDialog } from "@/components/dashboard/pay-invoice-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TransactionCalendarProps {
  transactions: Transaction[]
  cards: CreditCard[]
  wallets: Wallet[]
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function TransactionCalendar({ transactions, cards, wallets, currentDate, onDateChange }: TransactionCalendarProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<{ card: CreditCard, amount: number } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Helper to get account name
  const getAccountName = (accountId: string) => {
    const card = cards.find(c => c.id === accountId)
    if (card) return card.name
    const wallet = wallets.find(w => w.id === accountId)
    if (wallet) return wallet.name
    return accountId
  }

  const previousMonth = () => {
    onDateChange(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    onDateChange(new Date(year, month + 1, 1))
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  // --- Invoice Calculation Logic ---
  // Calculates the invoice amount for a specific card that falls in the CURRENT month's due date.
  // Requires transactions from previous months if the billing cycle started there.
  const getInvoiceForDay = (day: number) => {
    const invoices: { card: CreditCard; amount: number }[] = []

    cards.forEach((card) => {
      // Check if this card's due date is today
      if ((card.dueDate || card.dueDay) === day) {
        // Determine the billing cycle for this invoice
        // The Closing Date is usually ~10 days before Due Date.
        // We need to find the START and END of the cycle that produced this invoice.

        // Example: Due Date 10th Jan.
        // Closing Date 1st Jan.
        // Cycle: Previous Closing + 1 (Dec 2nd) -> Current Closing (Jan 1st).

        // If Closing Date is NOT defined, assume 10 days before Due Date?
        // Let's use card.closingDay if available, else derive it.
        const closingDay = card.closingDay || Math.max(1, (card.dueDate || card.dueDay || 10) - 10)

        // Current Closing Date (for this invoice):
        // It's the closing day in THIS month (or previous month if closing > due, unlikely but possible).
        // Usually, Invoice Due Jan 10th comes from Closing Jan 1st.
        // Invoice Due Jan 5th might come from Closing Dec 25th (Prev Month).

        let cycleEndDate = new Date(year, month, closingDay)
        // If Closing Date is AFTER Due Date, then the cycle for THIS Due Date actually ended last month.
        // e.g. Due 5th, Closing 25th.
        // Due Jan 5th -> Closing Dec 25th.
        if (closingDay >= day) {
          cycleEndDate = new Date(year, month - 1, closingDay)
        }

        // Cycle Start Date: The day after the PREVIOUS closing date.
        // Previous Closing Date is 1 month before Cycle End Date.
        const cycleStartDate = new Date(cycleEndDate)
        cycleStartDate.setMonth(cycleStartDate.getMonth() - 1)
        cycleStartDate.setDate(cycleStartDate.getDate() + 1) // Start is day AFTER closing

        // Set times to cover full days
        cycleStartDate.setHours(0, 0, 0, 0)
        cycleEndDate.setHours(23, 59, 59, 999)

        // Find expenses for this card in this date range
        const cycleExpenses = transactions.filter((t) => {
          const tDate = new Date(t.date)

          // Check if this is indeed a Credit transaction
          // If it's Debit, it paid immediately, so NOT part of invoice.
          // card is the card object from loop.
          // Logic matches getDayDetails
          const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')

          return (
            t.account === card.id &&
            t.type === "expense" &&
            t.category !== "Transferência" &&
            tDate >= cycleStartDate &&
            tDate <= cycleEndDate &&
            isCreditOp // Only Credit transactions go to invoice
          )
        }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

        if (cycleExpenses > 0) {
          invoices.push({ card, amount: cycleExpenses })
        }
      }
    })

    return invoices
  }

  const getDayDetails = (day: number) => {
    // 1. Regular Transactions (Income/Expense) for this day
    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return (
        tDate.getDate() === day &&
        tDate.getMonth() === month &&
        tDate.getFullYear() === year
      )
    })

    // Income
    const income = dayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    // Expenses
    const expense = dayTransactions
      .filter((t) => {
        if (t.type !== "expense") return false

        // Check if it's a credit card transaction
        const card = cards.find(c => c.id === t.account)
        if (card) {
          // It is a Credit Operation if:
          // 1. Explicitly marked as credit
          // 2. OR Card is pure Credit (and not explicitly marked as debit)
          // 3. OR Card is Both (defaults to debit unless marked credit? No, safely check explicit)
          // Actually, let's match the logic used in user-context or safe default:
          // If card is 'credit', default to credit.
          // If card is 'both', ONLY if function is 'credit'. (Otherwise debit).
          // If card is 'debit', always debit.

          const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')

          // If it IS a credit op, exclude it from Daily Expenses (it goes to invoice/yellow)
          if (isCreditOp) return false
        }

        // Include Wallets + Debit Card Transactions
        return true
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Credit Card Purchases (Yellow)
    const creditPurchases = dayTransactions
      .filter((t) => {
        if (t.type !== "expense") return false

        const card = cards.find(c => c.id === t.account)
        if (!card) return false // Wallet transactions are never Credit Purchases

        const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')
        return isCreditOp
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // 2. Invoices due on this day
    const invoices = getInvoiceForDay(day)
    const invoiceTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0)

    // Add Invoice total to Daily Expense (Cash Basis)
    const totalExpense = expense + invoiceTotal

    return { income, expense: totalExpense, creditPurchases, invoices }
  }


  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return (
    <Card className="p-3 md:p-4 lg:p-6 overflow-visible">
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold">Calendário de Transações</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Regime de Caixa (Faturas nos vencimentos)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-8 w-8 md:h-10 md:w-10 bg-transparent"
          >
            <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <span className="text-xs md:text-sm font-medium min-w-[100px] md:min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 md:h-10 md:w-10 bg-transparent">
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-2">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-[10px] md:text-xs font-medium text-muted-foreground py-1 md:py-2">
              {name}
            </div>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            // Updated Data Gathering Logic
            // We now need detailed lists for Tooltips
            const dayTransactions = transactions.filter((t) => {
              const tDate = new Date(t.date)
              return (
                tDate.getDate() === day &&
                tDate.getMonth() === month &&
                tDate.getFullYear() === year
              )
            })

            // 1. Income List
            const incomeList = dayTransactions.filter((t) => t.type === "income")
            const incomeTotal = incomeList.reduce((sum, t) => sum + t.amount, 0)

            // 2. Expense List (Cash/Debit only)
            const expenseList = dayTransactions.filter((t) => {
              if (t.type !== 'expense') return false
              const card = cards.find(c => c.id === t.account)
              if (card) {
                const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')
                if (isCreditOp) return false // Exclude Credit Ops
              }
              // Exclude Investments from 'Expense' (Red) category
              if (t.category === 'Investimentos') return false

              return true
            })
            // 3. Investment List
            const investmentList = dayTransactions.filter(t => t.type === 'expense' && t.category === 'Investimentos')
            const investmentTotal = investmentList.reduce((sum, t) => sum + Math.abs(t.amount), 0)

            // 3. Credit Purchases List (Yellow)
            // SHOW ONLY: First Installment (or Single) -> Show TOTAL Purchase Value
            const creditList = dayTransactions.filter((t) => {
              if (t.type !== 'expense') return false
              const card = cards.find(c => c.id === t.account)
              if (!card) return false
              const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')

              if (!isCreditOp) return false

              // Only show on the first installment (or if it's not an installment)
              // If it has installments, we want to see the "Purchase Event" only once.
              if (t.installmentNumber && t.installmentNumber > 1) {
                return false
              }

              return true
            })

            // Calculate TOTAL Purchase Value (not just the installment value)
            const creditTotal = creditList.reduce((sum, t) => {
              const transactionTotal = (t.installmentsTotal && t.installmentsTotal > 1)
                ? t.amount * t.installmentsTotal
                : t.amount
              return sum + Math.abs(transactionTotal)
            }, 0)

            // 4. Invoices (Red)
            const dueInvoices = getInvoiceForDay(day)
            const invoiceTotal = dueInvoices.reduce((sum, i) => sum + i.amount, 0)

            // Make sure to sum absolute values for expenses
            const expenseTotal = expenseList.reduce((sum, t) => sum + Math.abs(t.amount), 0)

            // Total Daily Expense (Cash Basis)
            const totalDailyExpense = expenseTotal + invoiceTotal

            const hasTransactions = incomeTotal > 0 || totalDailyExpense > 0 || creditTotal > 0
            const isToday =
              day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()

            // Helper for Premium Tooltip Content
            const TransactionTooltip = ({ title, items, total, colorClass, type }: { title: string, items: any[], total: number, colorClass: string, type: 'income' | 'expense' | 'credit' | 'investment' }) => (
              <TooltipContent className="p-0 border-0 shadow-xl rounded-lg overflow-hidden w-64 z-[60]">
                <div className="bg-background border rounded-lg overflow-hidden shadow-2xl ring-1 ring-border/50">
                  <div className={`px-3 py-2 text-xs font-semibold text-white flex justify-between items-center ${type === 'income' ? 'bg-emerald-500' :
                    type === 'expense' ? 'bg-rose-500' :
                      type === 'investment' ? 'bg-cyan-500' : 'bg-amber-500'
                    }`}>
                    <span>{title}</span>
                    <span>{total.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="p-2 space-y-2 bg-card/95 backdrop-blur-sm">
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {items.length > 0 ? items.map((item: any, i: number) => (
                        <div key={i} className="flex flex-col gap-0.5 pb-2 border-b last:border-0 last:pb-0 border-border/40">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-medium truncate text-foreground/90">{item.description || item.card?.name}</span>
                            <span className={`text-xs font-bold whitespace-nowrap ${colorClass}`}>
                              {item.displayValue || item.amount.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[120px]">{item.category || (item.card ? 'Fatura Cartão' : 'Outros')}</span>
                            {item.account && !item.card && <span>{getAccountName(item.account)}</span>}
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground text-center py-2">Sem detalhes</p>
                      )}
                    </div>
                  </div>
                </div>
              </TooltipContent>
            )

            // Combined Expense Items (Regular Expenses + Invoices)
            const combinedExpenseItems = [
              ...expenseList.map(t => ({ ...t, amount: Math.abs(t.amount) })),
              ...dueInvoices.map(inv => ({ description: `Fatura ${inv.card.name}`, amount: inv.amount, category: 'Cartão de Crédito', card: inv.card }))
            ]

            return (
              <div
                key={day}
                className={`aspect-square border rounded-md md:rounded-lg p-0.5 md:p-1 lg:p-2 flex flex-col items-center justify-start text-xs relative ${isToday ? "border-primary bg-primary/5" : "border-border"
                  } ${hasTransactions ? "bg-muted/30" : ""}`}
              >
                <span className={`font-medium mb-0.5 text-[10px] md:text-xs ${isToday ? "text-primary" : ""}`}>
                  {day}
                </span>

                <div className="flex flex-col gap-0.5 w-full items-center overflow-hidden">

                  {/* INCOME */}
                  {incomeTotal > 0 && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-secondary px-0.5 py-0.5 bg-secondary/20 rounded truncate cursor-help hover:bg-secondary/30 transition-colors">
                          +{incomeTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                      </TooltipTrigger>
                      <TransactionTooltip
                        title="Receitas do Dia"
                        items={incomeList}
                        total={incomeTotal}
                        colorClass="text-emerald-500"
                        type="income"
                      />
                    </Tooltip>
                  )}
                  {/* INVESTMENTS (Blue) */}
                  {investmentTotal > 0 && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-cyan-600 px-0.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 rounded truncate cursor-help hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">
                          -{investmentTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                      </TooltipTrigger>
                      <TransactionTooltip
                        title="Investimentos"
                        items={investmentList}
                        total={investmentTotal}
                        colorClass="text-cyan-600"
                        type="investment"
                      />
                    </Tooltip>
                  )}

                  {/* EXPENSES (Red) */}
                  {totalDailyExpense > 0 && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-destructive px-0.5 py-0.5 bg-destructive/20 rounded truncate cursor-help hover:bg-destructive/30 transition-colors">
                          -{totalDailyExpense.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                      </TooltipTrigger>
                      <TransactionTooltip
                        title="Despesas do Dia"
                        items={combinedExpenseItems}
                        total={totalDailyExpense}
                        colorClass="text-rose-500"
                        type="expense"
                      />
                    </Tooltip>
                  )}

                  {/* CREDIT PURCHASES (Yellow) */}
                  {creditTotal > 0 && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-amber-500 px-0.5 py-0.5 bg-amber-500/10 rounded truncate cursor-help hover:bg-amber-500/20 transition-colors">
                          {creditTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                      </TooltipTrigger>
                      <TransactionTooltip
                        title="Compras no Crédito"
                        items={creditList.map(t => ({
                          ...t,
                          amount: Math.abs(t.amount),
                          displayValue: (t.installmentsTotal && t.installmentsTotal > 1)
                            ? `${t.installmentsTotal}x ${Math.abs(t.amount).toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}`
                            : undefined
                        }))}
                        total={creditTotal}
                        colorClass="text-amber-500"
                        type="credit"
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </TooltipProvider>

      <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-secondary" />
          <span className="text-xs md:text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-destructive" />
          <span className="text-xs md:text-sm text-muted-foreground">Despesas</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-cyan-500" />
          <span className="text-xs md:text-sm text-muted-foreground">Investimentos</span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-amber-500" />
          <span className="text-xs md:text-sm text-muted-foreground">Compras Crédito</span>
        </div>
      </div>

      {selectedInvoice && (
        <PayInvoiceDialog
          open={!!selectedInvoice}
          onOpenChange={(op) => !op && setSelectedInvoice(null)}
          card={selectedInvoice.card}
          amount={selectedInvoice.amount}
          month={month}
          year={year}
        />
      )}
    </Card>
  )
}
