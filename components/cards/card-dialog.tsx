"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"

interface CardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "card" | "wallet"
  initialData?: any
}

export function CardDialog({ open, onOpenChange, type, initialData }: CardDialogProps) {
  const [hasCredit, setHasCredit] = useState(false)
  const [name, setName] = useState("")
  const [lastDigits, setLastDigits] = useState("")
  const [brand, setBrand] = useState("")
  const [balance, setBalance] = useState("")
  const [limit, setLimit] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [closingDate, setClosingDate] = useState("")
  const [color, setColor] = useState("#8B5CF6")
  const [icon, setIcon] = useState("money")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addCard, addWallet, updateCard, updateWallet } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Edit mode - populate fields
        setName(initialData.name || "")
        setColor(initialData.color || (type === "card" ? "#8B5CF6" : "#195C3E"))

        if (type === "card") {
          setHasCredit(initialData.hasCredit || false)
          setLastDigits(initialData.lastDigits || "")
          setBrand(initialData.brand || "")
          setBalance(initialData.balance?.toString() || "")
          setLimit(initialData.limit?.toString() || initialData.creditLimit?.toString() || "")
          setDueDate(initialData.dueDay?.toString() || initialData.dueDate?.toString() || "")
          setClosingDate(initialData.closingDay?.toString() || "")
        } else {
          // Wallet
          setBalance(initialData.balance?.toString() || "")
          setIcon(getIconKey(initialData.icon) || "money")
        }
      } else {
        // Create mode - reset
        setHasCredit(false)
        setName("")
        setLastDigits("")
        setBrand("")
        setBalance("")
        setLimit("")
        setDueDate("")
        setClosingDate("")
        setColor(type === "card" ? "#8B5CF6" : "#195C3E")
        setIcon("money")
      }
    }
  }, [open, type, initialData])

  // Helper to reverse map icon emoji to key
  const getIconKey = (emoji: string) => {
    if (emoji === "💵") return "money"
    if (emoji === "💳") return "card"
    if (emoji === "💰") return "wallet"
    if (emoji === "🏦") return "bank"
    if (emoji === "🐷") return "piggy"
    return "money"
  }

  const handleWalletSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um nome para a carteira",
        variant: "destructive",
      })
      return
    }

    if (!balance || Number.parseFloat(balance) < 0) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um saldo válido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addWallet({
        name: name.trim(),
        balance: Number.parseFloat(balance),
        icon:
          icon === "money" ? "💵" : icon === "card" ? "💳" : icon === "wallet" ? "💰" : icon === "bank" ? "🏦" : "🐷",
        color,
      })

      toast({
        title: "Sucesso!",
        description: "Carteira adicionada com sucesso",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a carteira",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCardSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um nome para o cartão",
        variant: "destructive",
      })
      return
    }

    if (!lastDigits || lastDigits.length !== 4) {
      toast({
        title: "Erro",
        description: "Por favor, adicione os últimos 4 dígitos do cartão",
        variant: "destructive",
      })
      return
    }

    if (!brand) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a bandeira do cartão",
        variant: "destructive",
      })
      return
    }

    if (!balance || Number.parseFloat(balance) < 0) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um saldo válido",
        variant: "destructive",
      })
      return
    }

    if (hasCredit && (!limit || Number.parseFloat(limit) <= 0)) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um limite de crédito válido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (initialData) {
        await updateCard(initialData.id, {
          name: name.trim(),
          lastDigits,
          brand,
          balance: Number.parseFloat(balance),
          limit: hasCredit ? Number.parseFloat(limit) : 0,
          // used: 0, // Don't reset used on update!
          color,
          dueDate: hasCredit && dueDate ? Number.parseInt(dueDate) : 0,
          closingDay: hasCredit && closingDate ? Number.parseInt(closingDate) : 0,
          hasCredit,
          hasDebit: true, // Assuming default? Or should it be conditional? Keeping same as add for now but usually update shouldn't force it. 
          // Actually, let's keep simplistic update for now.
          type: hasCredit ? "both" : "debit",
        })
        toast({ title: "Sucesso!", description: "Cartão atualizado com sucesso" })
      } else {
        await addCard({
          name: name.trim(),
          lastDigits,
          brand,
          balance: Number.parseFloat(balance),
          limit: hasCredit ? Number.parseFloat(limit) : 0,
          used: 0,
          color,
          dueDate: hasCredit && dueDate ? Number.parseInt(dueDate) : 0,
          closingDay: hasCredit && closingDate ? Number.parseInt(closingDate) : 0,
          hasCredit,
          hasDebit: true,
          type: hasCredit ? "both" : "debit",
        })
        toast({ title: "Sucesso!", description: "Cartão adicionado com sucesso" })
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível ${initialData ? "atualizar" : "adicionar"} o cartão`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (type === "wallet") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{initialData ? "Editar Carteira" : "Adicionar Carteira"}</DialogTitle>
            <DialogDescription>
              {initialData ? "Edite os dados da carteira." : "Preencha os dados abaixo para adicionar uma nova carteira."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-name">Nome da Carteira</Label>
              <Input
                id="wallet-name"
                placeholder="Ex: Dinheiro Físico, PicPay, Mercado Pago..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-balance">Saldo Inicial</Label>
              <Input
                id="wallet-balance"
                type="number"
                placeholder="0,00"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-icon">Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="wallet-icon">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="money">💵 Dinheiro</SelectItem>
                  <SelectItem value="card">💳 Cartão</SelectItem>
                  <SelectItem value="wallet">💰 Carteira</SelectItem>
                  <SelectItem value="bank">🏦 Banco</SelectItem>
                  <SelectItem value="piggy">🐷 Cofrinho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="wallet-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#195C3E"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleWalletSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar Carteira"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Cartão</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para adicionar um novo cartão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">Nome do Cartão</Label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank, Inter, C6..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last-digits">Últimos 4 dígitos</Label>
              <Input
                id="last-digits"
                placeholder="1234"
                maxLength={4}
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Bandeira</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="elo">Elo</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo em Conta (Débito)</Label>
            <Input
              id="balance"
              type="number"
              placeholder="0,00"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="has-credit" className="text-base">
                Função Crédito
              </Label>
              <p className="text-sm text-muted-foreground">Este cartão possui função de crédito?</p>
            </div>
            <Switch id="has-credit" checked={hasCredit} onCheckedChange={setHasCredit} />
          </div>

          {hasCredit && (
            <div className="space-y-4 p-4 rounded-lg border bg-primary/5">
              <h4 className="font-semibold text-sm">Configurações de Crédito</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">Limite</Label>
                  <Input
                    id="limit"
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Dia do Vencimento</Label>
                  <Input
                    id="due-date"
                    type="number"
                    placeholder="15"
                    min="1"
                    max="31"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing-date">Dia do Fechamento</Label>
                <Input
                  id="closing-date"
                  type="number"
                  placeholder="10"
                  min="1"
                  max="31"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="color">Cor do Cartão</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#8B5CF6"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleCardSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : "Adicionar Cartão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
