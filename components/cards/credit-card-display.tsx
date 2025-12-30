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
    <Card className="hover:shadow-lg transition-all duration-300">
      <div
        className="relative h-48 p-6 text-white rounded-t-xl"
        style={{
          background: color,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {hasDebit && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  Débito
                </Badge>
              )}
              {hasCredit && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  Crédito
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold">{name}</h3>
            {userName && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-5 w-5 border border-white/30">
                  <AvatarImage src={userAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-[10px]">{userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs opacity-90">{userName}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Editar cartão</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-75">Número do cartão</p>
              <p className="text-lg font-mono tracking-wider">•••• {lastDigits}</p>
            </div>
            <CreditCard className="h-8 w-8 opacity-75" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {hasDebit && (
          <div className="pb-4 border-b">
            <p className="text-xs text-muted-foreground mb-1">Saldo em conta</p>
            <p className="text-2xl font-bold text-primary">
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {hasCredit && (
          <>
            <div className="pb-2 border-b">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-muted-foreground">Limite do Cartão</p>
              </div>
              <p className="text-lg font-semibold text-primary">
                R$ {limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Limite utilizado</span>
                <span className="text-sm font-medium">{usagePercentage.toFixed(0)}%</span>
              </div>
              <Progress
                value={usagePercentage}
                className="h-2"
                indicatorClassName={usagePercentage > 80 ? "bg-red-600" : "bg-emerald-500"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className="text-lg font-semibold text-emerald-600">R$ {available.toLocaleString("pt-BR")}</p>
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
                    R$ {displayInvoiceValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
    </Card>
  )
}
