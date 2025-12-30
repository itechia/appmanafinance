import { Transaction, Budget, Card } from "./types/app-types"
import { getInvoiceCycleForMonth } from "./invoice-utils"

/**
 * Calculates the amount spent for a budget in a specific month/year.
 * Respects Cash Basis for Credit Cards (Invoice Date).
 */
export function calculateBudgetSpent(
    budget: Budget,
    month: number, // 0-based
    year: number,
    transactions: Transaction[],
    cards: Card[],
    userId?: string
): number {
    const cardCycles: Record<string, { start: Date, end: Date }> = {}
    cards.filter(c => c.hasCredit).forEach(c => {
        cardCycles[c.id] = getInvoiceCycleForMonth(c, year, month)
    })

    const relevantTransactions = transactions.filter((t) => {
        // Basic Filters
        if (t.type !== "expense") return false
        if (userId && t.userId !== userId) return false

        // Category Match
        // Note: Transactions currently use category Name. Ideally ID.
        if (t.category !== budget.categoryName) return false

        const tDate = new Date(t.date)

        // Date Logic
        const card = cards.find(c => c.id === t.account)
        const isCredit = card?.hasCredit && (t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit'))

        if (isCredit && card) {
            // Credit: Match Invoice Cycle
            const cycle = cardCycles[card.id]
            if (!cycle) return false
            return tDate >= cycle.start && tDate <= cycle.end
        } else {
            // Debit/Cash: Match Calendar Month
            return tDate.getMonth() === month && tDate.getFullYear() === year
        }
    })

    return relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

/**
 * Retrieves the budget limit for a specific month/year based on history.
 * If no specific history exists for that month, returns the current limit 
 * (or the last known limit if we implemented full timeline).
 * 
 * Current Logic: 
 * - Check for exact match in history.
 * - If not found, use current limit (assumes current limit applies to everything unless historically overridden).
 * - Refinement for stability: If looking at past, maybe we should find the closest history? 
 *   For now, strictly following plan: "Snapshot when updated".
 */
export function getBudgetLimitForMonth(
    budget: Budget,
    month: number,
    year: number
): number {
    if (!budget.history || budget.history.length === 0) {
        return budget.limit
    }

    const targetKey = `${year}-${String(month + 1).padStart(2, '0')}`

    // 1. Try to find specific entry for this month
    const historyEntry = budget.history.find(h => h.month === targetKey)
    if (historyEntry) {
        return historyEntry.limit
    }

    // 2. If viewing a PAST month, and we have history for FUTURE months, 
    // it implies the limit changed at some point. 
    // But our simple logic is: Current `limit` is for NOW/FUTURE. `history` is overrides for PAST.
    // So if we don't find an entry in history for a past month, 
    // it means either:
    // a) The limit was NEVER changed for that month (so it was the same as current? No, current is new).
    // b) We only snapshot the "old" value when we change.

    // Example:
    // Jan: 1000. Feb: Change to 2000. History: [{month: '2025-01', limit: 1000}]. Budget.limit = 2000.
    // get(Feb) -> No history. Return 2000. Correct.
    // get(Jan) -> Found 1000. Return 1000. Correct.

    return budget.limit
}
