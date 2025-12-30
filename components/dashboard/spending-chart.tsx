"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { month: "Jan", receitas: 4500, despesas: 3200 },
  { month: "Fev", receitas: 5200, despesas: 3800 },
  { month: "Mar", receitas: 4800, despesas: 4200 },
  { month: "Abr", receitas: 6100, despesas: 3900 },
  { month: "Mai", receitas: 5500, despesas: 4100 },
  { month: "Jun", receitas: 5800, despesas: 3700 },
  { month: "Jul", receitas: 6200, despesas: 4300 },
  { month: "Ago", receitas: 5900, despesas: 4000 },
  { month: "Set", receitas: 6400, despesas: 4500 },
  { month: "Out", receitas: 5700, despesas: 3800 },
  { month: "Nov", receitas: 6000, despesas: 4200 },
  { month: "Dez", receitas: 6500, despesas: 4600 },
]

export function SpendingChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Receitas vs Despesas</h3>
        <p className="text-sm text-muted-foreground">Visão anual do fluxo financeiro</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="receitas" fill="#28a745" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" fill="#dc3545" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-secondary" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
      </div>
    </Card>
  )
}
