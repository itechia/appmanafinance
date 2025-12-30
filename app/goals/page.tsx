"use client"

import { useState } from "react"
import { Target, Plus, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalDialog } from "@/components/goals/goal-dialog"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"
import { invoiceStorage } from "@/lib/invoice-storage"
import { formatCurrency } from "@/lib/utils"

import { useAuth } from "@/lib/auth-context"

export default function GoalsPage() {
  const { user: authUser } = useAuth()

  const {
    currentUser,
    currentWorkspace, // Need workspace for invoice logic
    goals: contextGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    cards: contextCards,
    wallets: contextWallets,
    updateCard,
    updateWallet,
    transactions: contextTransactions,
    addTransaction,
  } = useUser()

  if (!currentUser) return null

  const goals = contextGoals || []
  const cards = contextCards || []
  const wallets = contextWallets || []
  const transactions = contextTransactions || []
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any | null>(null)

  const handleCreateGoal = (goalData: any) => {
    const newGoal = {
      ...goalData,
      currentAmount: 0,
    }
    addGoal(newGoal)
    setIsDialogOpen(false)
  }

  const handleEditGoal = (goalData: any) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goalData)
      setEditingGoal(null)
      setIsDialogOpen(false)
    }
  }

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id)
  }

  const handleAddAmount = async (id: string, amount: number, sourceAccountId: string, accountType: "card" | "wallet") => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return
    if (!currentUser) return

    let accountName = ""
    let isCredit = false
    let actualCardId = ""
    let card: any = null

    if (accountType === "wallet") {
      const wallet = wallets.find((w) => w.id === sourceAccountId)
      if (!wallet) return

      const walletBalance = Number(wallet.balance)
      const numericAmount = Number(amount)

      if (walletBalance < numericAmount) {
        toast({
          title: "Saldo insuficiente",
          description: `A carteira ${wallet.name} não tem saldo suficiente`,
          variant: "destructive",
        })
        return
      }

      accountName = wallet.name
      // updateWallet(sourceAccountId, { balance: wallet.balance - amount }) // Removed to avoid double deduction
    } else {
      actualCardId = sourceAccountId.replace("-debit", "").replace("-credit", "")
      card = cards.find((c) => c.id === actualCardId)
      if (!card) return

      isCredit = sourceAccountId.includes("-credit") || card.type === "credit"
      accountName = card.name
      const numericAmount = Number(amount)

      if (isCredit) {
        const availableLimit = Number(card.availableLimit || card.creditLimit || 0)
        if (availableLimit < numericAmount) {
          toast({
            title: "Limite insuficiente",
            description: `O cartão ${card.name} não tem limite disponível`,
            variant: "destructive",
          })
          return
        }
        // updateCard(actualCardId, { availableLimit: availableLimit - amount }) // Removed
      } else {
        const balance = Number(card.balance || 0)
        if (balance < numericAmount) {
          toast({
            title: "Saldo insuficiente",
            description: `O cartão ${card.name} não tem saldo suficiente`,
            variant: "destructive",
          })
          return
        }
        // updateCard(actualCardId, { balance: balance - amount }) // Removed
      }
    }

    // updateGoal(id, { currentAmount: goal.currentAmount + amount }) // Keep goal update local/optimistic? Yes.

    // updateGoal(id, { currentAmount: goal.currentAmount + amount }) // Moved to inside try block for safety

    const newTransactionPayload = {
      description: `Aplicação em objetivo: ${goal.name}`,
      amount: -amount, // Negative: It's an outflow. UserContext addition logic handles it.
      type: "transfer" as const,
      category: "Objetivos",
      status: "completed" as const,
      isPaid: true,
      date: new Date().toISOString(),
      account: sourceAccountId, // Correct: Use ID
      accountId: sourceAccountId,
      toAccount: goal.name,
      toAccountId: id,
      goalId: id,
      goalName: goal.name,
      userId: currentUser.id,
      cardFunction: (accountType === 'card' ? (isCredit ? 'credit' : 'debit') : undefined) as "credit" | "debit" | undefined
    }

    try {
      // Create transaction and get the result (with ID)
      const createdTx = await addTransaction(newTransactionPayload)

      // Optimistic update moved to here (actually it's now pessimistic/confirmed)
      // updateGoal(id, { currentAmount: goal.currentAmount + amount }) // Wait, if I do it here, I don't need revert logic in catch?
      // But addTransaction is what validates balance.
      // So if addTransaction succeeds, THEN we update goal.

      updateGoal(id, { currentAmount: goal.currentAmount + amount })

      // If it was a credit transaction, link it to invoice
      if (isCredit && card && createdTx && createdTx.id) {
        const today = new Date()
        const closingDay = card.closingDay || 10

        // Get or create invoice
        const invoice = invoiceStorage.getInvoiceForTransaction(
          currentUser.id,
          currentWorkspace?.id || 'local-ws-1',
          actualCardId,
          today,
          closingDay
        )

        if (invoice) {
          invoiceStorage.addTransactionToInvoice(invoice.id, createdTx.id, amount)
        }
      }

      toast({
        title: "Valor adicionado com sucesso!",
        description: `${formatCurrency(amount)} foi adicionado ao objetivo "${goal.name}"`,
      })
    } catch (error: any) {
      console.error("Erro ao adicionar valor:", error)
      // No need to revert if we update AFTER success. 
      // EXCEPT if updateGoal was called BEFORE.
      // I am removing the call BEFORE try block.

      toast({
        title: "Erro",
        description: error.message || "Não foi possível realizar a contribuição",
        variant: "destructive",
      })
    }
  }


  const handleWithdrawAmount = (
    id: string,
    amount: number,
    destinationAccountId: string,
    accountType: "card" | "wallet",
  ) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return
    if (!currentUser) return

    if (goal.currentAmount < amount) {
      toast({
        title: "Saldo insuficiente",
        description: `O objetivo não tem saldo suficiente para retirada`,
        variant: "destructive",
      })
      return
    }

    // Removed manual updates to avoid double counting (addTransaction handles it)
    // if (accountType === "wallet") { ... } else { ... }

    updateGoal(id, { currentAmount: Math.max(0, goal.currentAmount - amount) })

    const newTransaction = {
      description: `Retirada do objetivo: ${goal.name}`,
      amount: amount, // Positive amount
      type: "income" as const, // Use 'income' so UserContext adds to destination balance
      category: "Objetivos",
      status: "completed" as const,
      isPaid: true,
      date: new Date().toISOString(),
      account: destinationAccountId, // Destination ID
      accountId: destinationAccountId,
      fromAccount: goal.name,
      fromAccountId: id,
      goalId: id,
      goalName: goal.name,
      cardFunction: (accountType === 'card' ? 'debit' : undefined) as "credit" | "debit" | undefined
    }

    addTransaction(newTransaction)
  }

  const openEditDialog = (goal: any) => {
    setEditingGoal(goal)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingGoal(null)
    setIsDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-3 md:space-y-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">Objetivos Financeiros</h1>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                <Crown className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-primary">PRO</span>
              </div>
            </div>
            <p className="text-xs md:text-base text-muted-foreground truncate">
              Defina e acompanhe suas metas financeiras
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button
              onClick={openCreateDialog}
              className="gap-2 h-9 px-3 w-full sm:w-auto text-sm bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Objetivo</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="flex h-[250px] md:h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center space-y-3 p-4">
              <Target className="h-8 w-8 md:h-12 md:w-12 mx-auto text-muted-foreground" />
              <p className="text-xs md:text-base text-muted-foreground">Nenhum objetivo criado ainda</p>
              <Button onClick={openCreateDialog} variant="outline" className="h-9 px-3 text-sm bg-transparent">
                Criar primeiro objetivo
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                cards={cards}
                wallets={wallets}
                onEdit={() => openEditDialog(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
                onAddAmount={(amount, sourceAccount, accountType) =>
                  handleAddAmount(goal.id, amount, sourceAccount, accountType)
                }
                onWithdrawAmount={(amount, sourceAccount, accountType) =>
                  handleWithdrawAmount(goal.id, amount, sourceAccount, accountType)
                }
              />
            ))}
          </div>
        )}

        <GoalDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
          initialData={editingGoal}
        />
      </div>
    </>
  )
}
