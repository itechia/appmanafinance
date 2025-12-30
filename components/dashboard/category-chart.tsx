"use client"

import { Card } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

  return (
    <text
      x={x}
      y={y}
      className="fill-foreground text-[10px] md:text-xs font-bold"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      stroke="hsl(var(--background))"
      strokeWidth={2}
      style={{ paintOrder: "stroke" }}
    >
      <tspan x={x} dy="-1em">{name}</tspan>
      <tspan x={x} dy="1em">{formattedValue}</tspan>
      <tspan x={x} dy="1em">{`${(percent * 100).toFixed(0)}%`}</tspan>
    </text>
  )
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface CategoryChartProps {
  data: CategoryData[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const hasData = data.length > 0 && data.some((item) => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
  }))

  return (
    <Card className="p-3 md:p-4 lg:p-6 overflow-hidden">
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold">Despesas por Categoria</h3>
        <p className="text-xs md:text-sm text-muted-foreground">Distribuição mensal</p>
      </div>
      {hasData ? (
        <div className="space-y-4 md:space-y-6">
          <ResponsiveContainer width="100%" height={240} className="md:hidden">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                fill="transparent"
                isAnimationActive={true}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    style={{ fill: entry.color, outline: "none" }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={280} className="hidden md:block">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                fill="transparent"
                isAnimationActive={true}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    style={{ fill: entry.color, outline: "none" }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 md:space-y-3">
            {dataWithPercentage.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div
                    className="h-3 w-3 md:h-4 md:w-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs md:text-sm font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <span className="text-xs md:text-sm text-muted-foreground">{item.percentage}%</span>
                  <span className="text-xs md:text-sm font-semibold">
                    R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[240px] md:h-[280px] text-xs md:text-sm text-muted-foreground">
          Nenhuma despesa registrada este mês
        </div>
      )}
    </Card>
  )
}
