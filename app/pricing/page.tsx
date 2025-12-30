"use client"

import { useState } from "react"
import { Check, Sparkles, ArrowLeft, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { PLAN_FEATURES } from "@/lib/types/subscription"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const router = useRouter()

  const proFeatures = PLAN_FEATURES.pro.features
  const freeFeatures = PLAN_FEATURES.free.features

  const monthlyPrice = 29.99
  const yearlyPrice = 299.99

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/5 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4 py-12 relative z-10">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 shadow-sm">
            <Sparkles className="h-4 w-4" />
            <span>Planos e Preços</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Invista no seu futuro financeiro
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Como você está utilizando a versão LOCAL, todos os recursos PRO já estão desbloqueados gratuitamente!
          </p>

          <div className="flex justify-center pt-4">
            <div className="bg-muted p-1 rounded-xl inline-flex relative">
              <div
                className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-all duration-300 ease-in-out",
                  interval === "yearly" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                )}
              />
              <button
                onClick={() => setInterval("monthly")}
                className={cn(
                  "relative z-10 px-8 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                  interval === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className={cn(
                  "relative z-10 px-8 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2",
                  interval === "yearly" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Anual
                <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide">
                  -17% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Free Plan */}
          <Card className="relative overflow-hidden border-muted transition-all duration-300 hover:shadow-lg hover:border-primary/20 group">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-bold">Gratuito</CardTitle>
              <CardDescription className="text-base mt-2">
                Essencial para começar a organizar suas contas.
              </CardDescription>
              <div className="pt-6">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-muted-foreground ml-2">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button variant="outline" className="w-full h-12 text-base font-medium" disabled onClick={() => router.push("/")}>
                Incluído
              </Button>
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">O plano inclui:</p>
                <ul className="space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="mt-0.5 p-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Check className="h-3 w-3" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative overflow-hidden border-primary shadow-xl scale-105 z-10 bg-card">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1.5 rounded-bl-xl text-xs font-bold tracking-wide uppercase shadow-sm">
              Ativado
            </div>

            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                Pro
                <Sparkles className="h-5 w-5 text-primary fill-primary/20" />
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Poder total para maximizar seu patrimônio.
              </CardDescription>
              <div className="pt-6">
                {interval === "monthly" ? (
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">R$ {monthlyPrice.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">/mês</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">R$ {yearlyPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground ml-2">/ano</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Economize R$ {(monthlyPrice * 12 - yearlyPrice).toFixed(2)} por ano
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                onClick={() => router.push("/")}
              >
                Já Ativado (Versão Local)
                <Zap className="h-4 w-4 ml-2 fill-current" />
              </Button>

              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">Tudo do Grátis, mais:</p>
                <ul className="space-y-3">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  )
}
