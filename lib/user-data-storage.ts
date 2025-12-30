/**
 * Sistema de armazenamento de dados isolado por usuário (Multi-Tenant)
 * Garante que cada usuário tenha seus próprios dados completamente separados
 * Compatível com LGPD - dados isolados e privados por padrão
 */

import type { Budget, Category, Transaction, Card, Wallet, Goal } from "./user-context"

// Categorias padrão brasileiras para finanças pessoais
const DEFAULT_CATEGORIES: Omit<Category, "id" | "userId">[] = [
  // Despesas
  { name: "Alimentação", icon: "🍔", color: "#195c3e", type: "expense" },
  { name: "Transporte", icon: "🚗", color: "#28a745", type: "expense" },
  { name: "Moradia", icon: "🏠", color: "#20c997", type: "expense" },
  { name: "Saúde", icon: "💊", color: "#6610f2", type: "expense" },
  { name: "Educação", icon: "📚", color: "#fd7e14", type: "expense" },
  { name: "Lazer", icon: "🎮", color: "#17a2b8", type: "expense" },
  { name: "Vestuário", icon: "👕", color: "#e83e8c", type: "expense" },
  { name: "Contas e Serviços", icon: "📱", color: "#6c757d", type: "expense" },
  { name: "Outros", icon: "📦", color: "#adb5bd", type: "expense" },
  // Receitas
  { name: "Salário", icon: "💰", color: "#28a745", type: "income" },
  { name: "Freelance", icon: "💼", color: "#20c997", type: "income" },
  { name: "Investimentos", icon: "📈", color: "#17a2b8", type: "income" },
  { name: "Outros", icon: "💵", color: "#6c757d", type: "income" },
]

// Orçamentos padrão sugeridos (valores em R$)
const DEFAULT_BUDGETS: Omit<Budget, "id" | "userId" | "createdAt" | "categoryId" | "categoryColor" | "categoryIcon">[] = [
  { categoryName: "Alimentação", limit: 1500, period: "monthly", alertThreshold: 80 },
  { categoryName: "Transporte", limit: 800, period: "monthly", alertThreshold: 80 },
  { categoryName: "Moradia", limit: 2000, period: "monthly", alertThreshold: 90 },
  { categoryName: "Saúde", limit: 500, period: "monthly", alertThreshold: 80 },
  { categoryName: "Lazer", limit: 400, period: "monthly", alertThreshold: 80 },
]

interface UserData {
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  cards: Card[]
  wallets: Wallet[]
  goals: Goal[]
  sharedWith: string[] // IDs de usuários com quem compartilha dados
  sharedFrom: string[] // IDs de usuários que compartilharam dados
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getUserDataKey(userId: string): string {
  return `mana_user_data_${userId}`
}

export const userDataStorage = {
  /**
   * Inicializa dados padrão para um novo usuário
   */
  initializeUserData: (userId: string): void => {
    if (typeof window === "undefined") return

    const existingData = userDataStorage.getUserData(userId)
    if (existingData.categories.length > 0) {
      // Usuário já tem dados, não sobrescrever
      return
    }

    // Criar categorias padrão
    const categories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      userId,
    }))

    // Criar orçamentos padrão
    const budgets: Budget[] = DEFAULT_BUDGETS.map((budget) => {
      const category = categories.find((c) => c.name === budget.categoryName)
      return {
        ...budget,
        id: generateId(),
        userId,
        createdAt: new Date().toISOString(),
        categoryId: category ? category.id : "unknown",
        categoryName: budget.categoryName, // Ensure categoryName is set
      }
    })

    const userData: UserData = {
      categories,
      budgets,
      transactions: [],
      cards: [],
      wallets: [],
      goals: [],
      sharedWith: [],
      sharedFrom: [],
    }

    localStorage.setItem(getUserDataKey(userId), JSON.stringify(userData))
  },

  /**
   * Obtém todos os dados de um usuário
   */
  getUserData: (userId: string): UserData => {
    if (typeof window === "undefined") {
      return {
        categories: [],
        budgets: [],
        transactions: [],
        cards: [],
        wallets: [],
        goals: [],
        sharedWith: [],
        sharedFrom: [],
      }
    }

    const stored = localStorage.getItem(getUserDataKey(userId))
    if (!stored) {
      return {
        categories: [],
        budgets: [],
        transactions: [],
        cards: [],
        wallets: [],
        goals: [],
        sharedWith: [],
        sharedFrom: [],
      }
    }

    try {
      const data = JSON.parse(stored)
      // Converter datas de string para Date
      // Converter datas de string para Date - REMOVIDO pois a interface usa string
      /*
      if (data.budgets) {
        data.budgets = data.budgets.map((b: Budget) => ({
          ...b,
          createdAt: b.createdAt,
        }))
      }
      */
      // Garantir que cards, wallets e goals existam
      if (!data.cards) data.cards = []
      if (!data.wallets) data.wallets = []
      if (!data.goals) data.goals = []
      return data
    } catch (e) {
      return {
        categories: [],
        budgets: [],
        transactions: [],
        cards: [],
        wallets: [],
        goals: [],
        sharedWith: [],
        sharedFrom: [],
      }
    }
  },

  /**
   * Salva dados do usuário
   */
  saveUserData: (userId: string, data: UserData): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(getUserDataKey(userId), JSON.stringify(data))
  },

  // CATEGORIAS
  getCategories: (userId: string): Category[] => {
    return userDataStorage.getUserData(userId).categories
  },

  addCategory: (userId: string, category: Omit<Category, "id">): Category => {
    const data = userDataStorage.getUserData(userId)
    const newCategory: Category = {
      ...category,
      id: generateId(),
      userId,
    }
    data.categories.push(newCategory)
    userDataStorage.saveUserData(userId, data)
    return newCategory
  },

  updateCategory: (userId: string, categoryId: string, updates: Partial<Category>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.categories.findIndex((c) => c.id === categoryId && c.userId === userId)
    if (index !== -1) {
      data.categories[index] = { ...data.categories[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteCategory: (userId: string, categoryId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.categories = data.categories.filter((c) => !(c.id === categoryId && c.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  // ORÇAMENTOS
  getBudgets: (userId: string): Budget[] => {
    return userDataStorage.getUserData(userId).budgets
  },

  addBudget: (userId: string, budget: Omit<Budget, "id" | "createdAt">): Budget => {
    const data = userDataStorage.getUserData(userId)
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      userId,
      createdAt: new Date().toISOString(),
    }
    data.budgets.push(newBudget)
    userDataStorage.saveUserData(userId, data)
    return newBudget
  },

  updateBudget: (userId: string, budgetId: string, updates: Partial<Budget>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.budgets.findIndex((b) => b.id === budgetId && b.userId === userId)
    if (index !== -1) {
      data.budgets[index] = { ...data.budgets[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteBudget: (userId: string, budgetId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.budgets = data.budgets.filter((b) => !(b.id === budgetId && b.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  // TRANSAÇÕES
  getTransactions: (userId: string): Transaction[] => {
    return userDataStorage.getUserData(userId).transactions
  },

  addTransaction: (userId: string, transaction: Omit<Transaction, "id">): Transaction => {
    const data = userDataStorage.getUserData(userId)
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      userId,
    }
    data.transactions.unshift(newTransaction) // Adiciona no início
    userDataStorage.saveUserData(userId, data)
    return newTransaction
  },

  updateTransaction: (userId: string, transactionId: string, updates: Partial<Transaction>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.transactions.findIndex((t) => t.id === transactionId && t.userId === userId)
    if (index !== -1) {
      data.transactions[index] = { ...data.transactions[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteTransaction: (userId: string, transactionId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.transactions = data.transactions.filter((t) => !(t.id === transactionId && t.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  // CARTÕES
  getCards: (userId: string): Card[] => {
    return userDataStorage.getUserData(userId).cards
  },

  addCard: (userId: string, card: Omit<Card, "id">): Card => {
    const data = userDataStorage.getUserData(userId)
    const newCard: Card = {
      ...card,
      id: generateId(),
      userId,
    }
    data.cards.push(newCard)
    userDataStorage.saveUserData(userId, data)
    return newCard
  },

  updateCard: (userId: string, cardId: string, updates: Partial<Card>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.cards.findIndex((c) => c.id === cardId && c.userId === userId)
    if (index !== -1) {
      data.cards[index] = { ...data.cards[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteCard: (userId: string, cardId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.cards = data.cards.filter((c) => !(c.id === cardId && c.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  // CARTEIRAS
  getWallets: (userId: string): Wallet[] => {
    return userDataStorage.getUserData(userId).wallets
  },

  addWallet: (userId: string, wallet: Omit<Wallet, "id">): Wallet => {
    const data = userDataStorage.getUserData(userId)
    const newWallet: Wallet = {
      ...wallet,
      id: generateId(),
      userId,
    }
    data.wallets.push(newWallet)
    userDataStorage.saveUserData(userId, data)
    return newWallet
  },

  updateWallet: (userId: string, walletId: string, updates: Partial<Wallet>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.wallets.findIndex((w) => w.id === walletId && w.userId === userId)
    if (index !== -1) {
      data.wallets[index] = { ...data.wallets[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteWallet: (userId: string, walletId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.wallets = data.wallets.filter((w) => !(w.id === walletId && w.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  updateWallets: (userId: string, wallets: Wallet[]): void => {
    const data = userDataStorage.getUserData(userId)
    data.wallets = wallets.filter((w) => w.userId === userId)
    userDataStorage.saveUserData(userId, data)
  },

  updateCards: (userId: string, cards: Card[]): void => {
    const data = userDataStorage.getUserData(userId)
    data.cards = cards.filter((c) => c.userId === userId)
    userDataStorage.saveUserData(userId, data)
  },

  // OBJETIVOS (GOALS)
  getGoals: (userId: string): Goal[] => {
    return userDataStorage.getUserData(userId).goals
  },

  addGoal: (userId: string, goal: Omit<Goal, "id" | "createdAt">): Goal => {
    const data = userDataStorage.getUserData(userId)
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      userId,
      createdAt: new Date().toISOString(),
    }
    data.goals.push(newGoal)
    userDataStorage.saveUserData(userId, data)
    return newGoal
  },

  updateGoal: (userId: string, goalId: string, updates: Partial<Goal>): void => {
    const data = userDataStorage.getUserData(userId)
    const index = data.goals.findIndex((g) => g.id === goalId && g.userId === userId)
    if (index !== -1) {
      data.goals[index] = { ...data.goals[index], ...updates }
      userDataStorage.saveUserData(userId, data)
    }
  },

  deleteGoal: (userId: string, goalId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.goals = data.goals.filter((g) => !(g.id === goalId && g.userId === userId))
    userDataStorage.saveUserData(userId, data)
  },

  // COMPARTILHAMENTO
  getSharedWith: (userId: string): string[] => {
    return userDataStorage.getUserData(userId).sharedWith
  },

  getSharedFrom: (userId: string): string[] => {
    return userDataStorage.getUserData(userId).sharedFrom
  },

  addSharedWith: (userId: string, targetUserId: string): void => {
    const data = userDataStorage.getUserData(userId)
    if (!data.sharedWith.includes(targetUserId)) {
      data.sharedWith.push(targetUserId)
      userDataStorage.saveUserData(userId, data)
    }
  },

  removeSharedWith: (userId: string, targetUserId: string): void => {
    const data = userDataStorage.getUserData(userId)
    data.sharedWith = data.sharedWith.filter((id) => id !== targetUserId)
    userDataStorage.saveUserData(userId, data)
  },

  /**
   * Deleta TODOS os dados de um usuário (para conformidade com LGPD)
   */
  deleteAllUserData: (userId: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(getUserDataKey(userId))
  },

  /**
   * Limpa apenas dados financeiros, mantendo estrutura básica
   * Usado quando o usuário quer resetar seus dados mas manter a conta
   */
  clearAllData: (userId: string): void => {
    if (typeof window === "undefined") return

    const data = userDataStorage.getUserData(userId)

    // Limpar apenas dados financeiros
    data.transactions = []
    data.cards = []
    data.wallets = []
    data.goals = []
    data.budgets = []

    // Manter categorias padrão
    const categories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      userId,
    }))
    data.categories = categories

    userDataStorage.saveUserData(userId, data)
  },
}
