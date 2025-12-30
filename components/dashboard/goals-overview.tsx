"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Goal } from "@/lib/user-context"

interface GoalsOverviewProps {
  goals: Goal[]
}

export function GoalsOverview({ goals }: GoalsOverviewProps) {
  if (!goals || goals.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Objetivos Financeiros</h3>
          <p className="text-sm text-muted-foreground">Acompanhamento de metas</p>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Nenhum objetivo cadastrado</p>
          <Link href="/goals">
            <Button variant="outline" size="sm">
              Criar objetivo
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Objetivos Financeiros</h3>
          <p className="text-sm text-muted-foreground">Acompanhamento de metas</p>
        </div>
        <Link href="/goals">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            Ver todos
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {goals.slice(0, 3).map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          const remainingAmount = goal.targetAmount - goal.currentAmount

          return (
            <div key={goal.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: goal.color }}
                  >
                    {goal.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {daysLeft > 0 ? `${daysLeft} dias restantes` : "Prazo expirado"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{progress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">R$ {goal.currentAmount.toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              {remainingAmount > 0 && daysLeft > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Faltam R$ {remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
