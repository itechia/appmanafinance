import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

const installments = [
  {
    id: 1,
    description: "Notebook Dell",
    totalAmount: 5000,
    installmentAmount: 416.67,
    current: 3,
    total: 12,
    nextDue: "2025-02-15",
    card: "Nubank",
  },
  {
    id: 2,
    description: "iPhone 15",
    totalAmount: 6000,
    installmentAmount: 500,
    current: 8,
    total: 12,
    nextDue: "2025-02-10",
    card: "Inter",
  },
  {
    id: 3,
    description: "Geladeira Samsung",
    totalAmount: 3600,
    installmentAmount: 300,
    current: 5,
    total: 12,
    nextDue: "2025-02-20",
    card: "C6 Bank",
  },
]

export function InstallmentsList() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Compras Parceladas</h3>
        <p className="text-sm text-muted-foreground">Acompanhe suas parcelas em aberto</p>
      </div>

      <div className="space-y-4">
        {installments.map((item) => {
          const progress = (item.current / item.total) * 100
          return (
            <div key={item.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{item.description}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.card}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.current}/{item.total}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor da parcela</span>
                  <span className="font-semibold">
                    R$ {item.installmentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">
                    R$ {item.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Próximo vencimento</span>
                  </div>
                  <span className="font-medium">{new Date(item.nextDue).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#A2D19C] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
