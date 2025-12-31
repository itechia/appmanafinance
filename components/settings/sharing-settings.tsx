"use client"

import { Card } from "@/components/ui/card"
import { Share2 } from "lucide-react"

export function SharingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Compartilhamento de Dados</h2>
        <p className="text-sm text-muted-foreground">Gerencie com quem você compartilha suas informações financeiras</p>
      </div>

      <Card className="p-8 md:p-12">
        <div className="text-center space-y-3">
          <Share2 className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
          <h3 className="font-semibold text-lg">Em Manutenção</h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            A funcionalidade de compartilhamento está sendo atualizada para a nova versão segura na nuvem.
            Em breve você poderá compartilhar seus dados com segurança.
          </p>
        </div>
      </Card>
    </div>
  )
}
