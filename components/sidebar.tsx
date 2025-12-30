"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowUpDown,
  CreditCard,
  Target,
  BarChart3,
  Settings,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/lib/sidebar-context"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: ArrowUpDown },
  { name: "Cartões", href: "/cards", icon: CreditCard },
  { name: "Orçamentos", href: "/budgets", icon: Wallet },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Objetivos", href: "/goals", icon: Target },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isCollapsed, toggleCollapsed } = useSidebar()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-20" : "w-64",
        )}
      >
        <div className={cn("flex items-center border-b px-4 h-16 gap-2", isCollapsed && "justify-center")}>
          {mounted && !isCollapsed && (
            <Image
              src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
              alt="Maná Finance"
              width={180}
              height={48}
              className="flex-shrink-0"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={cn("hidden lg:flex h-8 w-8 flex-shrink-0", !isCollapsed && "ml-auto")}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {!isCollapsed && (
          <div className="border-t p-4">
            <div className="flex items-center justify-center gap-3">
              <Image src="/mascote.svg" alt="Mascote Maná Finance" width={40} height={40} className="flex-shrink-0" />
              <div className="text-left flex-1">
                {mounted && (
                  <Image
                    src={resolvedTheme === "dark" ? "/mana-logo-dark.svg" : "/mana-logo-light.svg"}
                    alt="Maná Finance"
                    width={120}
                    height={24}
                    className="mb-1"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">Sua prosperidade financeira começa aqui</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
