"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mana_sidebar_collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("mana_sidebar_collapsed", isCollapsed.toString())
  }, [isCollapsed])

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
