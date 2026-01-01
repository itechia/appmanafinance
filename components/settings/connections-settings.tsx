"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, UserPlus, Users, Briefcase, Check, X, Loader2, Trash2, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ConnectionsSettings() {
  const { workspaces, currentWorkspace, currentUser, switchWorkspace, refreshData } = useUser()
  const { toast } = useToast()

  const [connectId, setConnectId] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [members, setMembers] = useState<any[]>([])

  // Find my own workspace (where I am owner) to show who I shared with
  const mySharedWorkspace = workspaces.find(w => w.ownerId === currentUser?.id)

  const handleConnect = async () => {
    if (!connectId.trim()) return
    setIsConnecting(true)
    try {
      const { data, error } = await supabase.rpc('join_workspace_by_owner_id', {
        target_owner_id: connectId.trim()
      })

      if (error) throw error

      if (data === 'Sucesso') {
        toast({ title: "Conectado!", description: "Você agora tem acesso aos dados deste usuário." })
        setConnectId("")
        refreshData()
      } else {
        toast({ title: "Atenção", description: data, variant: "destructive" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erro", description: "Falha ao conectar.", variant: "destructive" })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCopyId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id)
      toast({ title: "Copiado!", description: "ID copiado para a área de transferência." })
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (!mySharedWorkspace) return
    try {
      const { error } = await supabase.from('workspace_members')
        .delete()
        .eq('workspace_id', mySharedWorkspace.id)
        .eq('user_id', targetUserId)

      if (error) throw error

      toast({ title: "Membro removido", description: "Acesso revogado." })
      fetchMyMembers()
    } catch (error) {
      console.error(error)
      toast({ title: "Erro", description: "Falha ao remover membro.", variant: "destructive" })
    }
  }

  const handleLeaveWorkspace = async (workspaceId: string) => {
    if (!currentUser?.id) return
    try {
      const { error } = await supabase.from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      toast({ title: "Desconectado", description: "Você removeu a conexão." })
      if (currentWorkspace?.id === workspaceId) {
        switchWorkspace('personal')
      }
      refreshData()
    } catch (error) {
      console.error(error)
      toast({ title: "Erro", description: "Falha ao desconectar.", variant: "destructive" })
    }
  }

  const fetchMyMembers = async () => {
    if (!mySharedWorkspace) return
    const { data } = await supabase
      .from('workspace_members')
      .select('*, profiles:user_id(name, email, avatar_url)')
      .eq('workspace_id', mySharedWorkspace.id)
      .neq('user_id', currentUser?.id) // Don't show myself

    if (data) {
      setMembers(data)
    }
  }

  // Effect to load members when component mounts or updates
  useState(() => {
    if (mySharedWorkspace) {
      fetchMyMembers()
    }
  })

  // Connected accounts (Workspaces I am a member of, excluding my own)
  const connectedAccounts = workspaces.filter(w => w.ownerId !== currentUser?.id)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Conexões e Compartilhamento</h2>
        <p className="text-sm text-muted-foreground">
          Compartilhe seus dados financeiros ou acesse contas de parceiros usando o ID de usuário.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Share My Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Compartilhar meus dados
            </CardTitle>
            <CardDescription>
              Envie este Token para quem você quer dar acesso aos seus dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={currentUser?.id || ''} readOnly className="font-mono text-xs bg-muted" />
              <Button size="icon" variant="outline" onClick={handleCopyId}>
                <Check className="w-4 h-4" />
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Quem tem acesso? ({members.length})</h4>
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ninguém conectado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.profiles?.avatar_url} />
                          <AvatarFallback>{member.profiles?.name?.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span>{member.profiles?.name || 'Usuário'}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveMember(member.user_id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connect to Partner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Conectar a uma conta
            </CardTitle>
            <CardDescription>
              Insira o Token de outro usuário para acessar os dados dele.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cole o ID do usuário aqui..."
                value={connectId}
                onChange={e => setConnectId(e.target.value)}
              />
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Conectar"}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Contas Conectadas</h4>
              <div className="space-y-2">
                {/* Personal Option */}
                <div
                  className={`flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50 ${!currentWorkspace ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => switchWorkspace('personal')}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 opacity-70" />
                    <div>
                      <div className="text-sm font-medium">Pessoal (Meus Dados)</div>
                    </div>
                  </div>
                  {!currentWorkspace && <Check className="w-3 h-3 text-primary" />}
                </div>

                {/* Connected Lists */}
                {connectedAccounts.map(ws => (
                  <div
                    key={ws.id}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50 ${currentWorkspace?.id === ws.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => switchWorkspace(ws.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{ws.name.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{ws.name === 'Principal' ? `Conta de Compartilhada` : ws.name}</div>
                        <div className="text-[10px] text-muted-foreground">{ws.ownerId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentWorkspace?.id === ws.id && <Check className="w-3 h-3 text-primary" />}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleLeaveWorkspace(ws.id); }}>
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
