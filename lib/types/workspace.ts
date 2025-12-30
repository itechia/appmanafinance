export type WorkspaceMode = "PERSONAL" | "SHARED"
export type MemberRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
export type MemberStatus = "ACTIVE" | "INVITED" | "REMOVED" | "PENDING" | "REJECTED"

export interface Workspace {
  id: string
  name: string
  mode: WorkspaceMode
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: MemberRole
  status: MemberStatus
  createdAt: Date
  updatedAt: Date
}

export interface WorkspacePermissions {
  canCreateTransactions: boolean
  canEditTransactions: boolean
  canDeleteTransactions: boolean
  canCreateWallets: boolean
  canEditWallets: boolean
  canDeleteWallets: boolean
  canCreateGoals: boolean
  canEditGoals: boolean
  canDeleteGoals: boolean
  canManageMembers: boolean
  canDeleteWorkspace: boolean
}

export function getPermissions(role: MemberRole): WorkspacePermissions {
  switch (role) {
    case "OWNER":
    case "ADMIN":
      return {
        canCreateTransactions: true,
        canEditTransactions: true,
        canDeleteTransactions: true,
        canCreateWallets: true,
        canEditWallets: true,
        canDeleteWallets: true,
        canCreateGoals: true,
        canEditGoals: true,
        canDeleteGoals: true,
        canManageMembers: true,
        canDeleteWorkspace: role === "OWNER",
      }
    case "EDITOR":
      return {
        canCreateTransactions: true,
        canEditTransactions: true,
        canDeleteTransactions: true,
        canCreateWallets: true,
        canEditWallets: true,
        canDeleteWallets: false,
        canCreateGoals: true,
        canEditGoals: true,
        canDeleteGoals: true,
        canManageMembers: false,
        canDeleteWorkspace: false,
      }
    case "VIEWER":
      return {
        canCreateTransactions: false,
        canEditTransactions: false,
        canDeleteTransactions: false,
        canCreateWallets: false,
        canEditWallets: false,
        canDeleteWallets: false,
        canCreateGoals: false,
        canEditGoals: false,
        canDeleteGoals: false,
        canManageMembers: false,
        canDeleteWorkspace: false,
      }
  }
}
