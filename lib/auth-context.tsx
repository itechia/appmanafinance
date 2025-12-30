"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

// Define UserProfile based on our schema (simplified for local)
export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  color: string
  firstName?: string
  lastName?: string
  plan: "free" | "pro"
  phone?: string
  cpf?: string
  birthDate?: string
  bio?: string
  planExpiresAt?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  user: UserProfile | null
  userId: string | null
  refreshProfile: () => Promise<void>
  updateUser: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "mana_auth_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Auth: Initializing Local Mode...")
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY)
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser)
            setUserId(parsedUser.id)
            setIsAuthenticated(true)
            console.log("Auth: Local session retrieved", parsedUser.id)
          }
        }
      } catch (error) {
        console.error("Error reading from local storage:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Redirect logic
  useEffect(() => {
    const publicRoutes = ["/login", "/register", "/auth/callback"]
    if (!isLoading && !isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const refreshProfile = async () => {
    // In local mode, we just re-read from storage if needed, 
    // but state is usually authoritative.
    const storedUser = localStorage.getItem(STORAGE_KEY)
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // SIMULATED LOGIN
    // In a real local-first app we might want to verify credentials against a stored list.
    // For this transition, we will accept ANY login if it matches the stored user, OR
    // just allow login as a new session if none exists.
    // To be simplified: We will just Create/Update the user session on login for now, 
    // effectively "logging in" as whoever.

    await new Promise(resolve => setTimeout(resolve, 800)) // Fake network delay

    // If we want to simulate persistent accounts, we'd need to store an array of users.
    // For simplicity, let's just assume single user mode or overwrite.

    const mockUser: UserProfile = {
      id: "local-user-id-1",
      email: email,
      name: email.split('@')[0],
      color: "blue",
      plan: "pro", // Default to PRO in local mode for full features!
      firstName: email.split('@')[0],
    }

    // Check if we have a stored user to preserve name/avatar
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const existing = JSON.parse(stored)
      if (existing.email === email) {
        // Restore existing profile
        mockUser.id = existing.id
        mockUser.name = existing.name
        mockUser.avatar = existing.avatar
        mockUser.color = existing.color
        mockUser.firstName = existing.firstName
        mockUser.lastName = existing.lastName
        mockUser.plan = existing.plan // Preserve plan
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
    setUserId(mockUser.id)
    setIsAuthenticated(true)

    router.push("/")
    return { success: true }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {

    await new Promise(resolve => setTimeout(resolve, 1000)) // Fake delay

    const newUser: UserProfile = {
      id: `local-user-${Date.now()}`,
      email: email,
      name: name,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      color: "blue",
      plan: "pro", // Everyone is PRO locally
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    setUser(newUser)
    setUserId(newUser.id)
    setIsAuthenticated(true)

    router.push("/")
    return { success: true }
  }

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setUserId(null)
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        user,
        userId,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
