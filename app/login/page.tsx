"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState as useStateEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { isPasswordValid } from "@/lib/utils/password-validator"
import { localStorage } from "@/lib/storage-helpers"

type ViewMode = "login" | "register" | "reset"

export default function LoginPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useStateEffect(false)
  const { login, register } = useAuth()

  useEffect(() => {
    setMounted(true)
    const rememberedEmail = localStorage.get<string>("rememberedEmail")
    const rememberedPassword = localStorage.get<string>("rememberedPassword")
    if (rememberedEmail && rememberedPassword) {
      setEmail(rememberedEmail)
      setPassword(rememberedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (viewMode === "login") {
        if (rememberMe) {
          localStorage.set("rememberedEmail", email)
          localStorage.set("rememberedPassword", password)
        } else {
          localStorage.remove("rememberedEmail")
          localStorage.remove("rememberedPassword")
        }

        const result = await login(email, password)
        if (!result.success) {
          setError(result.error || "Email ou senha inválidos")
        }
      } else if (viewMode === "register") {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem")
          setIsSubmitting(false)
          return
        }
        if (!isPasswordValid(password)) {
          setError("A senha não atende aos requisitos mínimos de segurança")
          setIsSubmitting(false)
          return
        }
        const result = await register(name, email, password)
        if (!result.success) {
          setError(result.error || "Erro ao criar conta")
        }
      } else if (viewMode === "reset") {
        // Simulate password reset
        await new Promise((resolve) => setTimeout(resolve, 500))
        alert("Instruções de recuperação enviadas para seu e-mail!")
        setViewMode("login")
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Image src="/favicon.svg" alt="Maná Finance" width={80} height={80} className="w-16 sm:w-20 h-auto" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Sua prosperidade financeira começa aqui</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl">
              {viewMode === "login" && "Bem-vindo de volta"}
              {viewMode === "register" && "Criar conta"}
              {viewMode === "reset" && "Recuperar senha"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {viewMode === "login" && "Entre com suas credenciais para acessar sua conta"}
              {viewMode === "register" && "Preencha os dados abaixo para criar sua conta"}
              {viewMode === "reset" && "Digite seu e-mail para receber instruções de recuperação"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-xs sm:text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              {viewMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-9 sm:h-10 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-9 sm:h-10 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {viewMode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-9 sm:h-10 text-sm"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {viewMode === "register" && <PasswordStrengthIndicator password={password} />}
                </div>
              )}

              {viewMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-9 sm:h-10 text-sm"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {viewMode === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Lembrar de mim
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("reset")}
                    className="text-xs sm:text-sm text-primary hover:underline"
                    disabled={isSubmitting}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button
                type="submit"
                className="w-full h-9 sm:h-10 bg-primary hover:bg-primary/90 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    Processando...
                  </span>
                ) : (
                  <>
                    {viewMode === "login" && "Entrar"}
                    {viewMode === "register" && "Criar conta"}
                    {viewMode === "reset" && "Enviar instruções"}
                  </>
                )}
              </Button>

              {viewMode === "login" && (
                <div className="text-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">Não tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className="text-primary hover:underline font-medium"
                    disabled={isSubmitting}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              {viewMode === "register" && (
                <div className="text-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">Já tem uma conta? </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("login")}
                    className="text-primary hover:underline font-medium"
                    disabled={isSubmitting}
                  >
                    Fazer login
                  </button>
                </div>
              )}

              {viewMode === "reset" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setViewMode("login")}
                  className="w-full h-9 sm:h-10 gap-2 text-sm"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para login
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-6 px-2">
          Ao continuar, você concorda com nossos{" "}
          <a
            href="https://termosdeuso.manafinance.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Termos de Uso
          </a>{" "}
          e{" "}
          <a
            href="https://politicadeprivacidade.manafinance.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  )
}
