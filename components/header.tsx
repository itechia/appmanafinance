"use client"

import { Bell, Menu, Sun, Moon, ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { UserSwitcher } from "@/components/user-switcher"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isDashboard = pathname === "/"
  const isBudgets = pathname === "/budgets"

  const [showNotifications, setShowNotifications] = useState(false)
  const { unreadCount, selectedDate, setSelectedDate, headerDateVisible } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  const currentDate = selectedDate || new Date()

  const previousMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    setSelectedDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    setSelectedDate(new Date(year, month + 1, 1))
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center justify-between border-b bg-card px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 md:h-10 md:w-10 hidden"
          onClick={(e) => {
            e.preventDefault()
            console.log("[v0] Menu button clicked")
            if (onMenuClick) {
              onMenuClick()
            }
          }}
        >
          <Menu className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        {(isDashboard || isBudgets) && headerDateVisible ? (
          <div className="flex items-center gap-1 md:gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-9 md:w-9 bg-transparent"
                onClick={previousMonth}
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <span className="text-xs md:text-sm font-medium min-w-[70px] md:min-w-[100px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 md:h-9 md:w-9 bg-transparent"
                onClick={nextMonth}
              >
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Moon className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
            onClick={() => setShowNotifications(!showNotifications)}
            data-notification-button
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 md:right-2 md:top-2 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </Button>
          <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>

        {/* Desktop view */}
        <div className="hidden md:block">
          <UserSwitcher />
        </div>

        {/* Mobile/Tablet view */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] max-w-[340px] p-4">
              <SheetHeader className="mb-4">
                <SheetTitle>Perfil</SheetTitle>
              </SheetHeader>
              <div className="mt-2">
                <UserSwitcher />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
