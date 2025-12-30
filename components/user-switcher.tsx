"use client"

import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

export function UserSwitcher() {
  const { currentUser } = useUser()
  const isMobile = useIsMobile()
  const { logout } = useAuth()

  if (!currentUser) return null

  const handleLogout = () => {
    logout()
  }

  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <Avatar className="h-10 w-10 shrink-0 border border-border">
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} className="object-cover" />
            <AvatarFallback className="bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive bg-transparent"
        >
          <LogOut className="h-4 w-4" />
          <span>Encerrar sessão</span>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-auto py-2 px-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} className="object-cover" />
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Perfil</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={currentUser.avatar || "/placeholder.svg"} className="object-cover" />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>Encerrar sessão</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
