import type React from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useUser } from "@/lib/user-context"
import { calculateBudgetSpent, getBudgetLimitForMonth } from "@/lib/budget-utils"
import { formatCurrency } from "@/lib/utils"

interface Budget {
  category: string
  spent: number
  limit: number
  color: string
}

interface BudgetProgressProps {
  budgets: any[] // Using any to accept raw budgets from context, or define RawBudget type
  currentDate: Date
}

export function BudgetProgress({ budgets, currentDate }: BudgetProgressProps) {
  const { transactions, cards, currentUser } = useUser()

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Orçamentos</h3>
          <p className="text-sm text-muted-foreground">Acompanhamento mensal</p>
        </div>
        <Link href="/budgets">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            Ver todos
          </Button>
        </Link>
      </div>
      {budgets.length > 0 ? (
        <div className="space-y-5">
          {budgets.map((budget) => {
            // Use Centralized Utils
            const spent = calculateBudgetSpent(budget, month, year, transactions, cards, currentUser?.id)
            const limit = getBudgetLimitForMonth(budget, month, year)

            const percentage = limit > 0 ? (spent / limit) * 100 : 0
            const isOverBudget = percentage > 100

            return (
              <div key={budget.categoryName || budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{budget.categoryName}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </span>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className="h-2"
                  style={
                    {
                      "--progress-background": isOverBudget ? "#dc3545" : budget.categoryColor,
                    } as React.CSSProperties
                  }
                />
                <p className={`text-xs font-medium ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                  {percentage.toFixed(0)}% utilizado {isOverBudget && "- Acima do limite!"}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Nenhum orçamento configurado
        </div>
      )}
    </Card>
  )
}
