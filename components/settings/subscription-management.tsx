"use client"

import { useState } from "react"
import { Crown, Download, Calendar, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useTheme } from "next-themes"

// Mock invoice data
const mockInvoices = [
  {
    id: "INV-2025-001",
    date: "2025-01-15",
    amount: 39.99,
    status: "paid" as const,
    plan: "Pro Mensal",
  },
  {
    id: "INV-2024-012",
    date: "2024-12-15",
    amount: 39.99,
    status: "paid" as const,
    plan: "Pro Mensal",
  },
  {
    id: "INV-2024-011",
    date: "2024-11-15",
    amount: 39.99,
    status: "paid" as const,
    plan: "Pro Mensal",
  },
]

export function SubscriptionManagement() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const isPro = user?.plan === "pro"
  const nextBillingDate = new Date()
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  const handleCancelSubscription = async () => {
    setIsCanceling(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    updateUser({ plan: "free", planExpiresAt: undefined })
    setIsCanceling(false)
    setShowCancelDialog(false)

    toast({
      title: "Assinatura cancelada",
      description: "Sua assinatura Pro foi cancelada. Você voltou para o plano Free.",
    })
  }

  const generateInvoicePDF = (invoice: (typeof mockInvoices)[0]) => {
    // In a real app, this would generate and download a PDF
    toast({
      title: "PDF gerado",
      description: `Recibo ${invoice.id} foi baixado com sucesso.`,
    })
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Assinatura</h2>
          <p className="text-muted-foreground">Você está no plano Free</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle>Plano Free</CardTitle>
            </div>
            <CardDescription>Recursos básicos para começar a organizar suas finanças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Dashboard financeiro</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>1 carteira e 2 cartões</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Gerenciamento de transações</span>
              </div>
            </div>

            <Button onClick={() => router.push("/pricing")} className="w-full gap-2">
              <Crown className="h-4 w-4" />
              Fazer upgrade para Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Assinatura</h2>
        <p className="text-muted-foreground">Gerencie seu plano e histórico de pagamentos</p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle>Plano Pro</CardTitle>
            </div>
            <Badge className="bg-primary">Ativo</Badge>
          </div>
          <CardDescription>Acesso completo a todos os recursos avançados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Próxima cobrança</p>
                <p className="text-sm text-muted-foreground">
                  {nextBillingDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Valor mensal</p>
                <p className="text-sm text-muted-foreground">R$ 39,99</p>
              </div>
            </div>
          </div>

          <Button variant="destructive" onClick={() => setShowCancelDialog(true)} className="w-full">
            Cancelar assinatura
          </Button>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Visualize e baixe seus recibos de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {resolvedTheme === "dark" ? (
                      <Image src="/logo-dark.svg" alt="Maná Finance" width={24} height={24} />
                    ) : (
                      <Image src="/logo-light.svg" alt="Maná Finance" width={24} height={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString("pt-BR")} • {invoice.plan}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">R$ {invoice.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      Pago
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => generateInvoicePDF(invoice)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Cancelar assinatura Pro?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>Ao cancelar sua assinatura, você perderá acesso aos seguintes recursos:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Relatórios avançados e insights</li>
                <li>Objetivos financeiros ilimitados</li>
                <li>Integração com WhatsApp</li>
                <li>Carteiras e cartões ilimitados</li>
                <li>Suporte prioritário</li>
              </ul>
              <p className="mt-4 font-medium">Você voltará para o plano Free imediatamente.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCanceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCanceling ? "Cancelando..." : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
