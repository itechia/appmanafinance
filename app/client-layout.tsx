"use client"

import React from "react"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour"
// import { userStorage } from "@/lib/user-storage"
import { SidebarProvider } from "@/lib/sidebar-context"

interface ClientLayoutProps {
  children: React.ReactNode
  currentDate?: Date
  onDateChange?: (date: Date) => void
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user, userId } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (isAuthenticated && userId && user) {
      // Check onboarding status
      /*
      const storedUser = userStorage.findUserById(userId)
      if (storedUser && !storedUser.onboardingComplete) {
        setShowOnboarding(true)
      }
      */
    }
  }, [isAuthenticated, userId, user, pathname])

  const handleOnboardingComplete = () => {
    if (userId) {
      // userStorage.updateUser(userId, { onboardingComplete: true })
      setShowOnboarding(false)
    }
  }

  const isLoginPage = pathname === "/login"
  const isPricingPage = pathname === "/pricing"

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return child
    }
    return child
  })

  if (isLoginPage) {
    return <>{childrenWithProps}</>
  }

  if (isPricingPage) {
    return <>{childrenWithProps}</>
  }

  if (isLoading) {
    console.log("ClientLayout: Still loading... AuthState:", { isAuthenticated, isLoading, userId })
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-background p-2 md:p-4 lg:p-6 pb-20 lg:pb-6">
            {childrenWithProps}
          </main>
          <BottomNav />
        </div>

        {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />}
      </div>
    </SidebarProvider>
  )
}
