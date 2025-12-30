"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MoreVertical, Plus, Minus, Calendar, TrendingUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  icon: string
  color: string
  imageUrl?: string
}

interface CardType {
  id: string
  name: string
  type: "debit" | "credit" | "both"
  balance?: number
  creditLimit?: number
  availableLimit?: number
}

interface Wallet {
  id: string
  name: string
  balance: number
}

interface GoalCardProps {
  goal: Goal
  cards: CardType[]
  wallets: Wallet[]
  onEdit: () => void
  onDelete: () => void
  onAddAmount: (amount: number, sourceAccount: string, accountType: "card" | "wallet") => void
  onWithdrawAmount: (amount: number, sourceAccount: string, accountType: "card" | "wallet") => void
}

export function GoalCard({ goal, cards, wallets, onEdit, onDelete, onAddAmount, onWithdrawAmount }: GoalCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [sourceAccount, setSourceAccount] = useState("")
  const { toast } = useToast()

  const accounts = useMemo(() => {
    const accountsList: Array<{
      id: string
      name: string
      type: "Carteira" | "Cartão Débito" | "Cartão Crédito"
      accountType: "card" | "wallet"
    }> = []

    wallets.forEach((wallet) => {
      accountsList.push({
        id: wallet.id,
        name: wallet.name,
        type: "Carteira",
        accountType: "wallet",
      })
    })

    cards.forEach((card: any) => {
      // Robust check using type or boolean flags
      const showDebit = card.type === "debit" || card.type === "both" || card.hasDebit
      const showCredit = card.type === "credit" || card.type === "both" || card.hasCredit

      if (showDebit) {
        accountsList.push({
          id: card.id,
          name: `${card.name} (Débito)`,
          type: "Cartão Débito",
          accountType: "card",
        })
      }

      // if (showCredit) {
      //   // Disable credit for Goal Contributions as per user request
      //   // accountsList.push({
      //   //   id: `${card.id}-credit`,
      //   //   name: `${card.name} (Crédito)`,
      //   //   type: "Cartão Crédito",
      //   //   accountType: "card",
      //   // })
      // }
    })

    return accountsList
  }, [cards, wallets])

  useState(() => {
    if (accounts.length > 0 && !sourceAccount) {
      setSourceAccount(accounts[0].id)
    }
  })

  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const remainingAmount = goal.targetAmount - goal.currentAmount
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30))
  const monthlySavingsNeeded = remainingAmount / monthsLeft

  const handleAddSubmit = () => {
    const value = Number.parseFloat(amount)
    if (value > 0) {
      const account = accounts.find((a) => a.id === sourceAccount)
      if (!account) return

      onAddAmount(value, sourceAccount, account.accountType)

      toast({
        title: "Valor adicionado com sucesso!",
        description: `${formatCurrency(value)} foi adicionado ao objetivo "${goal.name}" e debitado de ${account.name}`,
      })
      setAmount("")
      setIsAddDialogOpen(false)
    }
  }

  const handleWithdrawSubmit = () => {
    const value = Number.parseFloat(amount)
    if (value > 0 && value <= goal.currentAmount) {
      const account = accounts.find((a) => a.id === sourceAccount)
      if (!account) return

      onWithdrawAmount(value, sourceAccount, account.accountType)

      toast({
        title: "Valor retirado",
        description: `${formatCurrency(value)} foi retirado do objetivo e creditado em ${account.name}`,
      })
      setAmount("")
      setIsWithdrawDialogOpen(false)
    }
  }

  if (accounts.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 text-center text-muted-foreground">
          <p>Cadastre carteiras ou cartões para adicionar valores aos objetivos</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <div
          className="relative aspect-square w-full p-4 md:p-6 text-white flex flex-col justify-between"
          style={{
            background: goal.imageUrl ? "#000" : goal.color,
          }}
        >
          {goal.imageUrl && (
            <img
              src={goal.imageUrl || "/placeholder.svg"}
              alt={goal.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl md:text-2xl">
                {goal.icon}
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold drop-shadow-lg">{goal.name}</h3>
                <div className="flex items-center gap-1 text-xs opacity-90 mt-1 drop-shadow">
                  <Calendar className="h-3 w-3" />
                  <span>{daysLeft > 0 ? `${daysLeft} dias` : "Expirado"}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsWithdrawDialogOpen(true)}>
                  <Minus className="mr-2 h-4 w-4" />
                  Retirar valor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>Editar objetivo</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {remainingAmount > 0 && daysLeft > 0 && (
            <div className="flex items-center gap-2 p-2 md:p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Poupar por mês</p>
                <p className="text-xs md:text-sm font-bold text-primary">
                  {formatCurrency(monthlySavingsNeeded)}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-muted-foreground">Atual</p>
              <p className="text-base md:text-lg font-bold text-primary">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-base md:text-lg font-bold">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full gap-2 h-10 md:h-11" size="lg">
            <Plus className="h-4 w-4" />
            Adicionar valor
          </Button>
        </div>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar valor ao objetivo</DialogTitle>
            <DialogDescription>
              Escolha de onde o valor será debitado e adicionado ao objetivo {goal.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-amount">Valor (R$)</Label>
              <Input
                id="add-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-source">Conta de Origem</Label>
              <Select value={sourceAccount} onValueChange={setSourceAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Carteira", "Cartão Débito", "Cartão Crédito"].map((type) => {
                    const accountsOfType = accounts.filter((a) => a.type === type)
                    if (accountsOfType.length === 0) return null

                    return (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {type === "Carteira"
                            ? "Carteiras"
                            : type === "Cartão Débito"
                              ? "Cartões de Débito"
                              : "Cartões de Crédito"}
                        </div>
                        {accountsOfType.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSubmit}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar valor do objetivo</DialogTitle>
            <DialogDescription>
              O valor será retirado do objetivo {goal.name} e creditado na conta escolhida
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Valor (R$)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                max={goal.currentAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Disponível: {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-destination">Conta de Destino</Label>
              <Select value={sourceAccount} onValueChange={setSourceAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Carteira", "Cartão Débito", "Cartão Crédito"].map((type) => {
                    const accountsOfType = accounts.filter((a) => a.type === type)
                    if (accountsOfType.length === 0) return null

                    return (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {type === "Carteira"
                            ? "Carteiras"
                            : type === "Cartão Débito"
                              ? "Cartões de Débito"
                              : "Cartões de Crédito"}
                        </div>
                        {accountsOfType.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleWithdrawSubmit}>Retirar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
