"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId?: string | null
}

export function BudgetDialog({ open, onOpenChange, editingId }: BudgetDialogProps) {
  const { categories, budgets, addBudget, updateBudget, currentUser } = useUser()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    categoryId: "",
    limit: "",
    period: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    alertThreshold: "80",
  })

  useEffect(() => {
    if (editingId && open) {
      const budget = budgets.find((b) => b.id === editingId)
      if (budget) {
        setFormData({
          categoryId: budget.categoryId,
          limit: budget.limit.toString(),
          period: budget.period,
          alertThreshold: budget.alertThreshold.toString(),
        })
      }
    } else if (!open) {
      setFormData({ categoryId: "", limit: "", period: "monthly", alertThreshold: "80" })
    }
  }, [editingId, open, budgets])

  const handleSubmit = () => {
    if (!formData.categoryId || !formData.limit) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const selectedCategory = categories.find(c => c.id === formData.categoryId)

    const budgetData = {
      categoryId: formData.categoryId,
      limit: Number.parseFloat(formData.limit),
      period: formData.period,
      alertThreshold: Number.parseInt(formData.alertThreshold),
      categoryName: selectedCategory?.name || 'Desconhecido',
      categoryColor: selectedCategory?.color || '#2F404F',
      categoryIcon: selectedCategory?.icon || '💰'
    }

    if (editingId) {
      updateBudget(editingId, budgetData)
      toast({
        title: "Orçamento atualizado",
        description: `O orçamento foi atualizado com sucesso.`,
      })
    } else {
      addBudget(budgetData)
      toast({
        title: "Orçamento criado",
        description: `O orçamento foi criado com sucesso.`,
      })
    }

    onOpenChange(false)
  }

  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite de Gastos</Label>
            <Input
              id="limit"
              type="number"
              placeholder="0,00"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={formData.period} onValueChange={(value: any) => setFormData({ ...formData, period: value })}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert">Alerta em (%)</Label>
            <Input
              id="alert"
              type="number"
              placeholder="80"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Receba notificações ao atingir esta porcentagem</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
            {editingId ? "Salvar" : "Criar Orçamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
