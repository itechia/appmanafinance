"use client"

import { Card } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { month: "Jan", receitas: 4500, despesas: 3200 },
  { month: "Fev", receitas: 5200, despesas: 3800 },
  { month: "Mar", receitas: 4800, despesas: 4200 },
  { month: "Abr", receitas: 6100, despesas: 3900 },
  { month: "Mai", receitas: 5500, despesas: 4100 },
  { month: "Jun", receitas: 5800, despesas: 3700 },
]

export function IncomeExpenseChart() {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Evolução Financeira</h3>
        <p className="text-sm text-muted-foreground">Receitas e despesas ao longo do tempo</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A2D19C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#A2D19C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="receitas"
            stroke="#A2D19C"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReceitas)"
          />
          <Area
            type="monotone"
            dataKey="despesas"
            stroke="#D4AF37"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDespesas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
