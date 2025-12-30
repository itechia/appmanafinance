import { Card } from "@/components/ui/card"
import { CreditCard, Wallet as WalletIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import type React from "react"
import type { Card as UserCard, Wallet, Transaction } from "@/lib/user-context"
import { getInvoiceAmountForMonth } from "@/lib/invoice-utils"

interface CardsOverviewProps {
  cards: UserCard[]
  wallets: Wallet[]
  debitCards: UserCard[]
  currentDate?: Date
  transactions?: Transaction[]
}

export function CardsOverview({ cards, wallets, debitCards, currentDate, transactions }: CardsOverviewProps) {
  const creditCards = cards.filter((c): c is UserCard => c.hasCredit === true)

  const allDebitCards = [...debitCards]
  const debitCardsBalance = allDebitCards.reduce((sum, c) => sum + c.balance, 0)
  const walletsBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const totalWalletBalance = walletsBalance + debitCardsBalance

  // Calculate Invoice Total for Selected Month (if provided)
  let totalInvoiceDue = 0
  const showMonthlyInvoice = !!(currentDate && transactions)

  if (showMonthlyInvoice && currentDate && transactions) {
    totalInvoiceDue = creditCards.reduce((sum, card) => {
      return sum + getInvoiceAmountForMonth(card, currentDate.getFullYear(), currentDate.getMonth(), transactions)
    }, 0)
  } else {
    // Fallback to "Used Limit" (Total Outstanding Debt) if no date provided
    totalInvoiceDue = creditCards.reduce((sum, c) => sum + (c.used || 0), 0)
  }

  const totalCreditLimit = creditCards.reduce((sum, c) => sum + (c.limit || 0), 0)
  const totalCreditUsed = creditCards.reduce((sum, c) => sum + (c.used || 0), 0)
  const totalCreditAvailable = totalCreditLimit - totalCreditUsed
  const utilizationPercentage = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0

  const displayDebitCards = allDebitCards.slice(0, 2)
  const displayWallets = wallets.slice(0, 2)
  const hasMoreItems = allDebitCards.length + wallets.length > 4

  const monthName = currentDate ? currentDate.toLocaleString('pt-BR', { month: 'long' }) : 'Total'
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cartões & Carteiras</h3>
          <p className="text-sm text-muted-foreground">Visão geral de contas</p>
        </div>
        <Link href="/cards">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            Ver todos
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Wallets Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Carteiras & Débito</h4>
          </div>
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
            <p className="text-2xl font-bold text-primary">
              R$ {totalWalletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-3 space-y-2">
              {displayDebitCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {card.name} ••{card.lastDigits}
                    </span>
                  </div>
                  <span className="font-medium">
                    R$ {card.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {displayWallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{wallet.icon}</span>
                    <span className="text-muted-foreground">{wallet.name}</span>
                  </div>
                  <span className="font-medium">
                    R$ {wallet.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {hasMoreItems && (
                <Link href="/cards">
                  <div className="flex items-center justify-center text-xs text-primary hover:underline pt-2">
                    Ver mais na página de Cartões
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Credit Cards Summary */}
        {creditCards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Cartões de Crédito</h4>
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Limite Disponível</p>
                  <p className="text-lg font-bold text-secondary">
                    R$ {totalCreditAvailable.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {showMonthlyInvoice ? `Fatura (${capitalizedMonth})` : 'Fatura Total'}
                  </p>
                  <p className="text-lg font-bold text-destructive">
                    R$ {totalInvoiceDue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Utilização do crédito</span>
                  <span className="font-medium">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <Progress
                  value={utilizationPercentage}
                  className="h-2"
                  style={
                    {
                      "--progress-background": utilizationPercentage > 80 ? "#dc2626" : "#28A745",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
