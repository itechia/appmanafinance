"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

const categories = [
  { name: "Alimentação", amount: 1200, percentage: 24, color: "#2F404F" },
  { name: "Moradia", amount: 2000, percentage: 40, color: "#A2D19C" },
  { name: "Transporte", amount: 800, percentage: 16, color: "#D4AF37" },
  { name: "Lazer", amount: 600, percentage: 12, color: "#555555" },
  { name: "Saúde", amount: 400, percentage: 8, color: "#7CB8A8" },
]

export function CategoryBreakdown() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Distribuição por Categoria</h3>
        <p className="text-sm text-muted-foreground">Análise detalhada dos gastos</p>
      </div>
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(category.amount)}</p>
                <p className="text-xs text-muted-foreground">{category.percentage}%</p>
              </div>
            </div>
            <Progress
              value={category.percentage}
              className="h-2"
              style={
                {
                  "--progress-background": category.color,
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
