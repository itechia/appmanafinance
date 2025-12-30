"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"
import { db } from "./db"
// Removed dexie-react-hooks useLiveQuery to avoid SSR issues
import type {
  User, Workspace, WorkspaceMember, Category, Budget,
  Transaction, Card, Wallet, Goal, Notification, NotificationPreferences, WorkspacePermissions
} from "./types/app-types"

export type { Transaction, Card, Wallet, Goal, Category, Budget, User, Workspace }

const OWNER_PERMISSIONS: WorkspacePermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  canManageUsers: true
}

interface UserContextType {
  currentUser: User | null
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  currentMember: WorkspaceMember | null
  permissions: WorkspacePermissions
  switchWorkspace: (workspaceId: string) => void
  budgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  cards: Card[]
  wallets: Wallet[]
  goals: Goal[]
  addBudget: (budget: Omit<Budget, "id" | "createdAt" | "userId" | "categoryName" | "categoryColor" | "categoryIcon">) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  addCategory: (category: Omit<Category, "id" | "userId">) => Promise<boolean>
  updateCategory: (id: string, category: Partial<Category>) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  addTransaction: (transaction: Omit<Transaction, "id" | "userId">) => Promise<Transaction>
  updateTransaction: (id: string, transaction: Partial<Transaction>, recurrenceMode?: 'single' | 'future') => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addTransfer: (from: string, to: string, amount: number, description: string, date?: Date) => Promise<void>
  addCard: (card: Omit<Card, "id" | "userId">) => void
  updateCard: (id: string, card: Partial<Card>) => void
  deleteCard: (id: string) => void
  addWallet: (wallet: Omit<Wallet, "id" | "userId">) => void
  updateWallet: (id: string, wallet: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "userId">) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  contributeToGoal: (goalId: string, amount: number, fromAccount: string) => void
  updateUserProfile: (profile: Partial<Omit<User, "id" | "color">>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
  notificationPreferences: any
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void
  notifications: Notification[]
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  deleteNotification: (id: string) => void
  unreadCount: number
  refreshData: () => void
  recalculateBalances: () => void
  clearAllData: () => void
  isMultiUserMode: boolean
  activeUsers: User[]
  toggleUserActive: (userId: string) => void
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  headerDateVisible: boolean
  setHeaderDateVisible: (visible: boolean) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const DATA_STORAGE_KEY = "mana_data_store"

interface AppData {
  workspaces: Workspace[]
  wallets: Wallet[]
  cards: Card[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  goals: Goal[]
  notifications: Notification[]
  preferences: NotificationPreferences
}

const defaultNotificationPreferences: NotificationPreferences = {
  billsDueDaily: true,
  billsAdvanceNotice: 3,
  weeklyReport: true,
  monthlyReport: true,
  monthlyReportDay: "1",
  cardLimitAlert: true,
  budgetExceededAlert: true,
  largeTransactionAlert: false,
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, userId } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [headerDateVisible, setHeaderDateVisible] = useState(true)
  const { toast } = useToast()

  // State for data
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences)

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)

  const refreshData = useCallback(async () => {
    if (!db) return
    try {
      const w = await db.workspaces.toArray(); setWorkspaces(w)
      const wa = await db.wallets.toArray(); setWallets(wa)
      const c = await db.cards.toArray(); setCards(c)
      const cat = await db.categories.toArray(); setCategories(cat)
      const b = await db.budgets.toArray(); setBudgets(b)
      const t = await db.transactions.toArray(); setTransactions(t)
      const g = await db.goals.toArray(); setGoals(g)
      const n = await db.notifications.toArray(); setNotifications(n)

      const p = await db.preferences.get('default')
      if (p) setPreferences(p)
    } catch (e) {
      console.error("Failed to fetch data", e)
    }
  }, [])

  // Migration and Seeding Logic
  useEffect(() => {
    let mounted = true
    if (!db) return

    const initData = async () => {
      try {
        const catCount = await db.categories.count()
        if (catCount === 0) {
          // Check for legacy localStorage data
          const stored = localStorage.getItem(DATA_STORAGE_KEY)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as AppData
              console.log("Migrating data from localStorage to IndexedDB...")

              const tables = [
                db.workspaces, db.wallets, db.cards, db.categories,
                db.budgets, db.transactions, db.goals, db.notifications,
                db.preferences
              ]

              await db.transaction('rw', tables, async () => {
                if (parsed.workspaces?.length) await db.workspaces.bulkAdd(parsed.workspaces)
                if (parsed.wallets?.length) await db.wallets.bulkAdd(parsed.wallets)
                if (parsed.cards?.length) await db.cards.bulkAdd(parsed.cards)
                if (parsed.categories?.length) await db.categories.bulkAdd(parsed.categories)
                if (parsed.budgets?.length) await db.budgets.bulkAdd(parsed.budgets)
                if (parsed.transactions?.length) await db.transactions.bulkAdd(parsed.transactions)
                if (parsed.goals?.length) await db.goals.bulkAdd(parsed.goals)
                if (parsed.notifications?.length) await db.notifications.bulkAdd(parsed.notifications)
                await db.preferences.put({ ...parsed.preferences, id: 'default' })
              })

              console.log("Migration successful!")
              localStorage.removeItem(DATA_STORAGE_KEY)
              toast({ title: "Atualização", description: "Seus dados foram migrados para o novo banco de dados." })
            } catch (e) {
              console.error("Migration failed", e)
              toast({ title: "Erro na migração", description: "Não foi possível migrar os dados antigos.", variant: "destructive" })
            }
          } else {
            // Seed Default Data
            await seedDefaultData()
          }
        }

        if (mounted) await refreshData()

      } catch (e) {
        console.error("DB Init failed", e)
      }
    }

    initData()
    return () => { mounted = false }
  }, [refreshData])

  const seedDefaultData = async () => {
    if (!db) return
    const defaultWorkspace: Workspace = {
      id: 'local-ws-1',
      name: 'Meu Espaço',
      ownerId: 'local-user',
      mode: 'PERSONAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const defaultCategories = [
      { id: 'cat-1', name: 'Alimentação', icon: '🍔', color: '#FF5733', type: 'expense', userId: 'local' },
      { id: 'cat-2', name: 'Moradia', icon: '🏠', color: '#33FF57', type: 'expense', userId: 'local' },
      { id: 'cat-3', name: 'Transporte', icon: '🚗', color: '#3357FF', type: 'expense', userId: 'local' },
      { id: 'cat-4', name: 'Lazer', icon: '🎉', color: '#F333FF', type: 'expense', userId: 'local' },
      { id: 'cat-5', name: 'Saúde', icon: '💊', color: '#FF3333', type: 'expense', userId: 'local' },
      { id: 'cat-6', name: 'Salário', icon: '💰', color: '#33FFF5', type: 'income', userId: 'local' },
      { id: 'cat-7', name: 'Investimentos', icon: '📈', color: '#33FF88', type: 'income', userId: 'local' }
    ]

    await db.workspaces.add(defaultWorkspace)
    await db.categories.bulkAdd(defaultCategories as Category[])
    await db.preferences.put({ ...defaultNotificationPreferences, id: 'default' })
    setCurrentWorkspace(defaultWorkspace)
  }

  // Auto-select workspace
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0])
    }
  }, [workspaces, currentWorkspace])


  // --- CRUD Operations (Manual Refresh) ---
  const addTransaction = async (transaction: Omit<Transaction, "id" | "userId">) => {
    if (!db) throw new Error("Database not initialized")

    // Determine recurrence parameters
    const isRecurring = transaction.isRecurring
    const recurrence = isRecurring ? 'fixed' : (transaction.installmentsTotal && transaction.installmentsTotal > 1) ? 'installments' : 'single'

    const baseDate = new Date(typeof transaction.date === 'string' ? transaction.date : new Date().toISOString())
    const totalInstallments = transaction.installmentsTotal || 1
    const recurrenceId = (recurrence !== 'single') ? `rec-${Date.now()}` : undefined

    // Determine number of transactions to generate
    // Installments: N
    // Recurring (Fixed): Generate 12 months ahead for projection (can be extended indefinitely later)
    const count = recurrence === 'installments' ? totalInstallments : (recurrence === 'fixed' ? 12 : 1)

    // Amount Logic:
    // User Input 'amount' is treated as:
    // - Installments: TOTAL Value (Purchase Price) -> Split by N
    // - Fixed: MONTHLY Value -> Keep as is
    // - Single: TOTAL Value -> Keep as is
    let installmentValue = transaction.amount
    if (recurrence === 'installments' && totalInstallments > 1) {
      // Rounding to 2 decimal places to avoid float issues, adjust last cent in last installment?
      // Simple division for now.
      installmentValue = transaction.amount / totalInstallments
    }

    const createdTransactions: Transaction[] = []

    try {
      await db.transaction('rw', [db.transactions, db.wallets, db.cards], async () => {

        for (let i = 0; i < count; i++) {
          const currentTxId = `tx-${Date.now()}-${i}` // Ensure unique ID

          // Calculate Date
          const txDate = new Date(baseDate)
          txDate.setMonth(baseDate.getMonth() + i)

          // Determine Status
          let currentStatus: 'pending' | 'completed' = 'pending'

          // Logic:
          // 1. Credit Card Installments: ALWAYS consume limit immediately.
          //    To do this, we set status='completed' so updateBalancesForTransaction processes it.
          //    (Assumption: 'completed' on Credit Card means "Limit Reserved", not "Bill Paid")
          // 2. Debit/Cash Installments (Not Paid): status='pending'.
          // 3. Fixed Recurring (Future): status='pending' (Don't consume limit/balance yet).
          // 4. Current (i=0): User preference (isPaid).

          const isCredit = transaction.cardFunction === 'credit'

          if (recurrence === 'installments' && isCredit) {
            // Credit Card Installments: Always 'completed' to deduct Total Limit
            currentStatus = 'completed'
          } else if (i === 0) {
            // First/Current Transaction: Respect User input
            currentStatus = transaction.isPaid ? 'completed' : 'pending'
          } else {
            // Future Fixed/Debit: Always pending
            currentStatus = 'pending'
          }

          const newTx: Transaction = {
            ...transaction,
            id: currentTxId,
            userId: userId || 'local-user',
            date: txDate.toISOString(),
            amount: (recurrence === 'installments') ? installmentValue : transaction.amount, // Use split value or full value
            recurrenceId,
            installmentId: recurrence === 'installments' ? recurrenceId : undefined,
            status: currentStatus,
            isPaid: (currentStatus === 'completed'), // Sync isPaid with status for consistency
            installmentsTotal: (recurrence === 'installments') ? totalInstallments : undefined,
            installmentNumber: (recurrence === 'installments') ? (i + 1) : undefined,
            // Only first one gets the attachment? Or all? Usually just first logic or reference. 
            // Let's keep attachment on all for now or clean up? Keep on all is safer for "Edit All".
          }

          // Update Balances (This validates limit/balance)
          // Only update if status is completed
          if (currentStatus === 'completed') {
            await updateBalancesForTransaction(newTx)
          }

          await db.transactions.add(newTx)
          createdTransactions.push(newTx)
        }
      })

      // Optimistic Update
      setTransactions(prev => [...prev, ...createdTransactions])
      toast({ title: "Sucesso", description: `${count} transações geradas.` })
      return createdTransactions[0]

    } catch (err: any) {
      console.error(err)
      throw err // Re-throw for UI
    }
  }

  const updateBalancesForTransaction = async (tx: Transaction, reverse = false) => {
    if (!db) return
    const amount = reverse ? -tx.amount : tx.amount

    // We need to fetch references to update state correctly or just refresh
    // For simplicity/safety, we act on DB then refresh relevant state
    if (tx.status === 'completed' && tx.account) {
      const wallet = await db.wallets.get(tx.account)
      if (wallet) {
        // Validation: Prevent negative balance for expenses
        const currentBalance = Number(wallet.balance)
        const numericAmount = Number(amount)

        if (numericAmount < 0 && currentBalance + numericAmount < 0) {
          console.error(`[Validation Failed] Balance: ${currentBalance}, Amount: ${numericAmount}`)
          throw new Error("Saldo insuficiente na carteira")
        }
        console.log(`[Updating Wallet] Balance: ${currentBalance} -> ${currentBalance + numericAmount}`)

        const newBal = currentBalance + numericAmount
        await db.wallets.update(wallet.id, { balance: newBal })
      } else {
        const card = await db.cards.get(tx.account)
        if (card) {
          let newBal = card.balance
          let newUsed = card.used || 0

          // Determine if this is a credit or debit operation
          const isCreditOp = tx.cardFunction === 'credit' || (card.type === 'credit' && tx.cardFunction !== 'debit')

          if (isCreditOp) {
            // Credit Operation: Affects 'used' limit
            if (tx.type === 'expense' || tx.type === 'transfer') {
              // Expense is negative. We want to ADD to used.
              // used -= amount => used - (-50) = used + 50.
              newUsed -= amount

              const creditLimit = card.limit || 0
              if (creditLimit > 0 && newUsed > creditLimit) {
                throw new Error(`Limite de crédito excedido. Disponível: R$ ${(creditLimit - (card.used || 0)).toFixed(2)}`)
              }

            } else if (tx.type === 'income') {
              // Income (payment) is positive. We want to REDUCE used.
              // used -= amount => used - 50 = used - 50.
              newUsed -= amount
            }
          } else {
            // Debit Operation: Affects real 'balance'
            if (card.hasDebit && amount < 0 && newBal + amount < 0) {
              // Insufficient debit balance
              throw new Error("Saldo insuficiente no cartão de débito")
            }

            // Just add amount (carries sign)
            newBal += amount
          }

          // Update both fields
          await db.cards.update(card.id, { balance: newBal, used: newUsed })
        }
      }
    }
    // Refresh wallets/cards to reflect balance changes
    const wa = await db.wallets.toArray(); setWallets(wa)
    const c = await db.cards.toArray(); setCards(c)
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>, recurrenceMode: 'single' | 'future' = 'single') => {
    if (!db) return
    const oldTx = await db.transactions.get(id)
    if (!oldTx) return

    try {
      await db.transaction('rw', [db.transactions, db.wallets, db.cards], async () => {
        // 1. Revert Balance impact of OLD transaction if it was completed
        if (oldTx.status === 'completed') {
          await updateBalancesForTransaction(oldTx, true) // Reverse = true
        }

        // 2. Update the current transaction
        const updatedTx = { ...oldTx, ...updates, date: updates.date ? String(updates.date) : oldTx.date }

        // Ensure status and isPaid are synced if one changed
        if (updates.isPaid !== undefined) {
          updatedTx.status = updates.isPaid ? 'completed' : 'pending'
        } else if (updates.status !== undefined) {
          updatedTx.isPaid = updates.status === 'completed'
        }

        await db.transactions.update(id, updatedTx)

        // 3. Apply Balance impact of NEW transaction if it is completed
        if (updatedTx.status === 'completed') {
          await updateBalancesForTransaction(updatedTx, false)
        }

        // 2. Handle Series Update
        if (recurrenceMode === 'future' && oldTx.recurrenceId) {
          // Find future transactions
          const futureTxs = await db.transactions
            .where('recurrenceId').equals(oldTx.recurrenceId)
            .filter(t => t.date > oldTx.date)
            .toArray()

          // Delete them
          const deleteIds = futureTxs.map(t => t.id)
          await db.transactions.bulkDelete(deleteIds)

          // Regenerate
          const isInstallment = !!(oldTx.installmentsTotal && oldTx.installmentsTotal > 1)

          const baseDate = new Date(updatedTx.date)

          let countToGenerate = 0

          if (isInstallment) {
            // Generate remaining installments
            const currentNum = updatedTx.installmentNumber || 1
            const total = updatedTx.installmentsTotal || 1
            countToGenerate = total - currentNum
          } else {
            // Fixed: Generate standard horizon (e.g. 12 months)
            countToGenerate = 12
          }

          if (countToGenerate > 0) {
            const baseAmount = updatedTx.amount

            for (let i = 0; i < countToGenerate; i++) {
              const nextId = `tx-${Date.now()}-${i}-future`
              const nextDate = new Date(baseDate)
              nextDate.setMonth(baseDate.getMonth() + (i + 1))

              let nextStatus: 'pending' | 'completed' = 'pending'

              // If Credit Installment, future is completed (limit used)
              if (isInstallment && updatedTx.cardFunction === 'credit') {
                nextStatus = 'completed'
              }

              const newFutureTx: Transaction = {
                ...updatedTx,
                id: nextId,
                date: nextDate.toISOString(),
                status: nextStatus,
                isPaid: (nextStatus === 'completed'),
                installmentNumber: isInstallment ? ((updatedTx.installmentNumber || 0) + 1 + i) : undefined,
                recurrenceId: oldTx.recurrenceId,
                installmentId: oldTx.installmentId
              }

              if (nextStatus === 'completed') {
                await updateBalancesForTransaction(newFutureTx)
              }

              await db.transactions.add(newFutureTx)
            }
          }
        }
      })

      // Refresh State
      const all = await db.transactions.toArray()
      setTransactions(all)
      toast({ title: "Atualizado", description: "Transação(ões) atualizada(s)" })

    } catch (e: any) {
      console.error(e)
      throw e
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!db) return
    await db.transactions.delete(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast({ title: "Deletado", description: "Transação removida" })
  }

  const addCategory = async (category: Omit<Category, "id" | "userId">) => {
    if (!db) return false
    try {
      const newCat: Category = { ...category, id: `cat-${Date.now()}`, userId: userId || 'local' }
      await db.categories.add(newCat)
      setCategories(prev => [...prev, newCat])
      toast({ title: "Sucesso", description: "Categoria criada com sucesso" })
      return true
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao criar categoria", variant: "destructive" })
      return false
    }
  }

  const updateCategory = async (id: string, category: Partial<Category>) => {
    if (!db) return false
    try {
      await db.categories.update(id, category)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c))
      toast({ title: "Atualizado", description: "Categoria atualizada com sucesso" })
      return true
    } catch (e) {
      return false
    }
  }

  const deleteCategory = async (id: string) => {
    if (!db) return false
    try {
      await db.categories.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast({ title: "Deletado", description: "Categoria removida com sucesso" })
      return true
    } catch (e) {
      return false
    }
  }

  const addBudget = async (budget: any) => {
    if (!db) return
    const newBudget: Budget = {
      ...budget,
      id: `bg-${Date.now()}`,
      userId: userId || 'local',
      createdAt: new Date().toISOString()
    }
    await db.budgets.add(newBudget)
    setBudgets(prev => [...prev, newBudget])
    toast({ title: "Orçamento criado", description: "Orçamento salvo com sucesso" })
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    if (!db) return

    // Logic to snapshot history if Limit is changing
    if (updates.limit !== undefined) {
      const oldBudget = await db.budgets.get(id)
      if (oldBudget && oldBudget.limit !== updates.limit) {
        // We are changing the limit. 
        // Assume the "Old Limit" was valid for the Previous Month (and before).
        // We snapshot it for the Previous Month to preserve history.
        const now = new Date()
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`

        // Check if we already have history for this prev month?
        const existingHistory = oldBudget.history || []
        const hasEntry = existingHistory.some(h => h.month === prevMonthKey)

        if (!hasEntry) {
          const newHistory = [
            ...existingHistory,
            { month: prevMonthKey, limit: oldBudget.limit }
          ]
          updates.history = newHistory
        }
      }
    }

    await db.budgets.update(id, updates)
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, history: updates.history || b.history } : b))
    toast({ title: "Orçamento atualizado", description: "Alterações salvas com sucesso" })
  }

  const deleteBudget = async (id: string) => {
    if (!db) return
    await db.budgets.delete(id)
    setBudgets(prev => prev.filter(b => b.id !== id))
    toast({ title: "Orçamento removido", description: "Orçamento deletado com sucesso" })
  }

  const addWallet = async (wallet: any) => {
    if (!db) return
    const newW: Wallet = { ...wallet, id: `w-${Date.now()}`, userId: userId || 'local' }
    await db.wallets.add(newW)
    setWallets(prev => [...prev, newW])
    toast({ title: "Carteira criada", description: "Nova carteira adicionada" })
  }

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    if (!db) return
    await db.wallets.update(id, updates)
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
    toast({ title: "Carteira atualizada", description: "Alterações salvas" })
  }

  const deleteWallet = async (id: string) => {
    if (!db) return
    await db.wallets.delete(id)
    setWallets(prev => prev.filter(w => w.id !== id))
    toast({ title: "Carteira removida", description: "Carteira deletada com sucesso" })
  }

  const addCard = async (card: any) => {
    if (!db) return
    const newC: Card = { ...card, id: `c-${Date.now()}`, userId: userId || 'local' }
    await db.cards.add(newC)
    setCards(prev => [...prev, newC])
    toast({ title: "Cartão adicionado", description: "Novo cartão salvo com sucesso" })
  }

  const updateCard = async (id: string, updates: Partial<Card>) => {
    if (!db) return
    await db.cards.update(id, updates)
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    toast({ title: "Cartão atualizado", description: "Alterações salvas" })
  }

  const deleteCard = async (id: string) => {
    if (!db) return
    await db.cards.delete(id)
    setCards(prev => prev.filter(c => c.id !== id))
    toast({ title: "Cartão removido", description: "Cartão deletado com sucesso" })
  }

  const addGoal = async (goal: any) => {
    if (!db) return
    const newG: Goal = {
      ...goal,
      id: `g-${Date.now()}`,
      userId: userId || 'local',
      createdAt: new Date().toISOString(),
      deadline: goal.deadline ? (goal.deadline instanceof Date ? goal.deadline.toISOString() : goal.deadline) : new Date().toISOString()
    }
    try {
      await db.goals.add(newG)
      setGoals(prev => [...prev, newG])
      toast({ title: "Meta criada", description: "Nova meta definida com sucesso" })
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao criar meta", variant: "destructive" })
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!db) return
    await db.goals.update(id, updates)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
    toast({ title: "Meta atualizada", description: "Alterações salvas" })
  }

  const deleteGoal = async (id: string) => {
    if (!db) return
    await db.goals.delete(id)
    setGoals(prev => prev.filter(g => g.id !== id))
    toast({ title: "Meta removida", description: "Meta deletada com sucesso" })
  }

  const contributeToGoal = async (goalId: string, amount: number, fromAccount: string) => {
    if (!db) return
    await addTransaction({
      description: `Contribuição para meta`,
      amount: -amount,
      type: 'expense',
      category: 'Investimentos',
      account: fromAccount,
      status: 'completed',
      isPaid: true,
      date: new Date().toISOString()
    })

    const goal = await db.goals.get(goalId)
    if (goal) {
      const newAmount = goal.currentAmount + amount
      await updateGoal(goalId, { currentAmount: newAmount })
      // State update handled by updateGoal
    }
  }

  const addTransfer = async (from: string, to: string, amount: number, description: string, date?: Date) => {
    if (!db) return
    const fromAccount = await db.wallets.get(from)
    const toAccount = await db.wallets.get(to) || await db.cards.get(to) // Allow transfer to Card

    await addTransaction({
      description: `Transferência para: ${toAccount?.name || 'Conta'}`,
      amount: -amount, // Expense is negative
      type: 'expense',
      category: 'Transferência',
      account: from,
      status: 'completed',
      date: date ? date.toISOString() : new Date().toISOString(),
      notes: description
    })

    await addTransaction({
      description: `Transferência de: ${fromAccount?.name || 'Conta'}`,
      amount: amount, // Income is positive
      type: 'income',
      category: 'Transferência',
      account: to,
      status: 'completed',
      date: date ? date.toISOString() : new Date().toISOString(),
      notes: description
    })
  }

  const updateUserProfile = async (profile: Partial<User>) => {
    toast({ title: "Perfil atualizado", description: "Alterações salvas localmente." })
  }

  const uploadAvatar = async (file: File) => {
    const url = URL.createObjectURL(file)
    return url
  }

  const updateNotificationPreferences = (prefs: any) => {
    if (!db) return
    db.preferences.update('default', prefs)
    setPreferences(prev => ({ ...prev, ...prefs }))
  }

  return (
    <UserContext.Provider
      value={{
        currentUser: authUser as unknown as User,
        currentWorkspace: currentWorkspace,
        workspaces: workspaces,
        currentMember: { id: 'mem-1', role: 'OWNER', status: 'ACTIVE', userId: 'local', workspaceId: 'ws-1' } as any,
        permissions: OWNER_PERMISSIONS,
        switchWorkspace: () => { },
        budgets: budgets,
        categories: categories,
        transactions: transactions,
        cards: cards,
        wallets: wallets,
        goals: goals,
        addBudget, updateBudget, deleteBudget,
        addCategory, updateCategory, deleteCategory,
        addTransaction, updateTransaction, deleteTransaction,
        addTransfer,
        addCard, updateCard, deleteCard,
        addWallet, updateWallet, deleteWallet,
        addGoal, updateGoal, deleteGoal, contributeToGoal,
        updateUserProfile, uploadAvatar,
        notificationPreferences: preferences,
        updateNotificationPreferences,
        notifications: notifications,
        markNotificationAsRead: () => { },
        markAllNotificationsAsRead: () => { },
        deleteNotification: () => { },
        unreadCount: 0,
        refreshData,
        recalculateBalances: () => { refreshData() },
        clearAllData: async () => {
          if (db) await db.delete()
          window.location.href = "/"
        },
        isMultiUserMode: false,
        activeUsers: [],
        toggleUserActive: () => { },
        selectedDate,
        setSelectedDate,
        headerDateVisible,
        setHeaderDateVisible,
      }}
    >
      {children}
    </UserContext.Provider >
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
