import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface TransactionFiltersProps {
  filters: {
    type: string
    category: string
    account: string
    period: string
    dateRange: DateRange | undefined
    setType: (value: string) => void
    setCategory: (value: string) => void
    setAccount: (value: string) => void
    setPeriod: (value: string) => void
    setDateRange: (range: DateRange | undefined) => void
    clearFilters: () => void
  }
}

export function TransactionFilters({ filters }: TransactionFiltersProps) {
  const { isMultiUserMode, activeUsers, toggleUserActive, categories, wallets, cards } = useUser()

  // Restore local state for user selection to handle UI state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(activeUsers.map(u => u.id))

  const handleToggleUser = (userId: string) => {
    // Determine if we are adding or removing
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds((prev: string[]) => prev.filter((id: string) => id !== userId))
    } else {
      setSelectedUserIds((prev: string[]) => [...prev, userId])
    }
    toggleUserActive(userId)
  }

  // Sync local state with activeUsers if context changes (e.g. initial load)
  // useEffect(() => {
  //   setSelectedUserIds(activeUsers.map(u => u.id))
  // }, [activeUsers]) 
  // loops? Better to just init.

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" className="gap-2" onClick={filters.clearFilters}>
          <X className="h-4 w-4" />
          Limpar
        </Button>
      </div>
      <div className={`grid gap-4 ${isMultiUserMode ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
        {isMultiUserMode && (
          <div className="space-y-2">
            <Label>Usuários</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span>
                    {selectedUserIds.length} selecionado{selectedUserIds.length > 1 ? "s" : ""}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {selectedUserIds.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-medium">Filtrar por usuário</span>
                  </div>
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1 font-normal"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback style={{ backgroundColor: user.color, fontSize: "0.625rem" }}>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={filters.type} onValueChange={filters.setType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={filters.category} onValueChange={filters.setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Conta</Label>
          <Select value={filters.account} onValueChange={filters.setAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {wallets.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Carteiras</div>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </>
              )}
              {cards.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2">
                    Cartões
                  </div>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={filters.period} onValueChange={filters.setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="last-month">Mês passado</SelectItem>
              <SelectItem value="next-3-months">Próximos 3 meses</SelectItem>
              <SelectItem value="quarter">Últimos 3 meses</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filters.period === "custom" && (
          <div className="space-y-2 col-span-full md:col-span-1">
            <Label>Data Personalizada</Label>
            <DatePickerWithRange
              date={filters.dateRange}
              setDate={filters.setDateRange}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
