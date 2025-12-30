"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ArrowUpDown, CreditCard, Target, BarChart3, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: ArrowUpDown },
  { name: "Cartões", href: "/cards", icon: CreditCard },
  { name: "Orçamentos", href: "/budgets", icon: Wallet },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Objetivos", href: "/goals", icon: Target },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === "/login") {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around px-2 py-3 max-w-screen-xl mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 sm:gap-1 rounded-lg transition-all",
                "px-1 sm:px-3 md:px-4 py-1.5 sm:py-2 min-w-[50px] sm:min-w-[70px] md:min-w-[80px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 sm:h-6 sm:w-6 md:h-6 md:w-6" />
              <span className="hidden sm:block text-[9px] md:text-[11px] font-medium truncate max-w-full leading-tight">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
