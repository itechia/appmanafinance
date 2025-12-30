"use client"

import { useState, useEffect } from "react"
import { Palette, Globe, Shield } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [language, setLanguage] = useState("pt-BR")
  const [currency, setCurrency] = useState("BRL")
  const [timezone, setTimezone] = useState("America/Sao_Paulo")
  const [dataRetention, setDataRetention] = useState("1year")

  // Load saved preferences on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem("mana_preferences")
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs)
      setLanguage(parsed.language || "pt-BR")
      setCurrency(parsed.currency || "BRL")
      setTimezone(parsed.timezone || "America/Sao_Paulo")
      setDataRetention(parsed.dataRetention || "1year")
    }
  }, [])

  const handleSave = () => {
    const prefs = {
      language,
      currency,
      timezone,
      dataRetention
    }
    localStorage.setItem("mana_preferences", JSON.stringify(prefs))

    toast({
      title: "Preferências salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Preferências</h2>
        <p className="text-sm text-muted-foreground">Personalize a aparência e comportamento do app</p>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Aparência</h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tema</Label>
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid grid-cols-3 gap-3"
            >
              <label
                htmlFor="light"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${theme === 'light' ? 'border-primary bg-primary/5' : ''}`}
              >
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                  {theme === 'light' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">Claro</span>
              </label>
              <label
                htmlFor="dark"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${theme === 'dark' ? 'border-primary bg-primary/5' : ''}`}
              >
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                  {theme === 'dark' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">Escuro</span>
              </label>
              <label
                htmlFor="system"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${theme === 'system' ? 'border-primary bg-primary/5' : ''}`}
              >
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                  {theme === 'system' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">Sistema</span>
              </label>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Idioma e Região</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Privacidade</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data-retention">Retenção de dados</Label>
          <Select value={dataRetention} onValueChange={setDataRetention}>
            <SelectTrigger id="data-retention">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="1year">1 ano</SelectItem>
              <SelectItem value="2years">2 anos</SelectItem>
              <SelectItem value="forever">Sempre</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Quanto tempo manter suas transações e dados financeiros</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSave}>Salvar preferências</Button>
      </div>
    </div>
  )
}
