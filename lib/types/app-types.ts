export interface User {
    id: string
    name: string
    email: string
    avatar?: string
    color: string
    firstName?: string
    lastName?: string
    phone?: string
    cpf?: string
    birthDate?: string
    bio?: string
    plan?: "free" | "pro"
    whatsappEnabled?: boolean
    whatsappPhone?: string
    whatsappPersonalities?: string[]
    whatsappGender?: string
    whatsappOriginState?: string
    whatsappDefaultDebitAccount?: string
    whatsappDefaultCreditCard?: string
    whatsappCmdExpenses?: boolean
    whatsappCmdBalance?: boolean
    whatsappCmdTransactions?: boolean

    // Notification Settings
    notifyBillsDueDaily?: boolean
    notifyBillsAdvanceDays?: number
    notifyWeeklyReport?: boolean
    notifyMonthlyReport?: boolean
    notifyMonthlyReportDay?: string
    notifyCardLimit?: boolean
    notifyBudgetExceeded?: boolean
    notifyLargeTransaction?: boolean
}

export interface Budget {
    id: string
    categoryId: string
    limit: number
    period: "weekly" | "monthly" | "quarterly" | "yearly"
    alertThreshold: number
    userId: string
    createdAt: string
    categoryName?: string
    categoryColor?: string
    categoryIcon?: string
    history?: {
        month: string; // "YYYY-MM"
        limit: number;
    }[]
}

export interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: "income" | "expense"
    userId: string
}

export interface Card {
    id: string
    name: string
    lastDigits: string
    brand: string
    type: "debit" | "credit" | "both"
    balance: number
    limit: number
    used: number
    creditLimit?: number
    availableLimit?: number
    closingDay?: number
    dueDay?: number
    color: string
    dueDate: number // Legacy
    hasCredit: boolean
    hasDebit: boolean
    userId: string
}

export interface Wallet {
    id: string
    name: string
    balance: number
    icon: string
    color: string
    userId: string
}

export interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string
    category: string
    icon: string
    color: string
    imageUrl?: string
    userId: string
    createdAt: string
}

export interface Transaction {
    id: string
    description: string
    amount: number
    category: string
    type: "income" | "expense" | "transfer"
    date: string
    userId: string
    account: string
    status: "pending" | "completed"
    fromAccount?: string
    toAccount?: string
    notes?: string
    installments?: number
    cardFunction?: "debit" | "credit"
    invoiceId?: string
    isPaid?: boolean
    isRecurring?: boolean
    recurrenceId?: string
    installmentId?: string // Grouping ID for installments
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    installmentsTotal?: number // Total installments if applicable
    installmentNumber?: number // Current installment number
    attachment?: string // Base64 or URL
    userName?: string
    userAvatar?: string
    userColor?: string
}

export interface NotificationPreferences {
    billsDueDaily: boolean
    billsAdvanceNotice: number
    weeklyReport: boolean
    monthlyReport: boolean
    monthlyReportDay: string
    cardLimitAlert: boolean
    budgetExceededAlert: boolean
    largeTransactionAlert: boolean
}

export interface Notification {
    id: string
    title: string
    description: string
    type: "bill" | "budget" | "card" | "transaction" | "report"
    date: string
    read: boolean
    actionUrl?: string
}

export interface Workspace {
    id: string
    name: string
    ownerId: string
    mode: 'PERSONAL'
    createdAt: string
    updatedAt: string
}

export interface WorkspaceMember {
    id: string
    workspaceId: string
    userId: string
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
    status: 'ACTIVE'
    createdAt: string
    updatedAt: string
}

export interface WorkspacePermissions {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
}
