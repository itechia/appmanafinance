export interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  category: string
  account: string
  status: "completed" | "pending"
  userId: string
  userName: string
  userAvatar: string
  userColor: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  icon: string
  color: string
}

export interface Card {
  id: string
  name: string
  lastDigits: string
  limit?: number
  used?: number
  balance?: number
  hasCredit: boolean
  color: string
  dueDate?: number
}

export interface Wallet {
  id: string
  name: string
  balance: number
  icon: string
  color: string
}

const STORAGE_KEYS = {
  TRANSACTIONS: "mana_transactions",
  GOALS: "mana_goals",
  CARDS: "mana_cards",
  WALLETS: "mana_wallets",
}

// Default mock data
const defaultTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salário",
    amount: 5000,
    type: "income",
    date: "2025-01-15",
    category: "Receita",
    account: "Conta Corrente",
    status: "completed",
    userId: "1",
    userName: "Usuário Principal",
    userAvatar: "/placeholder-user.jpg",
    userColor: "#28a745",
  },
  {
    id: "2",
    description: "Supermercado",
    amount: -350,
    type: "expense",
    date: "2025-01-14",
    category: "Alimentação",
    account: "Cartão Crédito",
    status: "completed",
    userId: "2",
    userName: "Maria Silva",
    userAvatar: "/placeholder-user.jpg",
    userColor: "#667eea",
  },
]

const defaultGoals: Goal[] = [
  {
    id: "1",
    name: "Viagem Europa",
    targetAmount: 15000,
    currentAmount: 4500,
    deadline: "2025-12-31",
    icon: "✈️",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "2",
    name: "Fundo Emergência",
    targetAmount: 20000,
    currentAmount: 12000,
    deadline: "2025-06-30",
    icon: "🛡️",
    color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
]

const defaultCards: Card[] = [
  {
    id: "nubank",
    name: "Nubank",
    lastDigits: "4532",
    limit: 5000,
    used: 2340,
    hasCredit: true,
    color: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    dueDate: 10,
  },
  {
    id: "debit-nubank",
    name: "Nubank Débito",
    lastDigits: "1234",
    balance: 2500.0,
    hasCredit: false,
    color: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  },
]

const defaultWallets: Wallet[] = [
  {
    id: "wallet-cash",
    name: "Dinheiro",
    balance: 450.0,
    icon: "💵",
    color: "linear-gradient(135deg, #195C3E 0%, #0f3a27 100%)",
  },
  {
    id: "wallet-picpay",
    name: "PicPay",
    balance: 1234.56,
    icon: "💳",
    color: "linear-gradient(135deg, #28A745 0%, #1e7e34 100%)",
  },
]

// Storage utilities
export const storage = {
  getTransactions: (): Transaction[] => {
    if (typeof window === "undefined") return defaultTransactions
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    return stored ? JSON.parse(stored) : defaultTransactions
  },

  setTransactions: (transactions: Transaction[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
  },

  addTransaction: (transaction: Omit<Transaction, "id">) => {
    const transactions = storage.getTransactions()
    const newTransaction = { ...transaction, id: Date.now().toString() }
    storage.setTransactions([newTransaction, ...transactions])
    return newTransaction
  },

  getGoals: (): Goal[] => {
    if (typeof window === "undefined") return defaultGoals
    const stored = localStorage.getItem(STORAGE_KEYS.GOALS)
    return stored ? JSON.parse(stored) : defaultGoals
  },

  setGoals: (goals: Goal[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals))
  },

  getCards: (): Card[] => {
    if (typeof window === "undefined") return defaultCards
    const stored = localStorage.getItem(STORAGE_KEYS.CARDS)
    return stored ? JSON.parse(stored) : defaultCards
  },

  setCards: (cards: Card[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards))
  },

  getWallets: (): Wallet[] => {
    if (typeof window === "undefined") return defaultWallets
    const stored = localStorage.getItem(STORAGE_KEYS.WALLETS)
    return stored ? JSON.parse(stored) : defaultWallets
  },

  setWallets: (wallets: Wallet[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets))
  },

  clearAll: () => {
    if (typeof window === "undefined") return
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  },

  resetToDefaults: () => {
    storage.setTransactions(defaultTransactions)
    storage.setGoals(defaultGoals)
    storage.setCards(defaultCards)
    storage.setWallets(defaultWallets)
  },
}
