"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

// Define UserProfile based on our schema
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
      console.log("Auth: Initializing Supabase...")
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUserId(session.user.id)
          setIsAuthenticated(true)
          await fetchProfile(session.user.id)
        } else {
          console.log("Auth: No session found")
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setIsLoading(false)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id)
          setIsAuthenticated(true)
          if (!user) await fetchProfile(session.user.id)
        } else {
          setUserId(null)
          setUser(null)
          setIsAuthenticated(false)
        }
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
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

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setUser({
          ...data,
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          color: 'blue' // Default, maybe store in DB later
        })
      }
    } catch (err) {
      console.error("Failed to fetch profile", err)
    }
  }

  const refreshProfile = async () => {
    if (userId) await fetchProfile(userId)
  }

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
      await refreshProfile()
    } catch (e) {
      console.error("Update user failed", e)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/")
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      })
      if (error) throw error

      router.push("/")
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setUserId(null)
      setIsAuthenticated(false)
      router.push("/login")
    }
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
