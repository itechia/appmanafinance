import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/utils"

interface WalletCardProps {
  name: string
  balance: number
  icon: string
  color: string
  userName?: string
  userAvatar?: string
}

export function WalletCard({ name, balance, icon, color, userName, userAvatar }: WalletCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-all duration-300 overflow-hidden border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold truncate" style={{ color: color }}>{name}</h3>
              <p className="text-xs text-muted-foreground opacity-90">Carteira</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Adicionar saldo</DropdownMenuItem>
              <DropdownMenuItem>Retirar saldo</DropdownMenuItem>
              <DropdownMenuItem>Editar carteira</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Saldo disponível</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(balance)}
            </p>
          </div>

          {userName && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Avatar className="h-6 w-6 border">
                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                <AvatarFallback className="text-xs">{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
