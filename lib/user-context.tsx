"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

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
    if (!userId) return

    try {
      const [
        { data: w }, { data: wa }, { data: c }, { data: cat },
        { data: b }, { data: t }, { data: g }
      ] = await Promise.all([
        supabase.from('workspaces').select('*').eq('user_id', userId),
        supabase.from('wallets').select('*').eq('user_id', userId),
        supabase.from('cards').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId)
      ])

      if (w) setWorkspaces(w)
      if (wa) setWallets(wa)
      if (c) setCards(c)
      if (cat) setCategories(cat)
      if (b) setBudgets(b)
      if (t) setTransactions(t as unknown as Transaction[]) // Supabase types might vary slightly, cast used
      if (g) setGoals(g)

    } catch (e) {
      console.error("Failed to fetch data", e)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      refreshData()
    }
  }, [userId, refreshData])

  // --- CRUD Operations ---
  const addTransaction = async (transaction: Omit<Transaction, "id" | "userId">) => {
    if (!userId) throw new Error("User not authenticated")

    // Recurrence Logic (simplified from original Context)
    const isRecurring = transaction.isRecurring
    const recurrence = isRecurring ? 'fixed' : (transaction.installmentsTotal && transaction.installmentsTotal > 1) ? 'installments' : 'single'
    const baseDate = new Date(typeof transaction.date === 'string' ? transaction.date : new Date().toISOString())
    const totalInstallments = transaction.installmentsTotal || 1
    const recurrenceId = (recurrence !== 'single') ? `rec-${Date.now()}` : undefined

    const count = recurrence === 'installments' ? totalInstallments : (recurrence === 'fixed' ? 12 : 1)

    let installmentValue = transaction.amount
    if (recurrence === 'installments' && totalInstallments > 1) {
      installmentValue = transaction.amount / totalInstallments
    }

    const createdTransactions: Transaction[] = []

    try {
      // Since we don't have client-side transaction block across multiple calls easily,
      // we'll loop and insert.
      for (let i = 0; i < count; i++) {
        const txDate = new Date(baseDate)
        txDate.setMonth(baseDate.getMonth() + i)

        let currentStatus: 'pending' | 'completed' = 'pending'
        const isCredit = transaction.cardFunction === 'credit'

        if (recurrence === 'installments' && isCredit) {
          currentStatus = 'completed'
        } else if (i === 0) {
          currentStatus = transaction.isPaid ? 'completed' : 'pending'
        } else {
          currentStatus = 'pending'
        }

        const newTx = {
          ...transaction,
          user_id: userId,
          date: txDate.toISOString(),
          amount: (recurrence === 'installments') ? installmentValue : transaction.amount,
          recurrence_id: recurrenceId,
          installment_id: recurrence === 'installments' ? recurrenceId : undefined,
          status: currentStatus,
          is_paid: (currentStatus === 'completed'),
          installments_total: (recurrence === 'installments') ? totalInstallments : undefined,
          installment_number: (recurrence === 'installments') ? (i + 1) : undefined,
        }

        // Map frontend naming to DB naming if needed, but assuming auto-map or consistent naming
        // Actually, my SQL used snake_case, but the app uses camelCase.
        // Supabase client handles this if configured, but let's be explicit or checks types.
        // The table schema has 'user_id', 'recurrence_id' etc.
        // I need to transform the object to match DB columns.

        const dbTx = {
          user_id: userId,
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          date: newTx.date,
          category: newTx.category,
          account: newTx.account,
          status: newTx.status,
          is_paid: newTx.is_paid,
          notes: newTx.notes,
          recurrence_id: newTx.recurrence_id,
          installment_id: newTx.installment_id,
          installments_total: newTx.installments_total,
          installment_number: newTx.installment_number,
          card_function: newTx.cardFunction
        }

        const { data, error } = await supabase
          .from('transactions')
          .insert(dbTx)
          .select()
          .single()

        if (error) throw error
        const savedTx = data as unknown as Transaction // Cast back

        // Balance Update Logic
        if (currentStatus === 'completed') {
          await updateBalancesForTransaction(savedTx)
        }
        createdTransactions.push(savedTx)
      }

      refreshData()
      toast({ title: "Sucesso", description: `${count} transações geradas.` })
      return createdTransactions[0]

    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const updateBalancesForTransaction = async (tx: any, reverse = false) => {
    // Need to refetch wallet/card to be safe
    const amount = reverse ? -tx.amount : tx.amount

    if (tx.account) {
      // Check Wallet
      const { data: wallet } = await supabase.from('wallets').select('*').eq('id', tx.account).single()
      if (wallet) {
        const newBal = Number(wallet.balance) + Number(amount)
        // simplified validaton
        await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id)
        return
      }

      // Check Card
      const { data: card } = await supabase.from('cards').select('*').eq('id', tx.account).single()
      if (card) {
        let newBal = Number(card.balance)
        let newUsed = Number(card.used || 0)
        const isCreditOp = tx.card_function === 'credit' || (card.type === 'credit' && tx.card_function !== 'debit')

        if (isCreditOp) {
          if (tx.type === 'expense' || tx.type === 'transfer') {
            newUsed -= Number(amount)
          } else if (tx.type === 'income') {
            newUsed -= Number(amount)
          }
        } else {
          newBal += Number(amount)
        }

        await supabase.from('cards').update({ balance: newBal, used: newUsed }).eq('id', card.id)
      }
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>, recurrenceMode: 'single' | 'future' = 'single') => {
    // Simplification: Direct update
    // Transform camelCase to snake_case for DB
    const dbUpdates: any = {}
    if (updates.description) dbUpdates.description = updates.description
    if (updates.amount) dbUpdates.amount = updates.amount
    if (updates.date) dbUpdates.date = updates.date
    if (updates.status) dbUpdates.status = updates.status
    if (updates.isPaid !== undefined) dbUpdates.is_paid = updates.isPaid

    const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id)
    if (!error) {
      toast({ title: "Atualizado", description: "Transação atualizada" })
      refreshData()
    }
  }

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast({ title: "Deletado", description: "Transação removida" })
  }

  const addCategory = async (category: Omit<Category, "id" | "userId">) => {
    if (!userId) return false
    const { error } = await supabase.from('categories').insert({
      ...category,
      user_id: userId
    })
    if (!error) {
      refreshData()
      toast({ title: "Sucesso", description: "Categoria criada" })
      return true
    }
    return false
  }

  const updateCategory = async (id: string, category: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(category).eq('id', id)
    if (!error) {
      refreshData()
      return true
    }
    return false
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id))
      return true
    }
    return false
  }

  const addBudget = async (budget: any) => {
    if (!userId) return
    const { error } = await supabase.from('budgets').insert({
      category_name: budget.categoryName,
      limit: budget.limit,
      period: budget.period,
      user_id: userId
    })
    if (!error) {
      refreshData()
      toast({ title: "Orçamento criado", description: "Orçamento salvo" })
    }
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const dbUpdates: any = {}
    if (updates.limit) dbUpdates.limit = updates.limit
    // ... map other fields
    await supabase.from('budgets').update(dbUpdates).eq('id', id)
    refreshData()
    toast({ title: "Orçamento atualizado", description: "Salvo com sucesso" })
  }

  const deleteBudget = async (id: string) => {
    await supabase.from('budgets').delete().eq('id', id)
    refreshData()
  }

  const addWallet = async (wallet: any) => {
    if (!userId) return
    await supabase.from('wallets').insert({ ...wallet, user_id: userId })
    refreshData()
    toast({ title: "Carteira criada", description: "Nova carteira" })
  }

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    await supabase.from('wallets').update(updates).eq('id', id)
    refreshData()
    toast({ title: "Carteira atualizada", description: "Salvo" })
  }

  const deleteWallet = async (id: string) => {
    await supabase.from('wallets').delete().eq('id', id)
    refreshData()
  }

  const addCard = async (card: any) => {
    if (!userId) return
    await supabase.from('cards').insert({ ...card, user_id: userId })
    refreshData()
    toast({ title: "Cartão adicionado", description: "Novo cartão" })
  }

  const updateCard = async (id: string, updates: Partial<Card>) => {
    await supabase.from('cards').update(updates).eq('id', id)
    refreshData()
  }

  const deleteCard = async (id: string) => {
    await supabase.from('cards').delete().eq('id', id)
    refreshData()
  }

  const addGoal = async (goal: any) => {
    if (!userId) return
    await supabase.from('goals').insert({
      ...goal,
      user_id: userId,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount
    })
    refreshData()
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const dbUpdates: any = {}
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount

    await supabase.from('goals').update(dbUpdates).eq('id', id)
    refreshData()
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    refreshData()
  }

  const contributeToGoal = async (goalId: string, amount: number, fromAccount: string) => {
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

    const { data: goal } = await supabase.from('goals').select('*').eq('id', goalId).single()
    if (goal) {
      await updateGoal(goalId, { currentAmount: Number(goal.current_amount) + amount })
    }
  }

  const addTransfer = async (from: string, to: string, amount: number, description: string, date?: Date) => {
    await addTransaction({
      description: `Transferência (Saída)`,
      amount: -amount,
      type: 'expense',
      category: 'Transferência',
      account: from,
      status: 'completed',
      date: date ? date.toISOString() : new Date().toISOString(),
      notes: description
    })

    await addTransaction({
      description: `Transferência (Entrada)`,
      amount: amount,
      type: 'income',
      category: 'Transferência',
      account: to,
      status: 'completed',
      date: date ? date.toISOString() : new Date().toISOString(),
      notes: description
    })
  }

  const updateUserProfile = async (profile: Partial<User>) => {
    if (!userId) return
    await supabase.from('profiles').update(profile).eq('id', userId)
    toast({ title: "Perfil atualizado", description: "Salvo" })
  }

  const uploadAvatar = async (file: File) => {
    // Basic implementation: Upload to Storage bucket 'avatars' (assuming it exists later or return mock)
    // For now, return a fake URL or simple blob as Supabase storage buckets need setup.
    // Returning null to indicate not fully implemented in this step.
    console.warn("Avatar upload requires Storage bucket setup")
    return null
  }

  const updateNotificationPreferences = () => { } // Placeholder

  return (
    <UserContext.Provider
      value={{
        currentUser: authUser as unknown as User,
        currentWorkspace: currentWorkspace,
        workspaces: workspaces,
        currentMember: null,
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
        clearAllData: async () => { },
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
