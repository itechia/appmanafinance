import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div
        className="relative p-6 text-white flex flex-col"
        style={{
          background: color,
          minHeight: userName ? "200px" : "160px",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl flex-shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm opacity-90">Carteira</p>
              <h3 className="text-lg font-bold mt-0.5 truncate">{name}</h3>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
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

        <div className="mt-auto">
          <p className="text-xs opacity-75 mb-1">Saldo disponível</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          {userName && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/20">
              <Avatar className="h-6 w-6 border-2 border-white/30">
                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                <AvatarFallback className="text-xs bg-white/20">{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs opacity-90 truncate">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
