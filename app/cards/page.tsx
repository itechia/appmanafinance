"use client"

import { useState, useMemo } from "react"
import { Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreditCardDisplay } from "@/components/cards/credit-card-display"
import { CardDialog } from "@/components/cards/card-dialog"
import { WalletCard } from "@/components/cards/wallet-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getInvoiceAmountForMonth } from "@/lib/invoice-utils" // Import helper

import { PayInvoiceDialog } from "@/components/dashboard/pay-invoice-dialog"
import { InvoiceHistoryDialog } from "@/components/cards/invoice-history-dialog" // Import
import { formatCurrency } from "@/lib/utils"

export default function CardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"card" | "wallet">("card")
  const [editingData, setEditingData] = useState<any>(null)

  // State for paying invoice
  // Updated to include month/year for history payments
  const [payingCard, setPayingCard] = useState<{ card: any; amount: number; month?: number; year?: number } | null>(null)

  // State for viewing history
  const [historyCard, setHistoryCard] = useState<any>(null)

  const { cards, wallets, currentUser, transactions, deleteCard, deleteWallet } = useUser() // Added transactions
  const router = useRouter()
  const { toast } = useToast()

  const canAddWallet = currentUser?.plan === "pro" || wallets.length < 1
  const canAddCard = currentUser?.plan === "pro" || cards.length < 2

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const handleAddCard = () => {
    if (!canAddCard) {
      toast({
        title: "Limite atingido",
        description:
          "Usuários do plano Free podem adicionar até 2 cartões. Faça upgrade para o plano Pro para cartões ilimitados.",
        action: (
          <Button size="sm" onClick={() => router.push("/pricing")} variant="default">
            Fazer upgrade
          </Button>
        ),
      })
      return
    }
    setEditingData(null)
    setDialogType("card")
    setIsDialogOpen(true)
  }

  const handleAddWallet = () => {
    if (!canAddWallet) {
      toast({
        title: "Limite atingido",
        description:
          "Usuários do plano Free podem adicionar apenas 1 carteira. Faça upgrade para o plano Pro para carteiras ilimitadas.",
        action: (
          <Button size="sm" onClick={() => router.push("/pricing")} variant="default">
            Fazer upgrade
          </Button>
        ),
      })
      return
    }
    setEditingData(null)
    setDialogType("wallet")
    setIsDialogOpen(true)
  }

  const handleEditCard = (card: any) => {
    setEditingData(card)
    setDialogType("card")
    setIsDialogOpen(true)
  }

  const handleDeleteCard = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cartão?")) {
      await deleteCard(id)
      toast({ title: "Cartão excluído", description: "O cartão foi removido com sucesso." })
    }
  }

  const handleEditWallet = (wallet: any) => {
    setEditingData(wallet)
    setDialogType("wallet")
    setIsDialogOpen(true)
  }

  // Not implemented for wallet cards yet, but good practice
  /* const handleDeleteWallet = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir esta carteira?")) {
        await deleteWallet(id)
      }
  } */

  const walletStats = useMemo(() => {
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
    const debitCards = cards.filter((c) => c.type === "debit" || c.type === "both")
    const totalDebitBalance = debitCards.reduce((sum, c) => sum + (c.balance || 0), 0)
    const grandTotal = totalBalance + totalDebitBalance

    return {
      totalBalance,
      totalDebitBalance,
      grandTotal,
      walletCount: wallets.length,
      debitCardCount: debitCards.length,
    }
  }, [wallets, cards])

  const creditCardStats = useMemo(() => {
    const creditCards = cards.filter((c) => c.type === "credit" || c.type === "both")
    const totalLimit = creditCards.reduce((sum, c) => sum + (c.limit || c.creditLimit || 0), 0)
    const totalUsed = creditCards.reduce((sum, c) => {
      const available = c.availableLimit || ((c.limit || c.creditLimit || 0) - (c.used || 0))
      const limit = c.limit || c.creditLimit || 0
      return sum + (limit - available)
    }, 0)
    const totalAvailable = totalLimit - totalUsed

    return { totalLimit, totalUsed, totalAvailable, cards: creditCards }
  }, [cards])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cartões & Carteiras</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus cartões, débito, crédito e carteiras digitais
          </p>
        </div>
      </div>

      <Tabs defaultValue="wallets" className="space-y-4 md:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid justify-center">
          <TabsTrigger value="wallets" className="text-xs md:text-sm">
            Carteiras
          </TabsTrigger>
          <TabsTrigger value="cards" className="text-xs md:text-sm">
            Cartões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-4 md:space-y-6">
          {!canAddWallet && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                Você atingiu o limite de carteiras do plano Free (1 carteira).{" "}
                <button
                  onClick={() => router.push("/pricing")}
                  className="font-medium text-primary hover:underline inline-flex items-center"
                >
                  Faça upgrade para Pro
                </button>{" "}
                para adicionar carteiras ilimitadas.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 h-9 px-3"
              onClick={handleAddWallet}
              disabled={!canAddWallet}
            >
              <Plus className="h-4 w-4" />
              Adicionar Carteira
            </Button>
          </div>

          {wallets.length > 0 && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo de Carteiras e Débito</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total em Carteiras</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(walletStats.totalBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{walletStats.walletCount} carteira(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total em Débito</p>
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrency(walletStats.totalDebitBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{walletStats.debitCardCount} cartão(ões)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(walletStats.grandTotal)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <div key={wallet.id} onClick={() => handleEditWallet(wallet)} className="cursor-pointer">
                <WalletCard
                  name={wallet.name}
                  balance={wallet.balance}
                  icon={wallet.icon}
                  color={wallet.color}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4 md:space-y-6">
          {!canAddCard && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                Você atingiu o limite de cartões do plano Free (2 cartões).{" "}
                <button
                  onClick={() => router.push("/pricing")}
                  className="font-medium text-primary hover:underline inline-flex items-center"
                >
                  Faça upgrade para Pro
                </button>{" "}
                para adicionar cartões ilimitados.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 h-9 px-3"
              onClick={handleAddCard}
              disabled={!canAddCard}
            >
              <Plus className="h-4 w-4" />
              Adicionar Cartão
            </Button>
          </div>

          {creditCardStats.cards.length > 0 && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo de Crédito</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Limite Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(creditCardStats.totalLimit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Disponível</p>
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrency(creditCardStats.totalAvailable)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Utilizado</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(creditCardStats.totalUsed)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              // Calculate Invoice Amount for THIS month
              const invoiceAmount = getInvoiceAmountForMonth(card, currentYear, currentMonth, transactions);

              // Reference Date: roughly the 1st of current month (for display name like "Dezembro 2025")
              const invoiceDate = new Date(currentYear, currentMonth, 1);

              return (
                <CreditCardDisplay
                  key={card.id}
                  name={card.name}
                  lastDigits={card.lastDigits}
                  brand={card.brand}
                  limit={card.limit || card.creditLimit || 0}
                  used={(card.limit || card.creditLimit || 0) - ((card.limit || card.creditLimit || 0) - (card.used || 0))}
                  balance={card.balance}
                  color={card.color}
                  dueDate={card.dueDay || card.dueDate || 0}
                  hasCredit={card.hasCredit}
                  hasDebit={card.hasDebit}
                  invoiceAmount={invoiceAmount}
                  invoiceDate={invoiceDate}
                  onEdit={() => handleEditCard(card)}
                  onDelete={() => handleDeleteCard(card.id)}
                  onPayInvoice={() => {
                    setPayingCard({ card, amount: invoiceAmount, month: currentMonth, year: currentYear });
                  }}
                  onViewHistory={() => setHistoryCard(card)}
                />
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <CardDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={dialogType}
        initialData={editingData}
      />

      {historyCard && (
        <InvoiceHistoryDialog
          open={!!historyCard}
          onOpenChange={(open) => !open && setHistoryCard(null)}
          card={historyCard}
          transactions={transactions}
          onPayInvoice={(month, year, amount) => {
            setPayingCard({ card: historyCard, amount, month, year })
            setHistoryCard(null)
          }}
        />
      )}

      {payingCard && (
        <PayInvoiceDialog
          open={!!payingCard}
          onOpenChange={(op) => !op && setPayingCard(null)}
          card={payingCard.card}
          amount={payingCard.amount}
          month={payingCard.month ?? currentMonth}
          year={payingCard.year ?? currentYear}
        />
      )}
    </div>
  )
}
