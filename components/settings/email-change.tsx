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
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export function EmailChange() {
  const { user: authUser } = useAuth()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")

    // Validation
    if (!newEmail || !confirmEmail) {
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

    setIsSubmitting(true)

    try {
      // Update email
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Verifique seu email!",
        description: "Enviamos links de confirmação para o email antigo e para o novo.",
      })

      setIsOpen(false)
      setNewEmail("")
      setConfirmEmail("")
    } catch (error: any) {
      console.error(error)
      setError(error.message || "Erro ao atualizar email. Tente novamente.")
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
            Digite seu novo email. Você receberá um link de confirmação em ambos os endereços.
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
