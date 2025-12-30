import Dexie, { type EntityTable } from 'dexie'
import type {
    Workspace, WorkspaceMember, Category, Budget,
    Transaction, Card, Wallet, Goal, Notification, NotificationPreferences
} from './types/app-types'

// Define the database instance with table types
interface ManaFinanceDatabase extends Dexie {
    workspaces: EntityTable<Workspace, 'id'>
    members: EntityTable<WorkspaceMember, 'id'>
    categories: EntityTable<Category, 'id'>
    budgets: EntityTable<Budget, 'id'>
    transactions: EntityTable<Transaction, 'id'>
    cards: EntityTable<Card, 'id'>
    wallets: EntityTable<Wallet, 'id'>
    goals: EntityTable<Goal, 'id'>
    notifications: EntityTable<Notification, 'id'>
    preferences: EntityTable<NotificationPreferences & { id: string }, 'id'>
}

export const db = new Dexie('ManaFinanceDB') as ManaFinanceDatabase

    // Define tables and indexes
    ; (db as any).version(2).stores({
        workspaces: 'id, ownerId, mode',
        members: 'id, workspaceId, userId, role',
        categories: 'id, userId, type',
        budgets: 'id, userId, period',
        transactions: 'id, userId, date, category, type, account, recurrenceId, installmentId',
        cards: 'id, userId',
        wallets: 'id, userId',
        goals: 'id, userId',
        notifications: 'id, date, read',
        preferences: 'id'
    })

// Helper to reset DB
export async function resetDatabase() {
    const tables = [
        db.workspaces, db.members, db.categories, db.budgets,
        db.transactions, db.cards, db.wallets, db.goals,
        db.notifications, db.preferences
    ]
    await (db as any).transaction('rw', tables, async () => {
        await Promise.all(tables.map(table => (table as any).clear()))
    })
}
