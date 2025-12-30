"use client"

import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/report-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Transaction } from "@/lib/types/app-types"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useUser } from "@/lib/user-context"

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const { wallets, cards } = useUser()

  const getAccountName = (accountId: string) => {
    const wallet = wallets.find(w => w.id === accountId)
    if (wallet) return wallet.name

    let card = cards.find(c => c.id === accountId)
    if (!card) {
      const cleanId = accountId.replace("-debit", "").replace("-credit", "")
      card = cards.find(c => c.id === cleanId)
    }

    if (card) return card.name

    return accountId
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-5">
      <h3 className="text-sm md:text-base font-semibold mb-4">Detalhamento de Transações ({transactions.length})</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Descrição</TableHead>
              <TableHead className="text-xs">Categoria</TableHead>
              <TableHead className="text-xs">Conta</TableHead>
              <TableHead className="text-xs">Usuário</TableHead>
              <TableHead className="text-xs text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 50).map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-xs">
                  {format(new Date(transaction.date), "dd/MM/yy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-xs font-medium">{transaction.description}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {transaction.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{getAccountName(transaction.account)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{transaction.userName}</TableCell>
                <TableCell className="text-xs text-right">
                  <div className="flex items-center justify-end gap-1">
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-3 w-3 text-[#A2D19C]" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-[#D4AF37]" />
                    )}
                    <span
                      className={
                        transaction.type === "income" ? "text-[#A2D19C] font-semibold" : "text-[#D4AF37] font-semibold"
                      }
                    >
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {transactions.length > 50 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Mostrando 50 de {transactions.length} transações
          </p>
        )}
      </div>
    </Card>
  )
}
