"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { MoreVertical, TrendingUp, AlertCircle, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface BudgetCardProps {
  id: string
  category: string
  spent: number
  limit: number
  color: string
  transactions: number
  period: string
  isOverBudget?: boolean
  onEdit: (id: string) => void
}

export function BudgetCard({
  id,
  category,
  spent,
  limit,
  color,
  transactions,
  period,
  isOverBudget,
  onEdit,
}: BudgetCardProps) {
  const percentage = (spent / limit) * 100
  const remaining = limit - spent
  const { deleteBudget } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = () => {
    deleteBudget(id)
    toast({
      title: "Orçamento excluído",
      description: `O orçamento de ${category} foi removido com sucesso.`,
    })
  }

  const handleViewTransactions = () => {
    router.push(`/transactions?category=${encodeURIComponent(category)}`)
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div
        className="relative h-24 p-6 text-white"
        style={{
          background: color,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xl">{category}</h3>
            <p className="text-xs text-white/80 capitalize mt-1">
              {period === "monthly"
                ? "Orçamento Mensal"
                : period === "weekly"
                  ? "Orçamento Semanal"
                  : period === "quarterly"
                    ? "Orçamento Trimestral"
                    : "Orçamento Anual"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 -mr-2 -mt-2">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(id)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewTransactions}>
                <Eye className="h-4 w-4 mr-2" />
                Ver transações
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-6 -mt-6 bg-card rounded-t-xl relative">
        <div className="space-y-5">
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold tracking-tight">{formatCurrency(spent)}</span>
              <span className="text-sm text-muted-foreground font-medium mb-1">de {formatCurrency(limit)}</span>
            </div>

            <Progress
              value={Math.min(percentage, 100)}
              className="h-3 rounded-full bg-muted"
              indicatorClassName="bg-[var(--progress-background)]"
              style={
                {
                  "--progress-background": isOverBudget ? "#ef4444" : color,
                } as React.CSSProperties
              }
            />

            <div className="mt-2 flex items-center justify-between text-xs font-medium">
              <span className={isOverBudget ? "text-destructive" : "text-emerald-600"}>
                {isOverBudget ? "Acima do limite" : "Dentro do limite"}
              </span>
              <span className="text-muted-foreground">{percentage.toFixed(0)}% utilizado</span>
            </div>
          </div>

          <div className="pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Disponível</p>
              {isOverBudget ? (
                <p className="font-bold text-destructive">R$ 0,00</p>
              ) : (
                <p className="font-bold text-emerald-600">{formatCurrency(remaining)}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transações</p>
              <div className="flex items-center gap-1">
                <span className="font-bold">{transactions}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">uni</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
