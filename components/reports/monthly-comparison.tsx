"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
  { month: "Jan", atual: 3200, anterior: 2800 },
  { month: "Fev", atual: 3800, anterior: 3200 },
  { month: "Mar", atual: 4200, anterior: 3600 },
  { month: "Abr", atual: 3900, anterior: 4100 },
  { month: "Mai", atual: 4100, anterior: 3800 },
  { month: "Jun", atual: 3700, anterior: 3900 },
]

export function MonthlyComparison() {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Comparação Mensal</h3>
        <p className="text-sm text-muted-foreground">Despesas: ano atual vs ano anterior</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
          <Legend />
          <Bar dataKey="atual" fill="#2F404F" radius={[4, 4, 0, 0]} name="Ano Atual" />
          <Bar dataKey="anterior" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Ano Anterior" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
