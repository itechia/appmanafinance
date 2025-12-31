"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, addMonths, subMonths, isSameMonth, isAfter, isBefore, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowRight, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { Card as CreditCard, Transaction } from "@/lib/types/app-types"
import { getInvoiceAmountForMonth } from "@/lib/invoice-utils"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface InvoiceHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    card: CreditCard
    transactions: Transaction[]
    onPayInvoice: (month: number, year: number, amount: number) => void
}

export function InvoiceHistoryDialog({
    open,
    onOpenChange,
    card,
    transactions,
    onPayInvoice
}: InvoiceHistoryDialogProps) {
    const currentDate = new Date()
    const currentMonthStart = startOfMonth(currentDate)

    // Generate range: -6 months to +12 months
    const monthsRange = useMemo(() => {
        const range = []
        for (let i = -6; i <= 12; i++) {
            range.push(addMonths(currentMonthStart, i))
        }
        return range
    }, [currentMonthStart])

    const invoices = useMemo(() => {
        return monthsRange.map(date => {
            const amount = getInvoiceAmountForMonth(card, date.getFullYear(), date.getMonth(), transactions)
            const isPast = isBefore(date, currentMonthStart)
            const isCurrent = isSameMonth(date, currentMonthStart)
            const isFuture = isAfter(date, currentMonthStart)

            return {
                date,
                amount,
                isPast,
                isCurrent,
                isFuture
            }
        })
    }, [monthsRange, card, transactions, currentMonthStart])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Histórico de Faturas</DialogTitle>
                    <DialogDescription>
                        Visualize faturas passadas e futuras de {card.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {/* Current Invoice */}
                            <div className="py-2">
                                <h4 className="text-sm font-medium text-primary sticky top-0 bg-background py-2 z-10 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Fatura Atual
                                </h4>
                                {invoices.filter(i => i.isCurrent).map((invoice, idx) => (
                                    <InvoiceItem
                                        key={idx}
                                        invoice={invoice}
                                        onPay={() => {
                                            onPayInvoice(invoice.date.getMonth(), invoice.date.getFullYear(), invoice.amount)
                                            onOpenChange(false)
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Future Invoices (Projected) */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2 z-10 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Próximas Faturas
                                </h4>
                                {invoices.filter(i => i.isFuture).map((invoice, idx) => (
                                    <InvoiceItem
                                        key={idx}
                                        invoice={invoice}
                                        onPay={() => {
                                            onPayInvoice(invoice.date.getMonth(), invoice.date.getFullYear(), invoice.amount)
                                            onOpenChange(false)
                                        }}
                                    />
                                ))}
                                {invoices.filter(i => i.isFuture).length === 0 && (
                                    <p className="text-xs text-muted-foreground p-2 text-center">Nenhum lançamento futuro.</p>
                                )}
                            </div>

                            {/* Past Invoices */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2 z-10 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Histórico
                                </h4>
                                {invoices.filter(i => i.isPast).reverse().map((invoice, idx) => (
                                    <InvoiceItem
                                        key={idx}
                                        invoice={invoice}
                                        onPay={() => {
                                            onPayInvoice(invoice.date.getMonth(), invoice.date.getFullYear(), invoice.amount)
                                            onOpenChange(false)
                                        }}
                                        isHistory
                                    />
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InvoiceItem({ invoice, onPay, isHistory = false }: { invoice: any, onPay: () => void, isHistory?: boolean }) {
    const { date, amount, isCurrent } = invoice

    // Skip displaying empty invoices in history/future to reduce clutter? 
    // Maybe keep them to show "Nothing due"? 
    // Let's hide 0 amount invoices in history to keep it clean, but show in future if user wants to see 'free' months?
    // User requested "Futura e Historico". Usually only active invoices matter. 
    // Let's show all for now, but style 0 differently.

    if (amount === 0 && isHistory) return null // Hide empty history

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs capitalize ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {format(date, "MMM", { locale: ptBR })}
                </div>
                <div>
                    <p className="font-medium capitalize text-sm">
                        {format(date, "MMMM yyyy", { locale: ptBR })}
                    </p>
                    <p className={`text-xs ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {isHistory ? 'Fechada' : isCurrent ? 'Aberta' : 'Prevista'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right">
                    <span className={`block font-bold ${isHistory ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {formatCurrency(amount)}
                    </span>
                </div>

                {!isHistory && amount > 0 && (
                    <Button size="sm" variant={isCurrent ? "default" : "outline"} className="h-8 text-xs" onClick={onPay}>
                        {isCurrent ? "Pagar" : "Adiantar"}
                    </Button>
                )}
                {isHistory && (
                    <Badge variant="outline" className="text-xs bg-muted/50">Pago</Badge>
                )}
            </div>
        </div>
    )
}
