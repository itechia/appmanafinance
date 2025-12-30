"use client"

import { Card } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { formatCurrency } from "@/lib/report-utils"

interface MonthlyTrendChartProps {
  data: { month: string; income: number; expense: number; balance: number }[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <Card className="p-4 md:p-5">
      <h3 className="text-sm md:text-base font-semibold mb-4">Evolução Mensal</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
          <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10 }} />
          <YAxis
            className="text-xs"
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => {
              if (value === "income") return "Receitas"
              if (value === "expense") return "Despesas"
              if (value === "balance") return "Saldo"
              return value
            }}
          />
          <Line type="monotone" dataKey="income" stroke="#A2D19C" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#D4AF37"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
