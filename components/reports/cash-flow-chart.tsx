"use client"

import { Card } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
  { month: "Jan", saldo: 2500 },
  { month: "Fev", saldo: 3800 },
  { month: "Mar", saldo: 4200 },
  { month: "Abr", saldo: 6400 },
  { month: "Mai", saldo: 7800 },
  { month: "Jun", saldo: 9500 },
]

export function CashFlowChart() {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Fluxo de Caixa</h3>
        <p className="text-sm text-muted-foreground">Evolução do saldo acumulado</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line type="monotone" dataKey="saldo" stroke="#2F404F" strokeWidth={3} dot={{ fill: "#2F404F", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
