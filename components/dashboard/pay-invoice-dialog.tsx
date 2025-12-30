"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useUser } from "@/lib/user-context"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PayInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    card: {
        id: string
        name: string
        color: string
    }
    amount: number
    month: number // 0-11
    year: number
}

export function PayInvoiceDialog({ open, onOpenChange, card, amount, month, year }: PayInvoiceDialogProps) {
    const { wallets, cards, addTransfer } = useUser()
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Combine Wallets and Debit Cards
    const paymentOptions = [
        ...wallets.map(w => ({ ...w, type: 'Carteira' })),
        ...cards.filter(c => c.hasDebit).map(c => ({ ...c, type: 'Cartão de Débito', icon: '💳' }))
    ]

    const handlePay = async () => {
        if (!selectedAccount) {
            toast({
                title: "Selecione uma conta",
                description: "Você precisa selecionar uma carteira ou conta para pagar a fatura.",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            // Create a transfer from the selected wallet/account to the credit card
            await addTransfer(
                selectedAccount,
                card.id,
                amount,
                `Pagamento de Fatura - ${card.name}`,
                new Date()
            )

            toast({
                title: "Fatura paga!",
                description: "O pagamento foi registrado com sucesso.",
            })
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast({
                title: "Erro ao pagar",
                description: "Ocorreu um erro ao processar o pagamento.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const periodName = format(new Date(year, month, 1), "MMMM 'de' yyyy", { locale: ptBR })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pagar Fatura</DialogTitle>
                    <DialogDescription>
                        Confirmar pagamento da fatura de <strong>{card.name}</strong> referente a {periodName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Valor da Fatura</span>
                        <span className="text-xl font-bold text-destructive">
                            R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wallet">Pagar com</Label>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger id="wallet">
                                <SelectValue placeholder="Selecione a conta de origem" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentOptions.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{account.icon || '💳'}</span>
                                            <span>{account.name}</span>
                                            <span className="text-muted-foreground ml-auto text-xs">
                                                ({account.type}) R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePay} disabled={isSubmitting || !selectedAccount}>
                        {isSubmitting ? "Pagando..." : "Confirmar Pagamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
