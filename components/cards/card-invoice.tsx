import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download } from "lucide-react"

const invoiceItems = [
  { date: "2025-01-15", description: "Supermercado Extra", amount: 350, installment: null },
  { date: "2025-01-14", description: "Netflix", amount: 55.9, installment: null },
  { date: "2025-01-12", description: "Notebook Dell", amount: 416.67, installment: "3/12" },
  { date: "2025-01-10", description: "Amazon", amount: 89.9, installment: null },
  { date: "2025-01-08", description: "Uber", amount: 45, installment: null },
]

export function CardInvoice() {
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Fatura Atual</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            Vencimento: 15/02/2025
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="space-y-3 mb-6">
        {invoiceItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p className="font-medium">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString("pt-BR")}</p>
                {item.installment && (
                  <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded">{item.installment}</span>
                )}
              </div>
            </div>
            <span className="font-semibold">
              R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total da Fatura</span>
          <span className="text-2xl font-bold text-[#D4AF37]">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </Card>
  )
}
