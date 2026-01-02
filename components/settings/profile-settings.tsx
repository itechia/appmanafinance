"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Camera, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { EmailChange } from "./email-change"

export function ProfileSettings() {
  const { currentUser, updateUserProfile, uploadAvatar } = useUser()
  const { toast } = useToast()

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [bio, setBio] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use currentUser instead of authUser to get the correctly mapped profile data (avatar_url -> avatar, etc.)
  useEffect(() => {
    if (currentUser) {
      // currentUser from user-context has the merged & mapped profile data
      const combinedName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ")
      setFullName(currentUser.name || combinedName || "")
      setEmail(currentUser.email || "")
      setPhone(currentUser.phone || "")
      setCpf(currentUser.cpf || "")
      setBirthDate(currentUser.birthDate || "")
      setBio(currentUser.bio || "")
      setProfileImage(currentUser.avatar || null)
    }
  }, [currentUser])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return `+${numbers}`
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`
    if (numbers.length <= 6) return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 10)
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 6)} ${numbers.slice(6)}`
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 6)} ${numbers.slice(6, 10)}-${numbers.slice(10, 14)}`
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  const handleSave = async () => {
    // Basic validation
    if (!fullName.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    console.log("ProfileSettings: Starting save...")

    try {
      let avatarUrl = profileImage

      // If a new file was selected, upload it first
      if (selectedFile) {
        console.log("ProfileSettings: Uploading avatar...")
        const uploadedUrl = await uploadAvatar(selectedFile)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
          console.log("ProfileSettings: Avatar uploaded")
        } else {
          // If upload fails, keep existing or fallback
          console.warn("ProfileSettings: Avatar upload returned null")
          avatarUrl = currentUser?.avatar || null
        }
      }

      console.log("ProfileSettings: Updating profile in context...")
      await updateUserProfile({
        name: fullName.trim(),
        firstName: fullName.trim().split(" ")[0] || "",
        lastName: fullName.trim().split(" ").slice(1).join(" ") || "",
        email: email.trim(),
        phone: phone.trim(),
        cpf: cpf.trim(),
        birthDate: birthDate,
        bio: bio.trim(),
        avatar: avatarUrl || undefined,
      })
      console.log("ProfileSettings: Profile updated successfully")

    } catch (error) {
      console.error("Profile save error:", error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      console.log("ProfileSettings: Resetting submitting state")
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (currentUser) {
      const combinedName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ")
      setFullName(currentUser.name || combinedName || "")
      setEmail(currentUser.email || "")
      setPhone(currentUser.phone || "")
      setCpf(currentUser.cpf || "")
      setBirthDate(currentUser.birthDate || "")
      setBio(currentUser.bio || "")
      setProfileImage(currentUser.avatar || null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Perfil</h2>
        <p className="text-sm text-muted-foreground">Atualize suas informações pessoais e foto de perfil</p>
      </div>

      {/* Profile Photo */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {profileImage ? (
              <img src={profileImage || "/placeholder.svg"} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-4 w-4" />
            <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
        <div>
          <h3 className="font-medium text-foreground">Foto de perfil</h3>
          <p className="text-sm text-muted-foreground">PNG, JPG até 5MB</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              className="flex-1"
            />
            <EmailChange />
          </div>

        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+55 (11) 98 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={20}
          />

        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={handleCPFChange} maxLength={14} />

        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Sobre você</Label>
          <Textarea
            id="bio"
            placeholder="Conte um pouco sobre você..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  )
}
