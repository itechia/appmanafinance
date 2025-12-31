import { Card } from "@/components/ui/card"
import { TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const expenses = [
  { name: "Aluguel", amount: 2000, category: "Moradia" },
  { name: "Supermercado", amount: 850, category: "Alimentação" },
  { name: "Combustível", amount: 600, category: "Transporte" },
  { name: "Academia", amount: 120, category: "Saúde" },
  { name: "Streaming", amount: 95, category: "Lazer" },
]

export function TopExpenses() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Maiores Despesas</h3>
        <p className="text-sm text-muted-foreground">Top 5 gastos do período</p>
      </div>
      <div className="space-y-4">
        {expenses.map((expense, index) => (
          <div key={expense.name} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium">{expense.name}</p>
              <p className="text-xs text-muted-foreground">{expense.category}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(expense.amount)}</p>
              <div className="flex items-center gap-1 text-xs text-destructive">
                <TrendingDown className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
