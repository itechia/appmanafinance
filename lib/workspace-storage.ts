import { localStorage } from "./storage-helpers"
import type { Workspace, WorkspaceMember } from "./types/workspace"

const WORKSPACES_KEY = "mana_workspaces"
const WORKSPACE_MEMBERS_KEY = "mana_workspace_members"

class WorkspaceStorage {
  // Workspaces
  getWorkspaces(): Workspace[] {
    return localStorage.get<Workspace[]>(WORKSPACES_KEY) || []
  }

  getWorkspace(workspaceId: string): Workspace | null {
    const workspaces = this.getWorkspaces()
    return workspaces.find((w) => w.id === workspaceId) || null
  }

  getUserWorkspaces(userId: string): Workspace[] {
    const workspaces = this.getWorkspaces()
    const members = this.getWorkspaceMembers()

    const userWorkspaceIds = members
      .filter((m) => m.userId === userId && m.status === "ACTIVE")
      .map((m) => m.workspaceId)

    return workspaces.filter((w) => userWorkspaceIds.includes(w.id))
  }

  createWorkspace(workspace: Omit<Workspace, "id" | "createdAt" | "updatedAt">): Workspace {
    const workspaces = this.getWorkspaces()
    const newWorkspace: Workspace = {
      ...workspace,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    workspaces.push(newWorkspace)
    localStorage.set(WORKSPACES_KEY, workspaces)

    // Create owner member
    this.createMember({
      workspaceId: newWorkspace.id,
      userId: workspace.ownerId,
      role: "OWNER",
      status: "ACTIVE",
    })

    return newWorkspace
  }

  updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Workspace | null {
    const workspaces = this.getWorkspaces()
    const index = workspaces.findIndex((w) => w.id === workspaceId)

    if (index === -1) return null

    workspaces[index] = {
      ...workspaces[index],
      ...updates,
      updatedAt: new Date(),
    }

    localStorage.set(WORKSPACES_KEY, workspaces)
    return workspaces[index]
  }

  deleteWorkspace(workspaceId: string): boolean {
    const workspaces = this.getWorkspaces()
    const filtered = workspaces.filter((w) => w.id !== workspaceId)

    if (filtered.length === workspaces.length) return false

    localStorage.set(WORKSPACES_KEY, filtered)

    // Delete all members
    const members = this.getWorkspaceMembers()
    const filteredMembers = members.filter((m) => m.workspaceId !== workspaceId)
    localStorage.set(WORKSPACE_MEMBERS_KEY, filteredMembers)

    return true
  }

  // Workspace Members
  getWorkspaceMembers(): WorkspaceMember[] {
    return localStorage.get<WorkspaceMember[]>(WORKSPACE_MEMBERS_KEY) || []
  }

  getWorkspaceMembersByWorkspace(workspaceId: string): WorkspaceMember[] {
    const members = this.getWorkspaceMembers()
    return members.filter((m) => m.workspaceId === workspaceId)
  }

  getMember(workspaceId: string, userId: string): WorkspaceMember | null {
    const members = this.getWorkspaceMembers()
    return members.find((m) => m.workspaceId === workspaceId && m.userId === userId) || null
  }

  createMember(member: Omit<WorkspaceMember, "id" | "createdAt" | "updatedAt">): WorkspaceMember {
    const members = this.getWorkspaceMembers()
    const newMember: WorkspaceMember = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    members.push(newMember)
    localStorage.set(WORKSPACE_MEMBERS_KEY, members)
    return newMember
  }

  updateMember(memberId: string, updates: Partial<WorkspaceMember>): WorkspaceMember | null {
    const members = this.getWorkspaceMembers()
    const index = members.findIndex((m) => m.id === memberId)

    if (index === -1) return null

    members[index] = {
      ...members[index],
      ...updates,
      updatedAt: new Date(),
    }

    localStorage.set(WORKSPACE_MEMBERS_KEY, members)
    return members[index]
  }

  deleteMember(memberId: string): boolean {
    const members = this.getWorkspaceMembers()
    const filtered = members.filter((m) => m.id !== memberId)

    if (filtered.length === members.length) return false

    localStorage.set(WORKSPACE_MEMBERS_KEY, filtered)
    return true
  }
}

export const workspaceStorage = new WorkspaceStorage()
