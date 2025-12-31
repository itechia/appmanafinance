"use client"

import { useState, useMemo } from "react"
import { ArrowUpRight, ArrowDownRight, MoreVertical, Pencil, Trash2, Copy, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/user-context"
import { TransactionDialog } from "./transaction-dialog"
import { startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { DateRange } from "react-day-picker"
import { formatCurrency } from "@/lib/utils"

interface TransactionListProps {
  searchQuery?: string
  selectedUserIds?: string[]
  filters?: {
    type: string
    category: string
    account: string
    period: string
    dateRange: DateRange | undefined
  }
}

export function TransactionList({ searchQuery = "", selectedUserIds = [], filters }: TransactionListProps) {
  const { transactions: contextTransactions, deleteTransaction, currentUser, wallets, cards } = useUser()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const { toast } = useToast()

  const getAccountDetails = (transaction: any) => {
    const wallet = wallets.find(w => w.id === transaction.account)
    if (wallet) return { name: wallet.name, type: 'wallet', label: 'Carteira' }

    let card = cards.find(c => c.id === transaction.account)
    if (!card) {
      const cleanId = transaction.account.replace("-debit", "").replace("-credit", "")
      card = cards.find(c => c.id === cleanId)
    }

    if (card) {
      // Determine function used
      const isCredit = transaction.cardFunction === 'credit' || (card.type === 'credit' && transaction.cardFunction !== 'debit')
      const label = isCredit ? 'Crédito' : 'Débito'
      return { name: card.name, type: 'card', label, isCredit }
    }

    return { name: transaction.account, type: 'unknown', label: '' }
  }

  const filteredTransactions = useMemo(() => {
    let result = contextTransactions.filter((transaction) => {
      const { name, label } = getAccountDetails(transaction)
      const searchLower = searchQuery.toLowerCase()

      // Search Filter
      const matchesSearch =
        searchQuery === "" ||
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower) ||
        name.toLowerCase().includes(searchLower) ||
        label.toLowerCase().includes(searchLower)

      // User Filter
      const matchesUser = selectedUserIds.length === 0 || selectedUserIds.includes(transaction.userId)

      // Type Filter
      let matchesType = true
      if (filters?.type && filters.type !== 'all') {
        matchesType = transaction.type === filters.type
      }

      // Category Filter
      let matchesCategory = true
      if (filters?.category && filters.category !== 'all') {
        matchesCategory = transaction.category.toLowerCase() === filters.category.toLowerCase()
      }

      // Account Filter
      let matchesAccount = true
      if (filters?.account && filters.account !== 'all') {
        matchesAccount = transaction.account.includes(filters.account) // Fuzzy match for card variants
        if (!matchesAccount) {
          // Exact match check if fuzzy failed or to be precise
          const cleanId = transaction.account.replace("-debit", "").replace("-credit", "")
          matchesAccount = transaction.account === filters.account || cleanId === filters.account
        }
      }

      // Period Filter
      let matchesPeriod = true
      if (filters?.period) {
        const txDate = new Date(transaction.date)
        const today = new Date()

        if (filters.period === 'month') {
          const start = startOfMonth(today)
          const end = endOfMonth(today)
          matchesPeriod = isWithinInterval(txDate, { start, end })
        } else if (filters.period === 'last-month') {
          const start = startOfMonth(subMonths(today, 1))
          const end = endOfMonth(subMonths(today, 1))
          matchesPeriod = isWithinInterval(txDate, { start, end })
        } else if (filters.period === 'next-3-months') {
          const start = startOfDay(today)
          const end = endOfMonth(addMonths(today, 3)) // Next 3 months explicitly
          matchesPeriod = isWithinInterval(txDate, { start, end })
        } else if (filters.period === 'quarter') {
          const start = subMonths(today, 3)
          const end = today
          matchesPeriod = isWithinInterval(txDate, { start, end })
        } else if (filters.period === 'year') {
          const start = startOfYear(today)
          const end = endOfYear(today)
          matchesPeriod = isWithinInterval(txDate, { start, end })
        } else if (filters.period === 'custom' && filters.dateRange?.from) {
          const start = startOfDay(filters.dateRange.from)
          const end = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endOfDay(filters.dateRange.from)
          matchesPeriod = isWithinInterval(txDate, { start, end })
        }
      }

      return matchesSearch && matchesUser && matchesType && matchesCategory && matchesAccount && matchesPeriod
    })

    // Sort by Date Ascending (Oldest to Newest)
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  }, [contextTransactions, searchQuery, selectedUserIds, filters])

  const handleEdit = (transaction: any) => {
    setEditTransaction(transaction)
  }

  const handleDuplicate = (id: string) => {
    const transaction = contextTransactions.find((t) => t.id === id)
    if (transaction) {
      // This will be handled by TransactionDialog
      toast({
        title: "Duplicar transação",
        description: "Funcionalidade em desenvolvimento.",
      })
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId)
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
        variant: "destructive",
      })
      setDeleteId(null)
    }
  }

  // Update Render Logic (Mobile Card)
  // ...
  // <span className="truncate">{getAccountDetails(transaction).name}</span>
  // {getAccountDetails(transaction).type === 'card' && (
  //   <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1">
  //     {getAccountDetails(transaction).label}
  //   </Badge>
  // )}

  // Update Render Logic (Desktop Table)
  // ...
  // <td className="px-4 py-3 text-sm text-muted-foreground">
  //   <div className="flex flex-col">
  //     <span>{getAccountDetails(transaction).name}</span>
  //     {getAccountDetails(transaction).type === 'card' && (
  //       <span className={`text-[10px] ${getAccountDetails(transaction).isCredit ? 'text-amber-600' : 'text-primary'}`}>
  //         {getAccountDetails(transaction).label}
  //       </span>
  //     )}
  //   </div>
  // </td>

  return (
    <>
      <div className="block md:hidden space-y-2">
        {filteredTransactions.map((transaction) => {
          const account = getAccountDetails(transaction)
          return (
            <Card key={transaction.id} className="p-3 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
                  <div
                    className={`rounded-full p-2 flex-shrink-0 ${transaction.type === "income" ? "bg-[#A2D19C]/10" : "bg-[#D4AF37]/10"}`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-[#A2D19C]" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-[#D4AF37]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground truncate">{transaction.category}</p>
                      </div>
                      <span
                        className={`font-semibold text-sm whitespace-nowrap flex-shrink-0 ${transaction.type === "income" ? "text-[#A2D19C]" : "text-[#D4AF37]"}`}
                      >
                        {transaction.type === "income" ? "+" : ""}
                        {Math.abs(transaction.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                      <span className="truncate">{new Date(transaction.date).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span className="truncate">{account.name}</span>
                      {account.type === 'card' && (
                        <span className={`px-1 py-0.5 rounded text-[9px] border ${account.isCredit ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-primary text-primary bg-primary/5'}`}>
                          {account.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <Badge
                        variant={transaction.status === "completed" ? "default" : "secondary"}
                        className="text-xs h-5"
                      >
                        {transaction.status === "completed" ? "Concluída" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {transaction.status === 'pending' && (
                      <DropdownMenuItem onClick={() => setEditTransaction({ ...transaction, isPaid: true })} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Pagar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(transaction.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(transaction.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Conta / Função</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransactions.map((transaction) => {
                const account = getAccountDetails(transaction)
                return (
                  <tr key={transaction.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${transaction.type === "income" ? "bg-[#A2D19C]/10" : "bg-[#D4AF37]/10"}`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4 text-[#A2D19C]" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-[#D4AF37]" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{transaction.category}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{account.name}</span>
                        {account.type === 'card' && (
                          <span className={`text-[10px] font-medium ${account.isCredit ? 'text-amber-600' : 'text-primary'}`}>
                            {account.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {transaction.status === "completed" ? "Concluída" : "Pendente"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold text-sm ${transaction.type === "income" ? "text-[#A2D19C]" : "text-[#D4AF37]"}`}
                      >
                        {transaction.type === "income" ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {transaction.status === 'pending' && (
                            <DropdownMenuItem onClick={() => setEditTransaction({ ...transaction, isPaid: true })} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Pagar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(transaction.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(transaction.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {editTransaction && (
        <TransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction}
        />
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
