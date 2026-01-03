import type React from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MoreVertical, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

interface CreditCardDisplayProps {
  name: string
  lastDigits: string
  brand: string
  limit: number
  used: number
  balance: number
  color: string
  dueDate: number
  hasCredit: boolean
  hasDebit: boolean
  userName?: string
  userAvatar?: string
  invoiceAmount?: number
  invoiceDate?: Date
  onEdit?: () => void
  onDelete?: () => void
  onPayInvoice?: () => void
  onViewHistory?: () => void
}

export function CreditCardDisplay({
  name,
  lastDigits,
  brand,
  limit,
  used,
  balance,
  color,
  dueDate,
  hasCredit,
  hasDebit,
  userName,
  userAvatar,
  invoiceAmount,
  invoiceDate,
  onEdit,
  onDelete,
  onPayInvoice,
  onViewHistory,
}: CreditCardDisplayProps) {
  const available = limit - used
  const usagePercentage = limit > 0 ? (used / limit) * 100 : 0

  // Decide what to show as "Invoice Value". 
  // If invoiceAmount is explicitly provided (e.g. current month invoice), use it.
  // Otherwise fallback to 'used' (Total Debt).
  const displayInvoiceValue = invoiceAmount !== undefined ? invoiceAmount : used

  return (
    <Card className="hover:shadow-md transition-all duration-300 overflow-hidden border-l-4" style={{ borderLeftColor: color }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold" style={{ color: color }}>{name}</h3>
              {hasDebit && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Débito
                </Badge>
              )}
              {hasCredit && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Crédito
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              <span className="text-xs font-mono">•••• {lastDigits}</span>
            </div>
            {userName && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-5 w-5 border">
                  <AvatarImage src={userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-[10px]">{userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground opacity-90">{userName}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Editar cartão</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-5">
          {hasDebit && (
            <div className={hasCredit ? "pb-4 border-b" : ""}>
              <p className="text-xs text-muted-foreground mb-1">Saldo em conta</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(balance)}
              </p>
            </div>
          )}

          {hasCredit && (
            <>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Limite utilizado</p>
                    <span className="text-sm font-medium">{usagePercentage.toFixed(0)}%</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Limite Total</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(limit)}</p>
                  </div>
                </div>

                <Progress
                  value={usagePercentage}
                  className="h-2"
                  indicatorClassName={usagePercentage > 80 ? "bg-red-600" : "bg-emerald-500"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="text-lg font-semibold text-emerald-600">{formatCurrency(available)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-semibold">Dia {dueDate}</p>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-muted-foreground block">Fatura atual</span>
                    {invoiceDate && (
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {format(invoiceDate, "MMMM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-destructive">
                      {formatCurrency(displayInvoiceValue)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onViewHistory && (
                    <Button
                      variant="outline"
                      className="flex-1 text-xs h-9"
                      onClick={onViewHistory}
                    >
                      Ver histórico
                    </Button>
                  )}
                  {displayInvoiceValue > 0 && onPayInvoice && (
                    <Button
                      variant="destructive"
                      className="flex-1 h-9 text-xs font-semibold"
                      onClick={onPayInvoice}
                    >
                      Pagar fatura
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
