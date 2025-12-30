import Dexie, { type Table } from 'dexie'
import type {
    User, Workspace, WorkspaceMember, Category, Budget,
    Transaction, Card, Wallet, Goal, Notification, NotificationPreferences
} from './types/app-types'

export class ManaFinanceDB extends Dexie {
    workspaces!: Table<Workspace>
    members!: Table<WorkspaceMember>
    categories!: Table<Category>
    budgets!: Table<Budget>
    transactions!: Table<Transaction>
    cards!: Table<Card>
    wallets!: Table<Wallet>
    goals!: Table<Goal>
    notifications!: Table<Notification>
    preferences!: Table<NotificationPreferences & { id: string }>

    constructor() {
        super('ManaFinanceDB')

        // Define tables and indexes
        this.version(2).stores({
            workspaces: 'id, ownerId, mode',
            members: 'id, workspaceId, userId, role',
            categories: 'id, userId, type',
            budgets: 'id, userId, period',
            transactions: 'id, userId, date, category, type, account, recurrenceId, installmentId',
            cards: 'id, userId',
            wallets: 'id, userId',
            goals: 'id, userId',
            notifications: 'id, date, read',
            preferences: 'id' // Singleton, id='default'
        })
    }

    /* Helper to reset DB */
    async resetDatabase() {
        await this.transaction('rw', this.tables, async () => {
            await Promise.all(this.tables.map(table => table.clear()))
        })
    }
}

export const db = (typeof window !== 'undefined' ? new ManaFinanceDB() : undefined) as ManaFinanceDB
