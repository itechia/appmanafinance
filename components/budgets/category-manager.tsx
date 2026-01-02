"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"

interface CategoryManagerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManager({ isOpen, onOpenChange }: CategoryManagerProps) {
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    color: "#2F404F",
    type: "expense" as "income" | "expense",
  })

  // Sync internal editing state with external open prop if needed, or handle exclusively with props.
  // Actually, standard pattern is parent controls open state.

  const { categories, transactions, addCategory, updateCategory, deleteCategory, currentUser } = useUser()
  const { toast } = useToast()

  // console.log("CategoryManager: Rendered. CurrentUser:", currentUser)

  const filteredCategories = categories.filter((cat) => filter === "all" || cat.type === filter)

  const categoriesWithCounts = filteredCategories.map((cat) => ({
    ...cat,
    transactionCount: transactions.filter((t) => t.category === cat.name).length,
  }))

  const handleEdit = (category: (typeof categories)[0]) => {
    setEditingId(category.id)
    setFormData({ name: category.name, icon: category.icon, color: category.color, type: category.type })
    onOpenChange(true)
  }

  const handleDelete = async (id: string, name: string) => {
    await deleteCategory(id)
    // Toast is handled by context
  }

  const handleSubmit = async () => {
    // console.log("CategoryManager: handleSubmit triggered", { formData, editingId })
    if (!formData.name || !formData.icon) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (editingId) {
      const success = await updateCategory(editingId, formData)
      if (success) {
        onOpenChange(false)
        setEditingId(null)
        setFormData({ name: "", icon: "", color: "#2F404F", type: "expense" })
      }
    } else {
      // console.log("CategoryManager: Calling addCategory from context...", formData);
      try {
        const success = await addCategory({ ...formData })
        // console.log("CategoryManager: addCategory result:", success);

        if (success) {
          onOpenChange(false)
          setEditingId(null)
          setFormData({ name: "", icon: "", color: "#2F404F", type: "expense" })
        }
      } catch (e) {
        console.error("CategoryManager: Error adding category", e)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-primary" : ""}
          >
            Todas
          </Button>
          <Button
            variant={filter === "expense" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("expense")}
            className={filter === "expense" ? "bg-primary" : ""}
          >
            Despesas
          </Button>
          <Button
            variant={filter === "income" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("income")}
            className={filter === "income" ? "bg-primary" : ""}
          >
            Receitas
          </Button>
        </div>
        {/* Button moved to parent */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoriesWithCounts.map((category) => (
          <Card key={category.id} className="p-4 hover:shadow-md transition-all group overflow-hidden border-l-4" style={{ borderLeftColor: category.color }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm"
                  style={{ backgroundColor: `${category.color}15`, color: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <h4 className="font-bold text-base leading-tight mb-1">{category.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${category.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {category.type === "income" ? "Receita" : "Despesa"}
                    </span>
                    <span className="text-xs text-muted-foreground">{category.transactionCount} transações</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50"
                  onClick={() => handleDelete(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          onOpenChange(open)
          if (!open) {
            setEditingId(null)
            setFormData({ name: "", icon: "", color: "#2F404F", type: "expense" })
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                placeholder="Ex: Alimentação, Transporte..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ícone (Emoji)</Label>
              <Input
                id="icon"
                placeholder="🍔"
                maxLength={2}
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  placeholder="#2F404F"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                >
                  Despesa
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                >
                  Receita
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
              {editingId ? "Salvar" : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
