"use client"

import { useState } from "react"
import { Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { useUser } from "@/lib/user-context"
import { userStorage } from "@/lib/user-storage"
import { verifyPassword } from "@/lib/crypto-utils"
import { useToast } from "@/hooks/use-toast"

export function EmailChange() {
  const { user: authUser } = useAuth()
  const { updateUserProfile } = useUser()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")

    // Validation
    if (!newEmail || !confirmEmail || !password) {
      setError("Todos os campos são obrigatórios")
      return
    }

    if (newEmail !== confirmEmail) {
      setError("Os emails não coincidem")
      return
    }

    if (newEmail === authUser?.email) {
      setError("O novo email não pode ser igual ao atual")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setError("Email inválido")
      return
    }

    // Check if email is already in use
    const existingUser = userStorage.findUserByEmail(newEmail)
    if (existingUser) {
      setError("Este email já está em uso")
      return
    }

    setIsSubmitting(true)

    try {
      // Verify password
      if (!authUser) {
        setError("Usuário não encontrado")
        return
      }

      const storedUser = userStorage.findUserByEmail(authUser.email)
      if (!storedUser) {
        setError("Usuário não encontrado")
        return
      }

      const isPasswordValid = await verifyPassword(password, storedUser.passwordHash)
      if (!isPasswordValid) {
        setError("Senha incorreta")
        return
      }

      // Update email
      updateUserProfile({ email: newEmail.toLowerCase().trim() })

      toast({
        title: "Email atualizado!",
        description: "Seu email foi alterado com sucesso",
      })

      setIsOpen(false)
      setNewEmail("")
      setConfirmEmail("")
      setPassword("")
    } catch (error) {
      setError("Erro ao atualizar email. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Mail className="h-4 w-4" />
          Alterar Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Email</DialogTitle>
          <DialogDescription>
            Digite seu novo email e confirme com sua senha atual. Você precisará fazer login novamente após a alteração.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-email">Email Atual</Label>
            <Input id="current-email" type="email" value={authUser?.email || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">Novo Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">Confirmar Novo Email</Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder="novo@email.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Atual</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Alterando..." : "Alterar Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
