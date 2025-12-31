"use client"

import { Card } from "@/components/ui/card"
import { Key } from "lucide-react"

export function ConnectionsSettings() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Sincronização de Contas</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Conecte-se com outros usuários para compartilhar workspaces e dados financeiros
        </p>
      </div>

      <Card className="p-8 md:p-12">
        <div className="text-center space-y-3">
          <Key className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">Em Manutenção</h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            A funcionalidade de sincronização está sendo atualizada para suportar a nova nuvem segura.
            Em breve você poderá convidar usuários diretamente por email.
          </p>
        </div>
      </Card>
    </div>
  )
}
