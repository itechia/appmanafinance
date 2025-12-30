import { Transaction, Card } from "./types/app-types"

/**
 * Calculates the projected invoice amount for a specific card due in a specific month/year.
 * It considers the closing day to find the correct cycle (previous month -> current month).
 */
/**
 * Returns the start and end dates of the billing cycle for an invoice DUE in (year, month).
 */
export function getInvoiceCycleForMonth(card: Card, year: number, month: number): { start: Date, end: Date } {
    if (!card.dueDate && !card.dueDay) {
        // Fallback: If no due date, assume calendar month? Or just return null/empty range?
        // Let's assume calendar month for safety if config is missing, though unlikely for valid cards.
        return {
            start: new Date(year, month, 1, 0, 0, 0),
            end: new Date(year, month + 1, 0, 23, 59, 59)
        }
    }

    const dueDay = card.dueDate || card.dueDay || 10
    const closingDay = card.closingDay || Math.max(1, dueDay - 10)

    let cycleEndDate = new Date(year, month, closingDay)

    // If Closing Date is ON or AFTER Due Date, then the invoice due in Month X
    // must have closed in Month X-1.
    if (closingDay >= dueDay) {
        cycleEndDate = new Date(year, month - 1, closingDay)
    }

    const cycleStartDate = new Date(cycleEndDate)
    cycleStartDate.setMonth(cycleStartDate.getMonth() - 1)
    cycleStartDate.setDate(cycleStartDate.getDate() + 1)

    // Adjust hours
    cycleStartDate.setHours(0, 0, 0, 0)
    cycleEndDate.setHours(23, 59, 59, 999)

    return { start: cycleStartDate, end: cycleEndDate }
}

/**
 * Calculates the projected invoice amount for a specific card due in a specific month/year.
 * It considers the closing day to find the correct cycle (previous month -> current month).
 */
export function getInvoiceAmountForMonth(
    card: Card,
    year: number,
    month: number, // 0-based
    transactions: Transaction[]
): number {
    const { start: cycleStartDate, end: cycleEndDate } = getInvoiceCycleForMonth(card, year, month)

    // 2. Sum relevant transactions
    const total = transactions.filter(t => {
        const tDate = new Date(t.date)

        // Logic:
        // - Must be expense
        // - Must belong to this card
        // - Must be within cycle
        // - Must be Credit Operation (cardFunction='credit' OR card.type='credit' default)

        const isCreditOp = t.cardFunction === 'credit' || (card.type === 'credit' && t.cardFunction !== 'debit')

        return (
            t.account === card.id &&
            t.type === 'expense' &&
            t.category !== 'Transferência' && // Exclude transfers (usually payments)
            isCreditOp &&
            tDate >= cycleStartDate &&
            tDate <= cycleEndDate
        )
    }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return total
}

/**
 * Determines the "Accounting Date" for a transaction.
 * - Debit/Cash: Transaction Date
 * - Credit: Due Date of the Invoice the transaction belongs to.
 */
export function getTransactionAccountDate(transaction: Transaction, cards: Card[]): Date {
    const tDate = new Date(transaction.date)

    // Helper to check if it's a credit operation
    const isCreditOp = transaction.cardFunction === 'credit' || (transaction.type === 'expense' && transaction.account && cards.find(c => c.id === transaction.account)?.type === 'credit')

    if (!isCreditOp || !transaction.account) {
        return tDate
    }

    const card = cards.find(c => c.id === transaction.account)
    if (!card) return tDate

    const dueDay = card.dueDate || card.dueDay || 10
    // Default closing day is 10 days before due day, minimum 1
    const closingDay = card.closingDay || Math.max(1, dueDay - 10)
    const tDay = tDate.getDate()

    // Determine Cycle End Date
    // If transaction day is before closing, it belongs to the cycle ending this month.
    // If transaction day is on/after closing, it belongs to cycle ending next month.
    let cycleEndMonth = tDate.getMonth()
    let cycleEndYear = tDate.getFullYear()

    if (tDay >= closingDay) {
        cycleEndMonth++
    }

    // Normalize Month/Year overflow
    if (cycleEndMonth > 11) {
        cycleEndMonth = 0
        cycleEndYear++
    }

    // Determine Invoice Due Date from Cycle End Month
    // If Closing >= Due, Invoice is due in the month FOLLOWING the cycle end month.
    // If Closing < Due, Invoice is due in the SAME month as cycle end month.
    let dueMonth = cycleEndMonth
    let dueYear = cycleEndYear

    if (closingDay >= dueDay) {
        dueMonth++
    }

    // Normalize Month/Year overflow again
    if (dueMonth > 11) {
        dueMonth = 0
        dueYear++
    }

    return new Date(dueYear, dueMonth, dueDay)
}
