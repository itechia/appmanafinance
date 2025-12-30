"use client"

import { useState, useEffect } from "react"
import { Share2, UserPlus, Trash2, Check, X, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { sharingSystem, type SharingInvite, type SharingPermission } from "@/lib/sharing-system"
import { userStorage } from "@/lib/user-storage"

export function SharingSettings() {
  const { user, userId } = useAuth()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [sentInvites, setSentInvites] = useState<SharingInvite[]>([])
  const [receivedInvites, setReceivedInvites] = useState<SharingInvite[]>([])
  const [sharedByMe, setSharedByMe] = useState<SharingPermission[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharingPermission[]>([])

  useEffect(() => {
    loadData()
  }, [userId, user])

  const loadData = () => {
    if (!userId || !user) return

    setSentInvites(sharingSystem.getSentInvites(userId))
    setReceivedInvites(sharingSystem.getReceivedInvites(user.email))
    setSharedByMe(sharingSystem.getSharedByMe(userId))
    setSharedWithMe(sharingSystem.getSharedWithMe(userId))
  }

  const handleSendInvite = async () => {
    if (!userId || !email.trim()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      sharingSystem.createInvite(userId, email.trim())
      setSuccess("Convite enviado com sucesso!")
      setEmail("")
      loadData()
    } catch (err: any) {
      setError(err.message || "Erro ao enviar convite")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async (inviteId: string) => {
    if (!userId) return

    try {
      sharingSystem.acceptInvite(inviteId, userId)
      setSuccess("Convite aceito! Agora você pode visualizar os dados compartilhados.")
      loadData()
    } catch (err: any) {
      setError(err.message || "Erro ao aceitar convite")
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    if (!userId) return

    try {
      sharingSystem.rejectInvite(inviteId, userId)
      loadData()
    } catch (err: any) {
      setError(err.message || "Erro ao rejeitar convite")
    }
  }

  const handleRevokePermission = async (permissionId: string) => {
    if (!userId) return

    try {
      sharingSystem.revokePermission(permissionId, userId)
      setSuccess("Compartilhamento revogado com sucesso")
      loadData()
    } catch (err: any) {
      setError(err.message || "Erro ao revogar compartilhamento")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Compartilhamento de Dados</h2>
        <p className="text-sm text-muted-foreground">Gerencie com quem você compartilha suas informações financeiras</p>
      </div>

      {/* LGPD Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Seus dados são privados por padrão. Apenas usuários que você autorizar explicitamente poderão visualizar suas
          informações. Você pode revogar o acesso a qualquer momento.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Send Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Compartilhar Meus Dados
          </CardTitle>
          <CardDescription className="text-xs">
            Convide outro usuário para visualizar suas transações, orçamentos e categorias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email do usuário
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleSendInvite} disabled={isLoading || !email.trim()}>
                {isLoading ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Received Invites */}
      {receivedInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Convites Recebidos</CardTitle>
            <CardDescription className="text-xs">Usuários que querem compartilhar dados com você</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivedInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{invite.fromUserName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{invite.fromUserName}</p>
                    <p className="text-xs text-muted-foreground">{invite.fromUserEmail}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAcceptInvite(invite.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive bg-transparent"
                    onClick={() => handleRejectInvite(invite.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shared By Me */}
      {(sharedByMe.length > 0 || sentInvites.filter((i) => i.status === "pending").length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compartilhado Por Mim</CardTitle>
            <CardDescription className="text-xs">Usuários que têm acesso aos seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentInvites
              .filter((i) => i.status === "pending")
              .map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{invite.toUserEmail}</p>
                      <Badge variant="secondary" className="text-xs">
                        Aguardando resposta
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

            {sharedByMe.map((permission) => {
              const targetUser = userStorage.getUserProfile(permission.toUserId)
              if (!targetUser) return null

              return (
                <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={targetUser.avatar || "/placeholder.svg"} />
                      <AvatarFallback style={{ backgroundColor: targetUser.color }}>
                        {targetUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{targetUser.name}</p>
                      <p className="text-xs text-muted-foreground">{targetUser.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive bg-transparent"
                    onClick={() => handleRevokePermission(permission.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revogar
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Shared With Me */}
      {sharedWithMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compartilhado Comigo</CardTitle>
            <CardDescription className="text-xs">Usuários que compartilharam dados com você</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sharedWithMe.map((permission) => {
              const ownerUser = userStorage.getUserProfile(permission.fromUserId)
              if (!ownerUser) return null

              return (
                <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ownerUser.avatar || "/placeholder.svg"} />
                      <AvatarFallback style={{ backgroundColor: ownerUser.color }}>
                        {ownerUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{ownerUser.name}</p>
                      <p className="text-xs text-muted-foreground">{ownerUser.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Acesso concedido
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
