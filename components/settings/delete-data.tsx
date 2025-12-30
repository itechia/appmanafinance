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
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function DeleteData() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { clearAllData } = useUser()
  const { user } = useAuth()
  const router = useRouter()

  const handleDeleteData = async (e: React.MouseEvent) => {
    // Prevent dialog from closing immediately
    e.preventDefault()

    if (!password) {
      toast({
        title: "Senha necessária",
        description: "Por favor, digite sua senha para confirmar a exclusão.",
        variant: "destructive",
      })
      return
    }

    // In a real app, verify password against stored hash
    // For now, we'll just check if it's not empty
    if (password.length < 8) {
      toast({
        title: "Senha incorreta",
        description: "A senha digitada está incorreta.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      // Simulate API call/processing time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Clear all financial data (not personal info or subscription)
      // This will trigger a page reload/redirect to "/" in UserContext
      await clearAllData()

      toast({
        title: "Dados excluídos",
        description: "Todos os seus dados financeiros foram excluídos permanentemente.",
      })
    } catch (error) {
      console.error(error)
      setIsDeleting(false)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir os dados.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Excluir Dados</h2>
        <p className="text-muted-foreground">Remova permanentemente todos os seus dados financeiros</p>
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Zona de Perigo</CardTitle>
          </div>
          <CardDescription>Esta ação não pode ser desfeita. Proceda com cautela.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">O que será excluído:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Todas as transações</li>
              <li>Todos os cartões e carteiras</li>
              <li>Todos os objetivos financeiros</li>
              <li>Todos os orçamentos</li>
              <li>Histórico de movimentações</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">O que será mantido:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Informações pessoais (nome, email)</li>
              <li>Histórico de assinatura</li>
              <li>Configurações de conta</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir todos os dados financeiros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Confirmar exclusão de dados</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4">
              <div className="font-medium text-foreground">
                Esta ação é IRREVERSÍVEL e excluirá permanentemente todos os seus dados financeiros.
              </div>
              <div>
                Suas informações pessoais ({user?.email}) e histórico de assinatura serão mantidos, mas todos os dados
                financeiros serão perdidos para sempre.
              </div>
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteData}
              disabled={isDeleting || !password}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
