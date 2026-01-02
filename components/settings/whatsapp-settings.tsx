"use client"

import type React from "react"

import { useState } from "react"
import { MessageSquare, Bot, Sparkles, MapPin, CreditCard, Wallet, User } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const assistantPersonalities = [
  {
    id: "profissional",
    label: "Profissional",
    description: "Formal e direto ao ponto",
    icon: "💼",
  },
  {
    id: "amigavel",
    label: "Amigável",
    description: "Casual e acolhedor",
    icon: "😊",
  },
  {
    id: "engracado",
    label: "Engraçado",
    description: "Descontraído com humor",
    icon: "😄",
  },
  {
    id: "motivacional",
    label: "Motivacional",
    description: "Inspirador e encorajador",
    icon: "💪",
  },
  {
    id: "cristao",
    label: "Cristão",
    description: "Com referências bíblicas e fé",
    icon: "🙏",
  },
  {
    id: "minimalista",
    label: "Minimalista",
    description: "Respostas curtas e objetivas",
    icon: "✨",
  },
]

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

import { useUser } from "@/lib/user-context"

import { useToast } from "@/hooks/use-toast"

export function WhatsAppSettings() {
  const { wallets, cards, currentUser, updateUserProfile } = useUser()
  const { toast } = useToast()

  const [enabled, setEnabled] = useState<boolean>(currentUser?.whatsappEnabled || false)

  // Logic to determine initial phone:
  // 1. Use saved whatsappPhone if it exists and is NOT the placeholder
  // 2. Fallback to profile phone
  // 3. Fallback to empty string (placeholder will show in input)
  const defaultPlaceholder = "+55 (11) 98 00000-0000"
  const savedPhone = currentUser?.whatsappPhone
  const profilePhone = currentUser?.phone

  const initialPhone = (savedPhone && savedPhone !== defaultPlaceholder)
    ? savedPhone
    : (profilePhone || "")

  const [phone, setPhone] = useState(initialPhone)
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>(currentUser?.whatsappPersonalities || ["profissional"])
  const [gender, setGender] = useState<string>(currentUser?.whatsappGender || "masculino")
  const [defaultDebitAccount, setDefaultDebitAccount] = useState<string>(currentUser?.whatsappDefaultDebitAccount || "")
  const [defaultCreditCard, setDefaultCreditCard] = useState<string>(currentUser?.whatsappDefaultCreditCard || "")
  const [isLoading, setIsLoading] = useState(false)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    // ... logic same ...
    if (numbers.length <= 2) return `+${numbers}`
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`
    if (numbers.length <= 6) return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 10)
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 6)} ${numbers.slice(6)}`
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 6)} ${numbers.slice(6, 10)}-${numbers.slice(10, 14)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const togglePersonality = (id: string) => {
    setSelectedPersonalities((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    setIsLoading(true)
    console.log("WhatsAppSettings: Starting save...")
    try {
      await updateUserProfile({
        whatsappEnabled: enabled,
        whatsappPhone: phone,
        whatsappPersonalities: selectedPersonalities,
        whatsappGender: gender,
        // We pass local state. Context will handle empty strings.
        whatsappDefaultDebitAccount: defaultDebitAccount,
        whatsappDefaultCreditCard: defaultCreditCard
      })
      console.log("WhatsAppSettings: Save successful")
      // updateUserProfile handles Success Toast
    } catch (error) {
      console.error("WhatsAppSettings: Save error", error)
      // updateUserProfile handles Error Toast
    } finally {
      console.log("WhatsAppSettings: Resetting loading state")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Integração WhatsApp</h2>
        <p className="text-sm text-muted-foreground">Configure seu assistente financeiro no WhatsApp</p>
      </div>

      {/* WhatsApp Connection */}
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Conectar WhatsApp</h3>
            <p className="text-sm text-muted-foreground">Vincule seu número para usar o assistente</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2 pl-15">
          <Label htmlFor="whatsapp-number">Número do WhatsApp</Label>
          <Input
            id="whatsapp-number"
            type="tel"
            placeholder="+55 (11) 98 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={20}
          />

        </div>

        <div className="space-y-2 pl-15">
          <Label htmlFor="origin-state">Estado de Origem</Label>
          <Select defaultValue="SP">
            <SelectTrigger id="origin-state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {brazilianStates.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Alert className="mt-2">
            <MapPin className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Esta informação ajuda o assistente a interagir melhor com você, usando expressões e referências regionais.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-3 pl-15">
          <Label>Gênero</Label>
          <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="masculino" id="masculino" />
              <Label htmlFor="masculino" className="font-normal cursor-pointer">
                Homem
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="feminino" id="feminino" />
              <Label htmlFor="feminino" className="font-normal cursor-pointer">
                Mulher
              </Label>
            </div>
          </RadioGroup>
          <Alert className="mt-2">
            <User className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Isso facilitará a comunicação entre você e o assistente.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Assistant Personality */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Personalidade do Assistente</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha uma ou mais personalidades para seu assistente financeiro
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assistantPersonalities.map((personality) => (
            <label
              key={personality.id}
              htmlFor={personality.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${selectedPersonalities.includes(personality.id) ? "border-primary bg-primary/5" : ""
                }`}
            >
              <input
                type="checkbox"
                id={personality.id}
                checked={selectedPersonalities.includes(personality.id)}
                onChange={() => togglePersonality(personality.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{personality.icon}</span>
                  <span className="font-medium text-foreground">{personality.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{personality.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Ações Rápidas</h3>
        </div>
        <p className="text-sm text-muted-foreground">Configure comandos rápidos para usar no WhatsApp</p>

        <Alert>
          <AlertDescription className="text-xs">
            Configure cartões e carteiras principais para facilitar o registro de transações via WhatsApp. O assistente
            usará automaticamente essas contas ao processar suas mensagens.
          </AlertDescription>
        </Alert>

        <Card className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <Label className="font-semibold">Cartão/Carteira Principal para Débito</Label>
            </div>
            <Select value={defaultDebitAccount} onValueChange={setDefaultDebitAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta para débito" />
              </SelectTrigger>
              <SelectContent>
                {/* Wallets */}
                {wallets.length > 0 && <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Carteiras</div>}
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}

                {/* Debit Cards */}
                {cards.some(c => c.type === 'debit' || c.type === 'both' || c.hasDebit) && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Cartões de Débito</div>
                )}
                {cards.filter(c => c.type === 'debit' || c.type === 'both' || c.hasDebit).map(card => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} (Débito)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usado automaticamente quando você registrar despesas ou receitas sem especificar a conta
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <Label className="font-semibold">Cartão Principal para Crédito</Label>
            </div>
            <Select value={defaultCreditCard} onValueChange={setDefaultCreditCard}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão de crédito" />
              </SelectTrigger>
              <SelectContent>
                {cards.filter(c => c.type === 'credit' || c.type === 'both' || c.hasCredit).map(card => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} (Crédito)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usado automaticamente quando você registrar compras no crédito via WhatsApp
            </p>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Registrar despesa</p>
              <p className="text-xs text-muted-foreground">Envie "despesa [valor] [categoria]"</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Consultar saldo</p>
              <p className="text-xs text-muted-foreground">Envie "saldo"</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Ver últimas transações</p>
              <p className="text-xs text-muted-foreground">Envie "transações"</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  )
}
