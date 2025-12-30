"use client"

import { useState } from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { userStorage } from "@/lib/user-storage"
import { userDataStorage } from "@/lib/user-data-storage"
import { subscriptionStorage } from "@/lib/subscription-storage"
import { useRouter } from "next/navigation"

export function DeleteAccount() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Senha necessária",
        description: "Por favor, digite sua senha para confirmar a exclusão.",
        variant: "destructive",
      })
      return
    }

    if (confirmText !== "EXCLUIR CONTA") {
      toast({
        title: "Confirmação necessária",
        description: 'Digite "EXCLUIR CONTA" para confirmar.',
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Senha incorreta",
        description: "A senha digitada está incorreta.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (user?.id) {
      await userDataStorage.clearAllData(user.id)
      subscriptionStorage.deleteUserSubscription(user.id)
      userStorage.deleteUser(user.id)
    }

    setIsDeleting(false)
    setShowDeleteDialog(false)

    toast({
      title: "Conta excluída",
      description: "Sua conta foi excluída permanentemente. Até logo!",
    })

    setTimeout(() => {
      logout()
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Excluir Conta</h2>
        <p className="text-muted-foreground">Remova permanentemente sua conta e todos os dados associados</p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Zona de Perigo Máxima</CardTitle>
          </div>
          <CardDescription>
            Esta ação é PERMANENTE e IRREVERSÍVEL. Sua conta será completamente removida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">O que será excluído PERMANENTEMENTE:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Sua conta e informações pessoais</li>
              <li>Todas as transações e histórico financeiro</li>
              <li>Todos os cartões, carteiras e contas</li>
              <li>Todos os objetivos e orçamentos</li>
              <li>Histórico de assinatura e pagamentos</li>
              <li>Todas as configurações e preferências</li>
            </ul>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-destructive">⚠️ ATENÇÃO</p>
            <p className="text-xs text-muted-foreground">
              Após a exclusão, não será possível recuperar nenhum dado. Esta ação não pode ser desfeita. Se você apenas
              deseja limpar seus dados financeiros mantendo sua conta, use a opção "Excluir Dados" ao invés desta.
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir minha conta permanentemente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-6 w-6" />
              <AlertDialogTitle>Confirmar exclusão da conta</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="font-medium text-foreground">
                  Esta é sua última chance. Esta ação é IRREVERSÍVEL e excluirá PERMANENTEMENTE:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Sua conta ({user?.email})</li>
                  <li>Todos os seus dados financeiros</li>
                  <li>Todas as suas informações pessoais</li>
                  <li>Histórico de assinatura e pagamentos</li>
                </ul>
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Digite sua senha para confirmar</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-text">Digite "EXCLUIR CONTA" para confirmar</Label>
                    <Input
                      id="confirm-text"
                      type="text"
                      placeholder="EXCLUIR CONTA"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPassword("")
                setConfirmText("")
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || !password || confirmText !== "EXCLUIR CONTA"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
