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
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{category}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {period === "monthly"
              ? "mensal"
              : period === "weekly"
                ? "semanal"
                : period === "quarterly"
                  ? "trimestral"
                  : "anual"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
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

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold">R$ {spent.toLocaleString("pt-BR")}</span>
            <span className="text-sm text-muted-foreground">de R$ {limit.toLocaleString("pt-BR")}</span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className="h-2"
            style={
              {
                "--progress-background": isOverBudget ? "#dc2626" : color,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive font-medium">
                  R$ {Math.abs(remaining).toLocaleString("pt-BR")} acima
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-[#A2D19C]" />
                <span className="text-muted-foreground">R$ {remaining.toLocaleString("pt-BR")} restante</span>
              </>
            )}
          </div>
          <span className="text-muted-foreground">{transactions} transações</span>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilizado</span>
            <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
