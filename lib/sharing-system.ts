/**
 * Sistema de Compartilhamento e Permissões
 * Permite que usuários compartilhem dados de forma controlada e revogável
 * Compatível com LGPD - compartilhamento explícito e transparente
 */

import { userStorage, type UserProfile } from "./user-storage"

export interface SharingPermission {
  id: string
  fromUserId: string
  toUserId: string
  permissions: {
    viewTransactions: boolean
    viewBudgets: boolean
    viewCategories: boolean
  }
  createdAt: string
  expiresAt?: string
}

export interface SharingInvite {
  id: string
  fromUserId: string
  fromUserName: string
  fromUserEmail: string
  toUserEmail: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  expiresAt: string
}

const SHARING_PERMISSIONS_KEY = "mana_sharing_permissions"
const SHARING_INVITES_KEY = "mana_sharing_invites"

function generateId(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const sharingSystem = {
  /**
   * Cria um convite de compartilhamento
   */
  createInvite: (fromUserId: string, toUserEmail: string): SharingInvite | null => {
    if (typeof window === "undefined") return null

    const fromUser = userStorage.getUserProfile(fromUserId)
    if (!fromUser) return null

    // Verificar se o usuário de destino existe
    const toUser = userStorage.findUserByEmail(toUserEmail)
    if (!toUser) {
      throw new Error("Usuário não encontrado")
    }

    if (toUser.id === fromUserId) {
      throw new Error("Você não pode compartilhar com você mesmo")
    }

    // Verificar se já existe um convite pendente
    const existingInvites = sharingSystem.getAllInvites()
    const pendingInvite = existingInvites.find(
      (inv) => inv.fromUserId === fromUserId && inv.toUserEmail === toUserEmail && inv.status === "pending",
    )

    if (pendingInvite) {
      throw new Error("Já existe um convite pendente para este usuário")
    }

    const invite: SharingInvite = {
      id: generateId(),
      fromUserId,
      fromUserName: fromUser.name,
      fromUserEmail: fromUser.email,
      toUserEmail,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    }

    const invites = existingInvites
    invites.push(invite)
    localStorage.setItem(SHARING_INVITES_KEY, JSON.stringify(invites))

    return invite
  },

  /**
   * Aceita um convite de compartilhamento
   */
  acceptInvite: (inviteId: string, userId: string): void => {
    if (typeof window === "undefined") return

    const invites = sharingSystem.getAllInvites()
    const invite = invites.find((inv) => inv.id === inviteId)

    if (!invite) {
      throw new Error("Convite não encontrado")
    }

    const user = userStorage.getUserProfile(userId)
    if (!user || user.email !== invite.toUserEmail) {
      throw new Error("Você não tem permissão para aceitar este convite")
    }

    if (invite.status !== "pending") {
      throw new Error("Este convite já foi processado")
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new Error("Este convite expirou")
    }

    // Atualizar status do convite
    invite.status = "accepted"
    localStorage.setItem(SHARING_INVITES_KEY, JSON.stringify(invites))

    // Criar permissão de compartilhamento
    const permission: SharingPermission = {
      id: generateId(),
      fromUserId: invite.fromUserId,
      toUserId: userId,
      permissions: {
        viewTransactions: true,
        viewBudgets: true,
        viewCategories: true,
      },
      createdAt: new Date().toISOString(),
    }

    const permissions = sharingSystem.getAllPermissions()
    permissions.push(permission)
    localStorage.setItem(SHARING_PERMISSIONS_KEY, JSON.stringify(permissions))
  },

  /**
   * Rejeita um convite de compartilhamento
   */
  rejectInvite: (inviteId: string, userId: string): void => {
    if (typeof window === "undefined") return

    const invites = sharingSystem.getAllInvites()
    const invite = invites.find((inv) => inv.id === inviteId)

    if (!invite) {
      throw new Error("Convite não encontrado")
    }

    const user = userStorage.getUserProfile(userId)
    if (!user || user.email !== invite.toUserEmail) {
      throw new Error("Você não tem permissão para rejeitar este convite")
    }

    invite.status = "rejected"
    localStorage.setItem(SHARING_INVITES_KEY, JSON.stringify(invites))
  },

  /**
   * Revoga uma permissão de compartilhamento
   */
  revokePermission: (permissionId: string, userId: string): void => {
    if (typeof window === "undefined") return

    const permissions = sharingSystem.getAllPermissions()
    const permission = permissions.find((p) => p.id === permissionId)

    if (!permission) {
      throw new Error("Permissão não encontrada")
    }

    // Apenas o dono dos dados pode revogar
    if (permission.fromUserId !== userId) {
      throw new Error("Você não tem permissão para revogar este compartilhamento")
    }

    const filtered = permissions.filter((p) => p.id !== permissionId)
    localStorage.setItem(SHARING_PERMISSIONS_KEY, JSON.stringify(filtered))
  },

  /**
   * Obtém todos os convites
   */
  getAllInvites: (): SharingInvite[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(SHARING_INVITES_KEY)
    return stored ? JSON.parse(stored) : []
  },

  /**
   * Obtém convites recebidos por um usuário
   */
  getReceivedInvites: (userEmail: string): SharingInvite[] => {
    const invites = sharingSystem.getAllInvites()
    return invites.filter((inv) => inv.toUserEmail === userEmail && inv.status === "pending")
  },

  /**
   * Obtém convites enviados por um usuário
   */
  getSentInvites: (userId: string): SharingInvite[] => {
    const invites = sharingSystem.getAllInvites()
    return invites.filter((inv) => inv.fromUserId === userId)
  },

  /**
   * Obtém todas as permissões
   */
  getAllPermissions: (): SharingPermission[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(SHARING_PERMISSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  },

  /**
   * Obtém permissões onde o usuário é o dono (compartilhou com outros)
   */
  getSharedByMe: (userId: string): SharingPermission[] => {
    const permissions = sharingSystem.getAllPermissions()
    return permissions.filter((p) => p.fromUserId === userId)
  },

  /**
   * Obtém permissões onde o usuário tem acesso (outros compartilharam com ele)
   */
  getSharedWithMe: (userId: string): SharingPermission[] => {
    const permissions = sharingSystem.getAllPermissions()
    return permissions.filter((p) => p.toUserId === userId)
  },

  /**
   * Verifica se um usuário tem permissão para ver dados de outro
   */
  hasPermission: (viewerId: string, ownerId: string): boolean => {
    if (viewerId === ownerId) return true // Sempre pode ver seus próprios dados

    const permissions = sharingSystem.getAllPermissions()
    return permissions.some((p) => p.fromUserId === ownerId && p.toUserId === viewerId)
  },

  /**
   * Obtém perfis de usuários que compartilharam dados comigo
   */
  getSharedUsersProfiles: (userId: string): UserProfile[] => {
    const sharedWithMe = sharingSystem.getSharedWithMe(userId)
    const profiles: UserProfile[] = []

    for (const permission of sharedWithMe) {
      const profile = userStorage.getUserProfile(permission.fromUserId)
      if (profile) {
        profiles.push(profile)
      }
    }

    return profiles
  },
}
