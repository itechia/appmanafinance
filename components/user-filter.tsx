"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-context"
import { Users, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserFilterProps {
  selectedUserIds: string[]
  onUserToggle: (userId: string) => void
}

export function UserFilter({ selectedUserIds, onUserToggle }: UserFilterProps) {
  const { currentUser, activeUsers, isMultiUserMode } = useUser()

  if (!isMultiUserMode) return null

  const allUsers = activeUsers // activeUsers likely includes currentUser based on context logic, or verify
  const allSelected = selectedUserIds.length === allUsers.length

  const selectedUsers = allUsers.filter((u) => selectedUserIds.includes(u.id))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent h-9 px-2 md:px-3">
          <Users className="h-4 w-4 flex-shrink-0" />
          <div className="flex -space-x-1.5 flex-shrink-0">
            {allSelected
              ? allUsers.slice(0, 2).map((user) => (
                <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: user.color, fontSize: "0.5rem" }}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))
              : selectedUsers.slice(0, 2).map((user) => (
                <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: user.color, fontSize: "0.5rem" }}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
          </div>
          <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-none">
            {allSelected ? "Todos" : selectedUserIds.length === 1 ? selectedUsers[0].name : `${selectedUserIds.length}`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filtrar por usuário</span>
          <Badge variant="secondary" className="text-xs">
            {selectedUserIds.length}/{allUsers.length}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allUsers.map((user) => {
          const isSelected = selectedUserIds.includes(user.id)
          return (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={isSelected}
              onCheckedChange={() => onUserToggle(user.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: user.color, fontSize: "0.65rem" }}>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
              </div>
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
