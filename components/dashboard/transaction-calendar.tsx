"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import type { Transaction, Card as CreditCard, Wallet } from "@/lib/types/app-types"
import { PayInvoiceDialog } from "@/components/dashboard/pay-invoice-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { isSameMonth, format } from "date-fns"

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

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  // --- Invoice Calculation Logic ---
  const getInvoiceForDay = (day: number) => {
    const invoices: { card: CreditCard; amount: number }[] = []

    cards.forEach((card) => {
      if ((card.dueDate || card.dueDay) === day) {
        const closingDay = card.closingDay || Math.max(1, (card.dueDate || card.dueDay || 10) - 10)
        let cycleEndDate = new Date(year, month, closingDay)
        if (closingDay >= day) {
          cycleEndDate = new Date(year, month - 1, closingDay)
        }

        const cycleStartDate = new Date(cycleEndDate)
        cycleStartDate.setMonth(cycleStartDate.getMonth() - 1)
        cycleStartDate.setDate(cycleStartDate.getDate() + 1)

        cycleStartDate.setHours(0, 0, 0, 0)
        cycleEndDate.setHours(23, 59, 59, 999)

        const cycleExpenses = transactions.filter((t) => {
          const tDate = new Date(t.date)
          const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')

          return (
            t.account === card.id &&
            t.type === "expense" &&
            t.category !== "Transferência" &&
            tDate >= cycleStartDate &&
            tDate <= cycleEndDate &&
            isCreditOp
          )
        }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

        if (cycleExpenses > 0) {
          invoices.push({ card, amount: cycleExpenses })
        }
      }
    })

    return invoices
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
      </div>


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

          const dayTransactions = transactions.filter((t) => {
            const tDate = new Date(t.date)
            return (
              tDate.getDate() === day &&
              tDate.getMonth() === month &&
              tDate.getFullYear() === year
            )
          })

          const incomeList = dayTransactions.filter((t) => t.type === "income")
          const incomeTotal = incomeList.reduce((sum, t) => sum + t.amount, 0)

          const expenseList = dayTransactions.filter((t) => {
            if (t.type !== 'expense') return false
            const card = cards.find(c => c.id === t.account)
            if (card) {
              const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')
              if (isCreditOp) return false
            }
            if (t.category === 'Investimentos') return false
            return true
          })

          const investmentList = dayTransactions.filter(t => t.type === 'expense' && t.category === 'Investimentos')
          const investmentTotal = investmentList.reduce((sum, t) => sum + Math.abs(t.amount), 0)

          const creditList = dayTransactions.filter((t) => {
            if (t.type !== 'expense') return false
            const card = cards.find(c => c.id === t.account)
            if (!card) return false

            const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')
            if (!isCreditOp) return false

            if (t.installmentNumber && t.installmentNumber > 1) {
              return false
            }
            return true
          })

          const creditTotal = creditList.reduce((sum, t) => {
            const transactionTotal = (t.installmentsTotal && t.installmentsTotal > 1)
              ? t.amount * t.installmentsTotal
              : t.amount
            return sum + Math.abs(transactionTotal)
          }, 0)

          const dueInvoices = getInvoiceForDay(day)
          const invoiceTotal = dueInvoices.reduce((sum, i) => sum + i.amount, 0)
          const expenseTotal = expenseList.reduce((sum, t) => sum + Math.abs(t.amount), 0)
          const totalDailyExpense = expenseTotal + invoiceTotal

          const hasTransactions = incomeTotal > 0 || totalDailyExpense > 0 || creditTotal > 0
          const isToday =
            day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()

          const combinedExpenseItems = [
            ...expenseList.map(t => ({ ...t, amount: Math.abs(t.amount) })),
            ...dueInvoices.map(inv => ({ description: `Fatura ${inv.card.name}`, amount: inv.amount, category: 'Cartão de Crédito', card: inv.card }))
          ]

          return (
            <Popover key={day}>
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "aspect-square border rounded-md md:rounded-lg p-0.5 md:p-1 lg:p-2 flex flex-col items-center justify-start text-xs relative cursor-pointer active:scale-95 transition-transform",
                    isToday ? "border-primary bg-primary/5" : "border-border",
                    hasTransactions ? "bg-muted/30" : ""
                  )}
                >
                  <span className={cn("font-medium mb-0.5 text-[10px] md:text-xs", isToday ? "text-primary" : "")}>
                    {day}
                  </span>

                  <div className="flex flex-col gap-0.5 w-full items-center overflow-hidden">
                    {/* INCOME */}
                    {incomeTotal > 0 && (
                      <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-secondary px-0.5 py-0.5 bg-secondary/20 rounded truncate">
                        +{formatCurrency(incomeTotal)}
                      </div>
                    )}
                    {/* INVESTMENTS (Blue) */}
                    {investmentTotal > 0 && (
                      <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-cyan-600 px-0.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 rounded truncate">
                        -{formatCurrency(investmentTotal)}
                      </div>
                    )}
                    {/* EXPENSES (Red) */}
                    {totalDailyExpense > 0 && (
                      <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-destructive px-0.5 py-0.5 bg-destructive/20 rounded truncate">
                        -{formatCurrency(totalDailyExpense)}
                      </div>
                    )}
                    {/* CREDIT PURCHASES (Yellow) */}
                    {creditTotal > 0 && (
                      <div className="w-full text-center text-[9px] md:text-[10px] font-extrabold text-amber-500 px-0.5 py-0.5 bg-amber-500/10 rounded truncate">
                        {formatCurrency(creditTotal)}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 overflow-hidden shadow-2xl z-[60]" align="center">
                <div className="bg-primary/5 p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-sm">{day} de {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][month]}</span>
                  <span className="text-xs text-muted-foreground">{year}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-0">
                  {/* Detailed Lists */}
                  {hasTransactions ? (
                    <div className="space-y-0">
                      {incomeTotal > 0 && (
                        <div className="p-3 border-b border-border/50">
                          <div className="text-xs font-bold text-emerald-500 mb-2 flex justify-between">
                            <span>Receitas</span>
                            <span>{formatCurrency(incomeTotal)}</span>
                          </div>
                          <div className="space-y-2">
                            {incomeList.map((item, i) => (
                              <div key={i} className="flex justify-between items-start text-xs">
                                <span className="text-muted-foreground truncate max-w-[150px]">{item.description}</span>
                                <span className="font-medium">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {investmentTotal > 0 && (
                        <div className="p-3 border-b border-border/50">
                          <div className="text-xs font-bold text-cyan-600 mb-2 flex justify-between">
                            <span>Investimentos</span>
                            <span>{formatCurrency(investmentTotal)}</span>
                          </div>
                          <div className="space-y-2">
                            {investmentList.map((item, i) => (
                              <div key={i} className="flex justify-between items-start text-xs">
                                <span className="text-muted-foreground truncate max-w-[150px]">{item.description}</span>
                                <span className="font-medium">{formatCurrency(Math.abs(item.amount))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {totalDailyExpense > 0 && (
                        <div className="p-3 border-b border-border/50">
                          <div className="text-xs font-bold text-rose-500 mb-2 flex justify-between">
                            <span>Despesas</span>
                            <span>{formatCurrency(totalDailyExpense)}</span>
                          </div>
                          <div className="space-y-2">
                            {combinedExpenseItems.map((item, i) => (
                              <div key={i} className="flex justify-between items-start text-xs">
                                <span className="text-muted-foreground truncate max-w-[150px]">{item.description || (item as any).card?.name}</span>
                                <span className="font-medium">{formatCurrency(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {creditTotal > 0 && (
                        <div className="p-3">
                          <div className="text-xs font-bold text-amber-500 mb-2 flex justify-between">
                            <span>No Crédito</span>
                            <span>{formatCurrency(creditTotal)}</span>
                          </div>
                          <div className="space-y-2">
                            {creditList.map((item, i) => (
                              <div key={i} className="flex justify-between items-start text-xs">
                                <span className="text-muted-foreground truncate max-w-[150px]">{item.description}</span>
                                <div className="text-right">
                                  <span className="font-medium block">{formatCurrency(Math.abs(item.amount))}</span>
                                  {item.installmentsTotal && item.installmentsTotal > 1 && (
                                    <span className="text-[9px] text-muted-foreground">{item.installmentsTotal}x</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Sem transações neste dia.
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>


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
