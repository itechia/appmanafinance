"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
}

const goalIcons = ["🎯", "✈️", "🏠", "🚗", "💰", "🎓", "🛡️", "💍", "🏖️", "📱"]
const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
]

export function GoalDialog({ open, onOpenChange, onSubmit, initialData }: GoalDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    icon: goalIcons[0],
    color: gradients[0],
    imageUrl: "",
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        targetAmount: initialData.targetAmount.toString(),
        deadline: initialData.deadline,
        icon: initialData.icon,
        color: initialData.color,
        imageUrl: initialData.imageUrl || "",
      })
    } else {
      setFormData({
        name: "",
        targetAmount: "",
        deadline: "",
        icon: goalIcons[0],
        color: gradients[0],
        imageUrl: "",
      })
    }
  }, [initialData, open])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) return

          // Set canvas to 1024x1024
          canvas.width = 1024
          canvas.height = 1024

          const ctx = canvas.getContext("2d")
          if (!ctx) return

          // Calculate dimensions to cover the square (crop to fit)
          const scale = Math.max(1024 / img.width, 1024 / img.height)
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          const x = (1024 - scaledWidth) / 2
          const y = (1024 - scaledHeight) / 2

          // Draw image centered and cropped
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

          // Convert to data URL
          const resizedImageUrl = canvas.toDataURL("image/jpeg", 0.9)
          setFormData({ ...formData, imageUrl: resizedImageUrl })
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      targetAmount: Number.parseFloat(formData.targetAmount),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Atualize as informações do seu objetivo" : "Crie um novo objetivo financeiro"}
          </DialogDescription>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Objetivo</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem para Europa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">Valor da Meta (R$)</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Imagem do Objetivo (1024x1024px)</Label>
            <div className="flex items-center gap-4">
              {formData.imageUrl && (
                <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-border">
                  <img
                    src={formData.imageUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-1 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center px-2">
                    {formData.imageUrl ? "Alterar imagem" : "Carregar imagem"}
                  </span>
                  <span className="text-xs text-muted-foreground">1024x1024px</span>
                </Label>
                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
            {formData.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, imageUrl: "" })}
                className="text-xs"
              >
                Remover imagem
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex gap-2 flex-wrap">
              {goalIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`h-10 w-10 rounded-lg border-2 flex items-center justify-center text-xl hover:border-primary transition-colors ${
                    formData.icon === icon ? "border-primary bg-primary/10" : "border-border"
                  }`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {gradients.map((gradient, index) => (
                <button
                  key={index}
                  type="button"
                  className={`h-10 w-10 rounded-lg border-2 transition-all ${
                    formData.color === gradient ? "border-primary scale-110" : "border-border"
                  }`}
                  style={{ background: gradient }}
                  onClick={() => setFormData({ ...formData, color: gradient })}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{initialData ? "Salvar" : "Criar Objetivo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
