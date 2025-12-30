"use client"

import { useState } from "react"
import { User, Bell, MessageSquare, Users, Crown, CreditCard, Trash2, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { NotificationsSettings } from "@/components/settings/notifications-settings"
import { WhatsAppSettings } from "@/components/settings/whatsapp-settings"
import { ConnectionsSettings } from "@/components/settings/connections-settings"
import { SubscriptionManagement } from "@/components/settings/subscription-management"
import { DeleteData } from "@/components/settings/delete-data"
import { DeleteAccount } from "@/components/settings/delete-account"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

type SettingsSection = "profile" | "notifications" | "whatsapp" | "connections" | "subscription" | "delete" | "account"

const sections = [
  {
    id: "profile" as const,
    label: "Perfil",
    icon: User,
    description: "Informações pessoais",
    requiresPro: false,
  },
  {
    id: "subscription" as const,
    label: "Assinatura",
    icon: CreditCard,
    description: "Gerenciar plano",
    requiresPro: false,
  },
  {
    id: "connections" as const,
    label: "Conexões",
    icon: Users,
    description: "Sincronização via token",
    requiresPro: true,
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp",
    icon: MessageSquare,
    description: "Integração e assistente",
    requiresPro: true,
  },
  {
    id: "notifications" as const,
    label: "Notificações",
    icon: Bell,
    description: "Alertas e lembretes",
    requiresPro: false,
  },
  {
    id: "delete" as const,
    label: "Excluir Dados",
    icon: Trash2,
    description: "Remover dados",
    requiresPro: false,
  },
  {
    id: "account" as const,
    label: "Excluir Conta",
    icon: UserX,
    description: "Remover conta",
    requiresPro: false,
  },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")
  const { user } = useAuth()
  const router = useRouter()
  const isPro = user?.plan === "pro"

  const handleSectionClick = (sectionId: SettingsSection, requiresPro: boolean) => {
    if (requiresPro && !isPro) {
      router.push("/pricing")
      return
    }
    setActiveSection(sectionId)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm md:text-base text-muted-foreground">Gerencie suas preferências e informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6">
        {/* Side Navigation */}
        <nav className="space-y-1">
          <div className="flex lg:flex-col gap-1 lg:gap-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isLocked = section.requiresPro && !isPro
              return (
                <Button
                  key={section.id}
                  variant="ghost"
                  className={cn(
                    "justify-center lg:justify-start gap-0 lg:gap-3 h-auto py-3 px-2 lg:px-4 flex-1 lg:flex-initial lg:w-full relative",
                    activeSection === section.id && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                    isLocked && "opacity-60",
                    (section.id === "delete" || section.id === "account") &&
                      "text-destructive hover:text-destructive hover:bg-destructive/10",
                  )}
                  onClick={() => handleSectionClick(section.id, section.requiresPro)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="hidden lg:flex flex-col items-start text-left flex-1">
                    <span className="font-medium text-sm">{section.label}</span>
                    <span className="text-xs text-muted-foreground">{section.description}</span>
                  </div>
                  {isLocked && (
                    <Crown className="h-4 w-4 text-amber-500 absolute top-2 right-2 lg:relative lg:top-0 lg:right-0" />
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="bg-card rounded-lg border p-4 md:p-6 overflow-hidden">
          {activeSection === "profile" && <ProfileSettings />}
          {activeSection === "subscription" && <SubscriptionManagement />}
          {activeSection === "connections" && <ConnectionsSettings />}
          {activeSection === "whatsapp" && <WhatsAppSettings />}
          {activeSection === "notifications" && <NotificationsSettings />}
          {activeSection === "delete" && <DeleteData />}
          {activeSection === "account" && <DeleteAccount />}
        </div>
      </div>
    </div>
  )
}
