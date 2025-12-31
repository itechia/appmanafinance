"use client"

import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, type Transaction } from "@/lib/user-context"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { isMultiUserMode, activeUsers, currentUser } = useUser()

  const recentTransactions = transactions.slice(0, 5)

  const getUserDetails = (userId: string) => {
    if (currentUser && currentUser.id === userId) return currentUser
    return activeUsers.find(u => u.id === userId) || { name: 'Unknown', avatar: '', color: 'gray' }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Transações Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas movimentações</p>
        </div>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            Ver todas
          </Button>
        </Link>
      </div>
      {recentTransactions.length > 0 ? (
        <div className="space-y-4">
          {recentTransactions.map((transaction) => {
            const user = getUserDetails(transaction.userId)
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${transaction.type === "income" ? "bg-secondary/10" : "bg-destructive/10"}`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-secondary" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                      {isMultiUserMode && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback style={{ backgroundColor: user.color, fontSize: "0.5rem" }}>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{user.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-sm ${transaction.type === "income" ? "text-secondary" : "text-destructive"}`}
                  >
                    {transaction.type === "income" ? "+" : ""}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Nenhuma transação neste período
        </div>
      )}
    </Card>
  )
}
