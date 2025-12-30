"use client"

import { useState, useEffect } from "react"
import { Key, Copy, Eye, EyeOff, Share2, Check, X, RefreshCw, CheckCircle2, ArrowRightLeft, ArrowRight, ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/lib/user-context"
import { workspaceStorage } from "@/lib/workspace-storage"
import { userStorage } from "@/lib/user-storage"
import type { WorkspaceMember } from "@/lib/types/workspace"

export function ConnectionsSettings() {
  const { currentUser, currentWorkspace, refreshData } = useUser()
  const [userToken, setUserToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [pasteToken, setPasteToken] = useState("")
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)

  // State for connections
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [activeConnections, setActiveConnections] = useState<any[]>([])

  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false })

  const { toast } = useToast()

  useEffect(() => {
    if (currentUser) {
      // Generate token based on User ID
      setUserToken(`MF-${currentUser.id}`)
      loadConnections()
    }
  }, [currentUser, currentWorkspace])

  const loadConnections = () => {
    if (!currentUser) return

    // 1. Incoming Requests & Active Members (People in MY workspaces)
    const myWorkspaces = workspaceStorage.getUserWorkspaces(currentUser.id).filter(w => w.ownerId === currentUser.id)
    const myWorkspaceIds = myWorkspaces.map(w => w.id)

    const allMembers = workspaceStorage.getWorkspaceMembers()
    const myWorkspaceMembers = allMembers.filter(m => myWorkspaceIds.includes(m.workspaceId) && m.userId !== currentUser.id)

    const incoming = []
    const activeInMy = []

    for (const member of myWorkspaceMembers) {
      const user = userStorage.findUserById(member.userId)
      if (user) {
        const connection = {
          id: member.id,
          workspaceId: member.workspaceId,
          userId: member.userId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: member.status,
          role: member.role,
          type: "incoming", // They joined me
          permissions: {
            canEdit: member.role === "EDITOR" || member.role === "ADMIN",
            canDelete: member.role === "ADMIN"
          }
        }
        if (member.status === "PENDING") {
          incoming.push(connection)
        } else if (member.status === "ACTIVE") {
          activeInMy.push(connection)
        }
      }
    }

    // 2. Outgoing Requests & Active Joined (Workspaces I joined)
    const memberships = allMembers.filter(m => m.userId === currentUser.id && m.status !== "REJECTED")
    const outgoing = []
    const activeJoined = []

    for (const membership of memberships) {
      const workspace = workspaceStorage.getWorkspaces().find(w => w.id === membership.workspaceId)
      if (workspace && workspace.ownerId !== currentUser.id) {
        const owner = userStorage.findUserById(workspace.ownerId)
        if (owner) {
          const connection = {
            id: membership.id,
            workspaceId: membership.workspaceId,
            userId: workspace.ownerId, // The owner
            name: owner.name, // Workspace owner name
            email: owner.email,
            avatar: owner.avatar,
            status: membership.status,
            role: membership.role,
            type: "outgoing", // I joined them
            workspaceName: workspace.name
          }
          if (membership.status === "PENDING") {
            outgoing.push(connection)
          } else if (membership.status === "ACTIVE") {
            activeJoined.push(connection)
          }
        }
      }
    }

    setIncomingRequests(incoming)
    setOutgoingRequests(outgoing)
    setActiveConnections([...activeInMy, ...activeJoined])
  }

  const copyToken = () => {
    navigator.clipboard.writeText(userToken)
    setShowCopyFeedback(true)
    toast({
      title: "Código copiado!",
      description: "Seu token foi copiado para a área de transferência",
    })
    setTimeout(() => setShowCopyFeedback(false), 2000)
  }

  const handlePasteSync = () => {
    if (!currentUser) return

    if (!pasteToken.startsWith("MF-") || pasteToken.length < 5) {
      toast({
        title: "Token inválido",
        description: "O token deve começar com 'MF-'",
        variant: "destructive",
      })
      return
    }

    const targetUserId = pasteToken.replace("MF-", "")

    if (targetUserId === currentUser.id) {
      toast({
        title: "Token inválido",
        description: "Você não pode se conectar consigo mesmo",
        variant: "destructive",
      })
      return
    }

    const targetUser = userStorage.findUserById(targetUserId)
    if (!targetUser) {
      toast({
        title: "Usuário não encontrado",
        description: "Não foi possível encontrar um usuário com este token",
        variant: "destructive",
      })
      return
    }

    // Find target user's default workspace (Personal)
    const targetWorkspaces = workspaceStorage.getUserWorkspaces(targetUserId)
    const targetWorkspace = targetWorkspaces.find(w => w.ownerId === targetUserId) // Assume first owned workspace is default

    if (!targetWorkspace) {
      toast({
        title: "Erro",
        description: "O usuário não possui um workspace válido",
        variant: "destructive",
      })
      return
    }

    // Check if already a member
    const existingMember = workspaceStorage.getMember(targetWorkspace.id, currentUser.id)
    if (existingMember) {
      toast({
        title: "Já conectado",
        description: `Você já possui uma conexão com ${targetUser.name} (${existingMember.status === 'PENDING' ? 'Pendente' : 'Ativa'})`,
        variant: "destructive",
      })
      return
    }

    // Create membership request
    workspaceStorage.createMember({
      workspaceId: targetWorkspace.id,
      userId: currentUser.id,
      role: "VIEWER",
      status: "PENDING"
    })

    toast({
      title: "Solicitação enviada",
      description: `Solicitação enviada para ${targetUser.name}`,
    })
    setPasteToken("")
    setIsPasteDialogOpen(false)
    loadConnections()
  }

  const handleAcceptConnection = (connection: any) => {
    // I am accepting someone into MY workspace
    workspaceStorage.updateMember(connection.id, { status: "ACTIVE" })
    toast({
      title: "Conexão aceita",
      description: `${connection.name} agora tem acesso ao seu workspace`,
    })
    loadConnections()
  }

  const handleRejectConnection = (connection: any) => {
    // I am rejecting someone or cancelling my request
    workspaceStorage.deleteMember(connection.id)
    toast({
      title: "Conexão removida",
      description: "A conexão foi removida/rejeitada",
      variant: "destructive",
    })
    loadConnections()
  }

  const openShareDialog = (connection: any) => {
    // Only for people in MY workspace
    if (connection.type === "incoming") {
      setSelectedMember(connection)
      setPermissions(connection.permissions)
      setIsShareDialogOpen(true)
    }
  }

  const handleSavePermissions = () => {
    if (selectedMember) {
      const newRole = permissions.canDelete ? "ADMIN" : (permissions.canEdit ? "EDITOR" : "VIEWER")
      workspaceStorage.updateMember(selectedMember.id, { role: newRole })

      toast({
        title: "Permissões atualizadas",
        description: "As permissões foram salvas com sucesso",
      })
      setIsShareDialogOpen(false)
      loadConnections()
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Sincronização de Contas</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Conecte-se com outros usuários para compartilhar workspaces e dados financeiros
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Key className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm md:text-base">Seu Token de Sincronização</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Compartilhe este token para que outros possam se conectar a você</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  value={showToken ? userToken : "•".repeat(userToken.length)}
                  readOnly
                  className="pr-10 font-mono text-xs md:text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={copyToken} variant="outline" className="gap-2 bg-transparent relative w-full sm:w-auto">
                {showCopyFeedback ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Este token permite que outros usuários solicitem acesso ao seu workspace. Você precisará aprovar a solicitação.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => setIsPasteDialogOpen(true)} className="gap-2 flex-1 text-xs md:text-sm">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Colar Token para Sincronizar</span>
              <span className="sm:hidden">Sincronizar</span>
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">Conexões Ativas</h3>
        {activeConnections.length === 0 ? (
          <Card className="p-8 md:p-12">
            <div className="text-center space-y-3">
              <Key className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
              <p className="text-sm md:text-base text-muted-foreground">Nenhuma conexão ativa</p>
            </div>
          </Card>
        ) : (
          activeConnections.map((connection) => (
            <Card key={connection.id} className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                    <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm md:text-base">{connection.name}</h3>
                      <Badge variant="default" className="text-xs">
                        Ativo
                      </Badge>
                      {connection.type === "outgoing" && (
                        <Badge variant="outline" className="text-xs">
                          Workspace: {connection.workspaceName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{connection.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {connection.type === "incoming" ? "Acessando seus dados" : "Você acessa os dados dele(a)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {connection.type === "incoming" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openShareDialog(connection)}
                      className="flex-1 sm:flex-none text-xs md:text-sm"
                    >
                      <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Permissões
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive bg-transparent flex-1 sm:flex-none text-xs md:text-sm"
                    onClick={() => handleRejectConnection(connection)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-sm md:text-base">Solicitações Pendentes</h3>

          {/* Incoming Requests */}
          {incomingRequests.map((connection) => (
            <Card key={connection.id} className="p-4 md:p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm md:text-base">{connection.name}</h3>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 text-xs">
                        Solicitação Recebida
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{connection.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deseja acessar seu workspace
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 flex-1 sm:flex-none text-xs md:text-sm"
                    onClick={() => handleAcceptConnection(connection)}
                  >
                    <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive bg-transparent flex-1 sm:flex-none text-xs md:text-sm"
                    onClick={() => handleRejectConnection(connection)}
                  >
                    <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Outgoing Requests */}
          {outgoingRequests.map((connection) => (
            <Card key={connection.id} className="p-4 md:p-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm md:text-base">{connection.name}</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 text-xs">
                        Solicitação Enviada
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{connection.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aguardando aprovação para acessar workspace
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive bg-transparent flex-1 sm:flex-none text-xs md:text-sm"
                    onClick={() => handleRejectConnection(connection)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar com Token</DialogTitle>
            <DialogDescription>Cole o token de sincronização do outro usuário para solicitar conexão</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token de Sincronização</Label>
              <Input
                id="token"
                placeholder="MF-XXXXXXXXXX"
                value={pasteToken}
                onChange={(e) => setPasteToken(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                O token deve começar com "MF-"
              </p>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Após colar o token, uma solicitação será enviada ao outro usuário. A conexão aparecerá como "Aguardando
                Aprovação" até que o usuário aceite.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasteSync}>Solicitar Conexão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Permissões</DialogTitle>
            <DialogDescription>Defina o que {selectedMember?.name} pode fazer no seu workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-semibold">Permissões de Acesso</Label>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="canEdit"
                  checked={permissions.canEdit}
                  onCheckedChange={(checked) => setPermissions({ ...permissions, canEdit: checked as boolean })}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="canEdit" className="font-medium cursor-pointer text-sm">
                    Pode editar
                  </Label>
                  <p className="text-xs text-muted-foreground">Permitir criar, editar e excluir transações, orçamentos, etc.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="canDelete"
                  checked={permissions.canDelete}
                  onCheckedChange={(checked) => setPermissions({ ...permissions, canDelete: checked as boolean })}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="canDelete" className="font-medium cursor-pointer text-sm">
                    Administrador
                  </Label>
                  <p className="text-xs text-muted-foreground">Acesso total, incluindo gerenciar membros e configurações do workspace.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions}>Salvar Permissões</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
