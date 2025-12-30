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

export function CategoryManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    color: "#2F404F",
    type: "expense" as "income" | "expense",
  })

  const { categories, transactions, addCategory, updateCategory, deleteCategory, currentUser } = useUser()
  const { toast } = useToast()

  console.log("CategoryManager: Rendered. CurrentUser:", currentUser)

  const filteredCategories = categories.filter((cat) => filter === "all" || cat.type === filter)

  const categoriesWithCounts = filteredCategories.map((cat) => ({
    ...cat,
    transactionCount: transactions.filter((t) => t.category === cat.name).length,
  }))

  const handleEdit = (category: (typeof categories)[0]) => {
    setEditingId(category.id)
    setFormData({ name: category.name, icon: category.icon, color: category.color, type: category.type })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    await deleteCategory(id)
    // Toast is handled by context
  }

  const handleSubmit = async () => {
    // window.alert("DEBUG: HandleSubmit clicked!")
    console.log("CategoryManager: handleSubmit triggered", { formData, editingId })
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
        setIsDialogOpen(false)
        setEditingId(null)
        setFormData({ name: "", icon: "", color: "#2F404F", type: "expense" })
      }
    } else {
      console.log("CategoryManager: Calling addCategory from context...", formData);
      try {
        const success = await addCategory({ ...formData })
        console.log("CategoryManager: addCategory result:", success);

        if (success) {
          setIsDialogOpen(false)
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
        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoriesWithCounts.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.transactionCount} transações</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(category.id, category.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">
                {category.type === "income" ? "Receita" : "Despesa"}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
