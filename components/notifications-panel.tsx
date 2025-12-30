"use client"

import { Bell, Calendar, TrendingUp, CreditCard, AlertCircle, FileText, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect, useRef } from "react"

interface NotificationsPanelProps {
  onClose: () => void
  open: boolean
}

const notificationIcons = {
  bill: Calendar,
  budget: TrendingUp,
  card: CreditCard,
  transaction: AlertCircle,
  report: FileText,
}

const notificationColors = {
  bill: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  budget: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  card: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  transaction: "text-red-600 bg-red-50 dark:bg-red-950/30",
  report: "text-green-600 bg-green-50 dark:bg-green-950/30",
}

export function NotificationsPanel({ onClose, open }: NotificationsPanelProps) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, unreadCount } =
    useUser()
  const isMobile = useIsMobile()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMobile && open) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        const isNotificationButton = target.closest("[data-notification-button]")

        if (panelRef.current && !panelRef.current.contains(target) && !isNotificationButton) {
          onClose()
        }
      }

      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isMobile, open, onClose])

  const handleNotificationClick = (id: string) => {
    markNotificationAsRead(id)
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Notificações</SheetTitle>
                {unreadCount > 0 && <p className="text-xs text-muted-foreground mt-1">{unreadCount} não lidas</p>}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="text-xs h-8">
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                <p className="text-xs text-muted-foreground mt-1">Configure suas preferências em Configurações</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type]
                  const colorClass = notificationColors[notification.type]

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors relative group",
                        !notification.read && "bg-primary/5",
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(notification.date, { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                            {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {notification.actionUrl && (
                              <Link
                                href={notification.actionUrl}
                                onClick={() => {
                                  handleNotificationClick(notification.id)
                                  onClose()
                                }}
                              >
                                <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                                  Ver detalhes
                                </Button>
                              </Link>
                            )}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="h-7 text-xs"
                              >
                                Marcar como lida
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t bg-muted/30">
            <Link href="/settings" onClick={onClose}>
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Configurar notificações
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-full sm:w-[380px] max-w-[calc(100vw-2rem)] bg-card border rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} não lidas</p>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="text-xs h-8">
              <Check className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground mt-1">Configure suas preferências em Configurações</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type]
              const colorClass = notificationColors[notification.type]

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors relative group",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(notification.date, { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {notification.actionUrl && (
                          <Link href={notification.actionUrl} onClick={() => handleNotificationClick(notification.id)}>
                            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                              Ver detalhes
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="h-7 text-xs"
                          >
                            Marcar como lida
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30">
        <Link href="/settings" onClick={onClose}>
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Configurar notificações
          </Button>
        </Link>
      </div>
    </div>
  )
}
