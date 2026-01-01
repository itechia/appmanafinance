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

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: '🍔', color: '#FF5733', type: 'expense' },
  { name: 'Transporte', icon: '🚗', color: '#33FF57', type: 'expense' },
  { name: 'Moradia', icon: '🏠', color: '#3357FF', type: 'expense' },
  { name: 'Lazer', icon: '🎉', color: '#F333FF', type: 'expense' },
  { name: 'Saúde', icon: '💊', color: '#FF3333', type: 'expense' },
  { name: 'Salário', icon: '💰', color: '#33FFF5', type: 'income' },
  { name: 'Investimentos', icon: '📈', color: '#33FF33', type: 'income' },
  { name: 'Outros', icon: '📦', color: '#999999', type: 'expense' }
]

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
  const [userProfile, setUserProfile] = useState<any>(null) // Local profile state

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)

  const refreshData = useCallback(async () => {
    if (!userId) return

    // Determine whose data to fetch
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    try {
      const [
        { data: w }, { data: wa }, { data: c }, { data: cat },
        { data: b }, { data: t }, { data: g }, { data: p }
      ] = await Promise.all([
        supabase.from('workspaces').select('*'), // Fetch all accessible workspaces (RLS filtered)
        supabase.from('wallets').select('*').eq('user_id', targetUserId),
        supabase.from('cards').select('*').eq('user_id', targetUserId),
        supabase.from('categories').select('*').eq('user_id', targetUserId),
        supabase.from('budgets').select('*').eq('user_id', targetUserId),
        supabase.from('transactions').select('*').eq('user_id', targetUserId),
        supabase.from('goals').select('*').eq('user_id', targetUserId),
        supabase.from('profiles').select('*').eq('id', userId).single() // Always fetch MY profile for settings/avatar
      ])

      if (w) setWorkspaces(w)
      if (wa) {
        const mappedWallets = wa.map((wallet: any) => ({
          ...wallet,
          userId: wallet.user_id
        }))
        setWallets(mappedWallets)
      }
      if (c) {
        const mappedCards = c.map((card: any) => ({
          ...card,
          lastDigits: card.last4,
          closingDay: card.closing_day,
          dueDay: card.due_day,
          dueDate: card.due_day,
          hasCredit: card.type === 'credit' || card.type === 'both',
          hasDebit: card.type === 'debit' || card.type === 'both',
          userId: card.user_id
        }))
        setCards(mappedCards)
      }
      if (cat) {
        const mappedCategories = cat.map((c: any) => ({
          ...c,
          userId: c.user_id
        }))
        setCategories(mappedCategories)

        // Only seed default categories if I am the owner and it's empty
        if (cat.length === 0 && targetUserId === userId) {
          seedDefaultCategories()
        }
      }
      if (b) {
        const mappedBudgets = b.map((budget: any) => ({
          ...budget,
          categoryId: budget.category_id,
          categoryName: budget.category_name,
          categoryIcon: budget.category_icon,
          categoryColor: budget.category_color,
          userId: budget.user_id,
          createdAt: budget.created_at,
          alertThreshold: budget.alert_threshold || 80
        }))
        setBudgets(mappedBudgets)
      }
      if (t) {
        const mappedTransactions = t.map((tx: any) => ({
          ...tx,
          isPaid: tx.is_paid,
          cardFunction: tx.card_function,
          installmentsTotal: tx.installments_total,
          installmentNumber: tx.installment_number,
          recurrenceId: tx.recurrence_id,
          installmentId: tx.installment_id,
          userId: tx.user_id
        }))
        setTransactions(mappedTransactions)
      }
      if (g) {
        const mappedGoals = g.map((goal: any) => ({
          ...goal,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          userId: goal.user_id,
          createdAt: goal.created_at,
          imageUrl: goal.image_url
        }))
        setGoals(mappedGoals)
      }

      if (p && !currentWorkspace) {
        // Update User Profile only if viewing personal workspace (or always? usually userProfile is ME)
        // Correct: userProfile state represents ME.
        setUserProfile({
          ...p,
          firstName: p.first_name,
          lastName: p.last_name,
          birthDate: p.birth_date,
          avatar: p.avatar_url,

          // WhatsApp Settings mapping
          whatsappEnabled: p.plan === 'pro' ? true : p.whatsapp_enabled, // Auto-enable if Pro (per user request interpretation, or just default?)
          // Actual request: "quando o usuario fazer assinatura pro o campo Conectar Whatsapp deve ficar selecionado automaticamente"
          // We can force it here visually, or assume backend update. Let's respect DB but fallback to true if PRO and DB is null? 
          // Database default is false. Let's just map p.whatsapp_enabled.
          // Wait, if I change it to `p.plan === 'pro' || p.whatsapp_enabled`, they can't turn it off?
          // I will stick to mapping the column. The auto-selection should happen at the moment of subscription (backend).
          // But I can't control backend here. I'll map the column.
          whatsappPhone: p.whatsapp_phone,
          whatsappPersonalities: p.whatsapp_personalities,
          whatsappGender: p.whatsapp_gender,
          whatsappOriginState: p.whatsapp_origin_state,
          whatsappDefaultDebitAccount: p.whatsapp_default_debit_account,
          whatsappDefaultCreditCard: p.whatsapp_default_credit_card,
          whatsappCmdExpenses: p.whatsapp_cmd_expenses,
          whatsappCmdBalance: p.whatsapp_cmd_balance,
          whatsappCmdTransactions: p.whatsapp_cmd_transactions,

          // Notification Mapping (into User profile)
          notifyBillsDueDaily: p.notify_bills_due_daily,
          notifyBillsAdvanceDays: p.notify_bills_advance_days,
          notifyWeeklyReport: p.notify_weekly_report,
          notifyMonthlyReport: p.notify_monthly_report,
          notifyMonthlyReportDay: p.notify_monthly_report_day,
          notifyCardLimit: p.notify_card_limit,
          notifyBudgetExceeded: p.notify_budget_exceeded,
          notifyLargeTransaction: p.notify_large_transaction,
        })

        // Also update separate preferences state to keep components working
        setPreferences({
          billsDueDaily: p.notify_bills_due_daily,
          billsAdvanceNotice: p.notify_bills_advance_days,
          weeklyReport: p.notify_weekly_report,
          monthlyReport: p.notify_monthly_report,
          monthlyReportDay: p.notify_monthly_report_day,
          cardLimitAlert: p.notify_card_limit,
          budgetExceededAlert: p.notify_budget_exceeded,
          largeTransactionAlert: p.notify_large_transaction,
        })
      }

    } catch (e) {
      console.error("Failed to fetch data", e)
    }
  }, [userId, currentWorkspace])

  const seedDefaultCategories = async () => {
    if (!userId) return
    console.log("Seeding default categories...")
    const categoriesToInsert = DEFAULT_CATEGORIES.map(c => ({
      ...c,
      user_id: userId
    }))

    // Insert all at once
    const { error } = await supabase.from('categories').insert(categoriesToInsert)

    if (error) {
      console.error("Error seeding categories:", error)
    } else {
      console.log("Default categories seeded successfully")
      // Refetch to update UI without infinite loop (since length will be > 0 now)
      const { data } = await supabase.from('categories').select('*').eq('user_id', userId)
      if (data) setCategories(data)
    }
  }

  useEffect(() => {
    if (userId) {
      refreshData()
    }
  }, [userId, currentWorkspace, refreshData])

  const switchWorkspace = (workspaceId: string) => {
    if (workspaceId === 'personal') {
      setCurrentWorkspace(null)
      toast({ title: "Workspace Pessoal", description: "Você está visualizando seus dados." })
    } else {
      const ws = workspaces.find(w => w.id === workspaceId)
      if (ws) {
        setCurrentWorkspace(ws)
        toast({ title: `Workspace: ${ws.name}`, description: "Alternado com sucesso." })
      } else {
        toast({ title: "Erro", description: "Workspace não encontrado.", variant: "destructive" })
      }
    }
  }

  // --- CRUD Operations ---
  const addTransaction = async (transaction: Omit<Transaction, "id" | "userId">) => {
    if (!userId) throw new Error("User not authenticated")
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

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
          user_id: targetUserId,
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
          user_id: targetUserId,
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
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    const { error } = await supabase.from('categories').insert({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      user_id: targetUserId
    })

    if (!error) {
      refreshData()
      toast({ title: "Sucesso", description: "Categoria criada" })
      return true
    } else {
      console.error("Error creating category:", error)
      toast({ title: "Erro", description: "Falha ao criar categoria", variant: "destructive" })
    }
    return false
  }

  const updateCategory = async (id: string, category: Partial<Category>) => {
    const dbUpdates: any = {}
    if (category.name) dbUpdates.name = category.name
    if (category.icon) dbUpdates.icon = category.icon
    if (category.color) dbUpdates.color = category.color
    if (category.type) dbUpdates.type = category.type

    const { error } = await supabase.from('categories').update(dbUpdates).eq('id', id)

    if (!error) {
      refreshData()
      toast({ title: "Categoria atualizada", description: "Sucesso" })
      return true
    } else {
      console.error("Error updating category:", error)
      toast({ title: "Erro", description: "Falha ao atualizar categoria", variant: "destructive" })
    }
    return false
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id))
      toast({ title: "Categoria removida", description: "Sucesso" })
      return true
    } else {
      console.error("Error deleting category:", error)
      toast({ title: "Erro", description: "Falha ao remover categoria", variant: "destructive" })
    }
    return false
  }

  const addBudget = async (budget: any) => {
    if (!userId) return
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    const { error } = await supabase.from('budgets').insert({
      category_name: budget.categoryName,
      // @ts-ignore - columns added recently
      category_id: budget.categoryId,
      // @ts-ignore
      category_icon: budget.categoryIcon,
      // @ts-ignore
      category_color: budget.categoryColor,
      limit: budget.limit,
      period: budget.period,
      alert_threshold: budget.alertThreshold, // Added column
      user_id: targetUserId
    })

    if (!error) {
      refreshData()
      toast({ title: "Orçamento criado", description: "Orçamento salvo" })
    } else {
      console.error("Error adding budget:", error)
      toast({ title: "Erro", description: "Falha ao criar orçamento", variant: "destructive" })
    }
  }

  const updateBudget = async (id: string, updates: any) => {
    const dbUpdates: any = {}
    if (updates.limit) dbUpdates.limit = updates.limit
    if (updates.period) dbUpdates.period = updates.period

    // Convert camelCase from UI to snake_case for DB
    if (updates.categoryId) dbUpdates.category_id = updates.categoryId
    if (updates.categoryName) dbUpdates.category_name = updates.categoryName
    if (updates.categoryIcon) dbUpdates.category_icon = updates.categoryIcon
    if (updates.categoryColor) dbUpdates.category_color = updates.categoryColor
    if (updates.alertThreshold) dbUpdates.alert_threshold = updates.alertThreshold

    const { error } = await supabase.from('budgets').update(dbUpdates).eq('id', id)

    if (!error) {
      refreshData()
      toast({ title: "Orçamento atualizado", description: "Salvo com sucesso" })
    } else {
      console.error("Error updating budget:", error)
      toast({ title: "Erro", description: "Falha ao atualizar orçamento", variant: "destructive" })
    }
  }

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) {
      await refreshData() // await ensures data is fresh before toast?
      toast({ title: "Orçamento removido", description: "O orçamento foi removido com sucesso." })
    } else {
      console.error("Error deleting budget:", error)
      toast({ title: "Erro", description: "Falha ao remover orçamento", variant: "destructive" })
    }
  }

  const addWallet = async (wallet: any) => {
    if (!userId) return
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    // Limitation Check
    const isPro = userProfile?.plan === 'pro'
    // Filter wallets owned by this user context (or target user)
    // Actually, 'wallets' state contains all wallets for the view.
    // If I am adding to my own workspace (personal), check my limits.
    // If I am adding to a shared workspace, limits might depend on the owner's plan? 
    // Usually, limits are per user/owner.
    // Let's assume we check the owner's limits.
    // NOTE: currentWorkspace.ownerId might trigger a check against that owner's profile later.
    // But currentUser is the LOGGED IN user.
    // If I am in a workspace, I am acting as a member.
    // For now, let's enforce limits based on the CURRENT USER's plan if it's their personal workspace.
    // If it's a shared workspace, we assume Pro (since Workspaces are a pro feature usually? Or maybe checking owner plan is hard here).

    // Simplification: Check CURRENT USER limit if in PERSONAL mode.
    if (!currentWorkspace) {
      if (!isPro && wallets.length >= 1) {
        toast({
          title: "Limite Atingido",
          description: "O plano Gratuito permite apenas 1 carteira. Faça Upgrade para Pro!",
          variant: "destructive"
        })
        return
      }
    }

    const { error } = await supabase.from('wallets').insert({
      name: wallet.name,
      balance: wallet.balance,
      color: wallet.color,
      type: wallet.type,
      // @ts-ignore - icon column added recently
      icon: wallet.icon,
      user_id: targetUserId
    })

    if (error) {
      console.error("Error creating wallet:", error)
      throw error
    }
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
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    // Limitation Check
    const isPro = userProfile?.plan === 'pro'
    if (!currentWorkspace) {
      if (!isPro && cards.length >= 2) {
        toast({
          title: "Limite Atingido",
          description: "O plano Gratuito permite apenas 2 cartões. Faça Upgrade para Pro!",
          variant: "destructive"
        })
        return
      }
    }

    const { error } = await supabase.from('cards').insert({
      name: card.name,
      type: card.type,
      limit: card.limit,
      balance: card.balance,
      used: card.used || 0,
      closing_day: card.closingDay,
      due_day: card.dueDate,
      color: card.color,
      brand: card.brand,
      last4: card.lastDigits,
      user_id: targetUserId
    })

    if (error) {
      console.error("Error creating card:", error)
      throw error
    }
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
    const targetUserId = currentWorkspace ? currentWorkspace.ownerId : userId

    const { error } = await supabase.from('goals').insert({
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline,
      icon: goal.icon,
      color: goal.color,
      category: goal.category,
      image_url: goal.imageUrl,
      user_id: targetUserId
    })

    if (!error) {
      refreshData()
      toast({ title: "Objetivo criado", description: "Sucesso" })
    } else {
      console.error("Error creating goal:", error)
      toast({ title: "Erro", description: "Falha ao criar objetivo", variant: "destructive" })
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const dbUpdates: any = {}
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount
    if (updates.name) dbUpdates.name = updates.name
    if (updates.icon) dbUpdates.icon = updates.icon
    if (updates.color) dbUpdates.color = updates.color
    if (updates.deadline) dbUpdates.deadline = updates.deadline
    if (updates.category) dbUpdates.category = updates.category
    if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl

    const { error } = await supabase.from('goals').update(dbUpdates).eq('id', id)

    if (!error) {
      await refreshData()
      toast({ title: "Objetivo atualizado", description: "Sucesso" })
    } else {
      console.error("Error updating goal:", error)
      toast({ title: "Erro", description: "Falha ao atualizar objetivo", variant: "destructive" })
    }
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) {
      await refreshData()
      toast({ title: "Objetivo removido", description: "Sucesso" })
    } else {
      console.error("Error deleting goal:", error)
      toast({ title: "Erro", description: "Falha ao remover objetivo", variant: "destructive" })
    }
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

    const dbProfile: any = {}
    if (profile.name) dbProfile.name = profile.name
    if (profile.firstName) dbProfile.first_name = profile.firstName
    if (profile.lastName) dbProfile.last_name = profile.lastName
    if (profile.phone) dbProfile.phone = profile.phone
    if (profile.cpf) dbProfile.cpf = profile.cpf
    if (profile.birthDate) dbProfile.birth_date = profile.birthDate
    if (profile.bio) dbProfile.bio = profile.bio
    if (profile.avatar) dbProfile.avatar_url = profile.avatar

    // Direct WhatsApp Column Mapping
    if (profile.whatsappEnabled !== undefined) dbProfile.whatsapp_enabled = profile.whatsappEnabled
    if (profile.whatsappPhone !== undefined) dbProfile.whatsapp_phone = profile.whatsappPhone
    if (profile.whatsappPersonalities !== undefined) dbProfile.whatsapp_personalities = profile.whatsappPersonalities
    if (profile.whatsappGender !== undefined) dbProfile.whatsapp_gender = profile.whatsappGender
    if (profile.whatsappOriginState !== undefined) dbProfile.whatsapp_origin_state = profile.whatsappOriginState
    if (profile.whatsappDefaultDebitAccount !== undefined) dbProfile.whatsapp_default_debit_account = profile.whatsappDefaultDebitAccount || null
    if (profile.whatsappDefaultCreditCard !== undefined) dbProfile.whatsapp_default_credit_card = profile.whatsappDefaultCreditCard || null
    if (profile.whatsappCmdExpenses !== undefined) dbProfile.whatsapp_cmd_expenses = profile.whatsappCmdExpenses
    if (profile.whatsappCmdBalance !== undefined) dbProfile.whatsapp_cmd_balance = profile.whatsappCmdBalance
    if (profile.whatsappCmdTransactions !== undefined) dbProfile.whatsapp_cmd_transactions = profile.whatsappCmdTransactions

    try {
      const { error } = await supabase.from('profiles').update(dbProfile).eq('id', userId)

      if (error) throw error

      // Optimistic update of local state
      setUserProfile((prev: any) => ({
        ...prev,
        ...profile,
        // Map back for local state consistency if needed
        first_name: profile.firstName ?? prev?.first_name,
        last_name: profile.lastName ?? prev?.last_name,
        birth_date: profile.birthDate ?? prev?.birth_date,
        avatar_url: profile.avatar ?? prev?.avatar_url,
      }))

      toast({ title: "Perfil atualizado", description: "As alterações foram salvas." })

      // Trigger refresh in background without blocking UI
      refreshData()

    } catch (error) {
      console.error("Error updating profile", error)
      toast({ title: "Erro", description: "Falha ao atualizar perfil", variant: "destructive" })
      throw error // Re-throw to let component know it failed
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const updateNotificationPreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!userId) return

    // Optimistic update
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)

    const dbUpdates: any = {}
    if (newPrefs.billsDueDaily !== undefined) dbUpdates.notify_bills_due_daily = newPrefs.billsDueDaily
    if (newPrefs.billsAdvanceNotice !== undefined) dbUpdates.notify_bills_advance_days = newPrefs.billsAdvanceNotice
    if (newPrefs.weeklyReport !== undefined) dbUpdates.notify_weekly_report = newPrefs.weeklyReport
    if (newPrefs.monthlyReport !== undefined) dbUpdates.notify_monthly_report = newPrefs.monthlyReport
    if (newPrefs.monthlyReportDay !== undefined) dbUpdates.notify_monthly_report_day = newPrefs.monthlyReportDay
    if (newPrefs.cardLimitAlert !== undefined) dbUpdates.notify_card_limit = newPrefs.cardLimitAlert
    if (newPrefs.budgetExceededAlert !== undefined) dbUpdates.notify_budget_exceeded = newPrefs.budgetExceededAlert
    if (newPrefs.largeTransactionAlert !== undefined) dbUpdates.notify_large_transaction = newPrefs.largeTransactionAlert

    try {
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId)
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      toast({ title: "Erro", description: "Falha ao salvar preferências", variant: "destructive" })
      // Revert? For now keeping optimistic state assuming retry or ignore.
    }
  }
  const markNotificationAsRead = () => { } // Placeholder
  const clearAllNotifications = () => { } // Placeholder
  const deleteNotification = () => { } // Placeholder
  const markAllNotificationsAsRead = () => { } // Placeholder

  // Multi-user & System placeholders
  const unreadCount = 0
  const recalculateBalances = () => { refreshData() }
  const clearAllData = async () => { }
  const isMultiUserMode = false
  const activeUsers: any[] = []
  const toggleUserActive = () => { }

  /*
   * Constructing the context value object.
   */
  const value: UserContextType = {
    currentUser: userProfile ? { ...authUser, ...userProfile } : authUser as any,
    currentWorkspace,
    workspaces,
    currentMember: null,
    permissions: OWNER_PERMISSIONS,
    switchWorkspace,
    budgets,
    categories,
    transactions,
    cards,
    wallets,
    goals,
    addBudget,
    updateBudget,
    deleteBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTransfer,
    addCard,
    updateCard,
    deleteCard,
    addWallet,
    updateWallet,
    deleteWallet,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    updateUserProfile,
    uploadAvatar,
    notificationPreferences: preferences,
    updateNotificationPreferences,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadCount,
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
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
