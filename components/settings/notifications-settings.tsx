"use client"

import { Bell, Calendar, TrendingUp, CreditCard, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"

export function NotificationsSettings() {
  const { notificationPreferences, updateNotificationPreferences } = useUser()
  const { toast } = useToast()
  const [localPreferences, setLocalPreferences] = useState(notificationPreferences)

  useEffect(() => {
    setLocalPreferences(notificationPreferences)
  }, [notificationPreferences])

  const handleSave = () => {
    updateNotificationPreferences(localPreferences)
    toast({
      title: "Preferências salvas",
      description: "Suas configurações de notificação foram atualizadas",
    })
  }

  const handleCancel = () => {
    setLocalPreferences(notificationPreferences)
    toast({
      title: "Alterações descartadas",
      description: "As configurações foram revertidas",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Notificações</h2>
        <p className="text-sm text-muted-foreground">Gerencie como e quando você recebe alertas</p>
      </div>

      {/* Bills Due Alerts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Contas a Vencer</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1">
              <p className="font-medium text-sm">Alertas diários  </p>
              <p className="text-xs text-muted-foreground">Receba lembretes das contas que vencem hoje</p>
            </div>
            <Switch
              checked={localPreferences.billsDueDaily}
              onCheckedChange={(checked) => setLocalPreferences({ ...localPreferences, billsDueDaily: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1">
              <p className="font-medium text-sm">Alertas antecipados</p>
              <p className="text-xs text-muted-foreground">Seja notificado antes do vencimento</p>
            </div>
            <Select
              value={localPreferences.billsAdvanceNotice.toString()}
              onValueChange={(value) =>
                setLocalPreferences({ ...localPreferences, billsAdvanceNotice: Number.parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dia antes</SelectItem>
                <SelectItem value="3">3 dias antes</SelectItem>
                <SelectItem value="7">7 dias antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Relatórios Automáticos</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1">
              <p className="font-medium text-sm">Relatório semanal</p>
              <p className="text-xs text-muted-foreground">Resumo das suas finanças toda semana</p>
            </div>
            <Switch
              checked={localPreferences.weeklyReport}
              onCheckedChange={(checked) => setLocalPreferences({ ...localPreferences, weeklyReport: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1">
              <p className="font-medium text-sm">Relatório mensal</p>
              <p className="text-xs text-muted-foreground">Análise completa no fim do mês</p>
            </div>
            <Switch
              checked={localPreferences.monthlyReport}
              onCheckedChange={(checked) => setLocalPreferences({ ...localPreferences, monthlyReport: checked })}
            />
          </div>

          <div className="p-4 rounded-lg border bg-muted/30">
            <Label htmlFor="report-day" className="text-sm font-medium mb-2 block">
              Dia de envio do relatório mensal
            </Label>
            <Select
              value={localPreferences.monthlyReportDay}
              onValueChange={(value) => setLocalPreferences({ ...localPreferences, monthlyReportDay: value })}
            >
              <SelectTrigger id="report-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dia 1</SelectItem>
                <SelectItem value="5">Dia 5</SelectItem>
                <SelectItem value="10">Dia 10</SelectItem>
                <SelectItem value="15">Dia 15</SelectItem>
                <SelectItem value="last">Último dia do mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Other Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Outras Notificações</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Limite de cartão atingido</p>
                <p className="text-xs text-muted-foreground">Alerta quando usar 80% do limite</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.cardLimitAlert}
              onCheckedChange={(checked) => setLocalPreferences({ ...localPreferences, cardLimitAlert: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Orçamento excedido</p>
                <p className="text-xs text-muted-foreground">Notificação ao ultrapassar orçamento</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.budgetExceededAlert}
              onCheckedChange={(checked) => setLocalPreferences({ ...localPreferences, budgetExceededAlert: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex-1 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Transações grandes</p>
                <p className="text-xs text-muted-foreground">Alerta para valores acima de {formatCurrency(500)}</p>
              </div>
            </div>
            <Switch
              checked={localPreferences.largeTransactionAlert}
              onCheckedChange={(checked) =>
                setLocalPreferences({ ...localPreferences, largeTransactionAlert: checked })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Salvar preferências</Button>
      </div>
    </div>
  )
}
