"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BudgetCard } from "@/components/budgets/budget-card"
import { BudgetDialog } from "@/components/budgets/budget-dialog"
import { CategoryManager } from "@/components/budgets/category-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/user-context"
import { calculateBudgetSpent, getBudgetLimitForMonth } from "@/lib/budget-utils"
import { formatCurrency } from "@/lib/utils"

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("budgets")

  const { budgets, categories, transactions, cards, currentUser, selectedDate, setHeaderDateVisible } = useUser()

  // Control Global Header Date Visibility
  useEffect(() => {
    setHeaderDateVisible(activeTab === "budgets")
    return () => setHeaderDateVisible(true)
  }, [activeTab, setHeaderDateVisible])

  const budgetStats = useMemo(() => {
    if (!currentUser) return []
    const currentDate = selectedDate || new Date()
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()

    return budgets.map((budget) => {
      // Use Centralized Logic
      const spent = calculateBudgetSpent(budget, month, year, transactions, cards, currentUser.id)
      const limit = getBudgetLimitForMonth(budget, month, year)

      // Filter transactions for this budget to count them
      const budgetTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return (
          tDate.getMonth() === month &&
          tDate.getFullYear() === year &&
          t.type === 'expense' &&
          t.category === budget.categoryName
        )
      })

      return {
        ...budget,
        spent,
        limit, // Override with historical limit
        transactionCount: budgetTransactions.length,
        color: budget.categoryColor || "#2F404F",
        isOverBudget: spent > limit,
      }
    })
  }, [budgets, transactions, categories, cards, currentUser?.id, selectedDate])

  const handleEdit = (budgetId: string) => {
    setEditingBudget(budgetId)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">Orçamentos & Categorias</h1>
          <p className="text-sm text-muted-foreground truncate">
            Gerencie seus limites de gastos e categorias
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 hidden sm:flex"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Novo Orçamento</span>
          </Button>

          <Button
            size="icon"
            className="bg-primary hover:bg-primary/90 sm:hidden rounded-full h-10 w-10 shadow-lg"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="budgets" className="space-y-3 md:space-y-6" onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
          <TabsTrigger value="budgets" className="text-xs md:text-sm">
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs md:text-sm">
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-3 md:space-y-6">

          {/* Summary Card for Mobile/Desktop */}
          {budgetStats.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3 mb-6 p-4 md:p-6 bg-card rounded-xl border shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orçado</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(budgetStats.reduce((acc, curr) => acc + curr.limit, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(budgetStats.reduce((acc, curr) => acc + curr.spent, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Disponível Total</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(Math.max(0, budgetStats.reduce((acc, curr) => acc + (curr.limit - curr.spent), 0)))}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {budgetStats.map((budget) => (
              <BudgetCard
                key={budget.id}
                id={budget.id}
                category={budget.categoryName || 'Desconhecido'}
                spent={budget.spent}
                limit={budget.limit}
                color={budget.color}
                transactions={budget.transactionCount}
                period={budget.period}
                isOverBudget={budget.isOverBudget}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
      </Tabs>

      <BudgetDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingBudget(null)
        }}
        editingId={editingBudget}
      />
    </div >
  )
}
