"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { formatCurrency } from "@/lib/report-utils"

interface CategoryChartProps {
  expenseCategories: { category: string; amount: number; percentage: number }[]
  incomeCategories: { category: string; amount: number; percentage: number }[]
}

const COLORS = ["#28a745", "#20c997", "#17a2b8", "#6610f2", "#fd7e14"]

export function CategoryChart({ expenseCategories, incomeCategories }: CategoryChartProps) {
  return (
    <Card className="p-4 md:p-5">
      <h3 className="text-sm md:text-base font-semibold mb-4">Top Categorias</h3>
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="expenses" className="text-xs">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="income" className="text-xs">
            Receitas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expenseCategories} layout="vertical">
              <XAxis type="number" className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" className="text-xs" tick={{ fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeCategories} layout="vertical">
              <XAxis type="number" className="text-xs" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" className="text-xs" tick={{ fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {incomeCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
