/**
 * Sistema de armazenamento de usuários
 * Gerencia usuários registrados de forma segura e isolada
 * Compatível com LGPD - dados armazenados localmente
 */

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
  avatar?: string
  color: string
  firstName?: string
  lastName?: string
  phone?: string
  cpf?: string
  birthDate?: string
  bio?: string
  onboardingComplete?: boolean
  plan?: "free" | "pro"
  planExpiresAt?: string
}

export interface UserProfile {
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
  planExpiresAt?: string
}

const STORAGE_KEY = "mana_users"

const USER_COLORS = ["#28a745", "#667eea", "#f093fb", "#17a2b8", "#fd7e14", "#6610f2", "#20c997", "#e83e8c"]

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

export const userStorage = {
  getAllUsers: (): StoredUser[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  },

  saveUser: (user: StoredUser): void => {
    if (typeof window === "undefined") return
    const users = userStorage.getAllUsers()
    users.push(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  },

  findUserByEmail: (email: string): StoredUser | null => {
    const users = userStorage.getAllUsers()
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  },

  findUserById: (id: string): StoredUser | null => {
    const users = userStorage.getAllUsers()
    return users.find((u) => u.id === id) || null
  },

  updateUser: (id: string, updates: Partial<StoredUser>): void => {
    if (typeof window === "undefined") return
    const users = userStorage.getAllUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    }
  },

  deleteUser: (id: string): void => {
    if (typeof window === "undefined") return
    const users = userStorage.getAllUsers()
    const filtered = users.filter((u) => u.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },

  getUserProfile: (id: string): UserProfile | null => {
    const user = userStorage.findUserById(id)
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      cpf: user.cpf,
      birthDate: user.birthDate,
      bio: user.bio,
      plan: user.plan || "free",
      planExpiresAt: user.planExpiresAt,
    }
  },

  updateUserProfile: (id: string, profile: Partial<Omit<UserProfile, "id" | "color">>): void => {
    if (typeof window === "undefined") return
    const users = userStorage.getAllUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...profile }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    }
  },

  getRandomColor,
}
