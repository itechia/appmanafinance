"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// import { storageHelpers } from "@/lib/storage-helpers"

interface TourStep {
  target: string
  title: string
  content: string
  placement?: "top" | "bottom" | "left" | "right"
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: "Bem-vindo ao Maná Finance!",
    content:
      "Sua jornada para prosperidade financeira começa aqui. Vamos fazer um tour rápido pelas principais funcionalidades para você aproveitar ao máximo o aplicativo.",
    placement: "bottom",
  },
  {
    target: '[data-tour="balance"]',
    title: "Visão Geral Financeira",
    content:
      "Aqui você acompanha seu saldo total, receitas e despesas em tempo real. Todos os valores são calculados automaticamente com base em suas transações, carteiras e cartões.",
    placement: "bottom",
  },
  {
    target: '[data-tour="transactions"]',
    title: "Gerenciar Transações",
    content:
      "Registre todas as suas movimentações financeiras: receitas, despesas e transferências. Você pode categorizar cada transação para ter um controle detalhado de onde seu dinheiro está indo.",
    placement: "right",
  },
  {
    target: '[data-tour="cards"]',
    title: "Cartões e Carteiras",
    content:
      "Gerencie seus cartões de crédito, débito e carteiras digitais em um só lugar. O sistema controla automaticamente limites, faturas e saldos disponíveis.",
    placement: "right",
  },
  {
    target: '[data-tour="budgets"]',
    title: "Orçamentos Inteligentes",
    content:
      "Defina orçamentos por categoria e acompanhe seus gastos. Receba alertas quando estiver próximo do limite e tome decisões financeiras mais conscientes.",
    placement: "right",
  },
  {
    target: '[data-tour="reports"]',
    title: "Relatórios Avançados (PRO)",
    content:
      "Acesse análises detalhadas, gráficos e insights sobre suas finanças. Visualize tendências, padrões de gastos e receba recomendações personalizadas. Recurso exclusivo do plano Pro.",
    placement: "right",
  },
  {
    target: '[data-tour="goals"]',
    title: "Objetivos Financeiros (PRO)",
    content:
      "Defina metas financeiras e acompanhe seu progresso. O sistema calcula automaticamente quanto você precisa poupar mensalmente para alcançar seus objetivos. Recurso exclusivo do plano Pro.",
    placement: "right",
  },
  {
    target: '[data-tour="calendar"]',
    title: "Calendário Financeiro",
    content:
      "Visualize todas as suas transações e vencimentos em um calendário interativo. Nunca mais perca um pagamento importante ou uma data de vencimento!",
    placement: "left",
  },
  {
    target: '[data-tour="dashboard"]',
    title: "Pronto para Começar!",
    content:
      "Agora você conhece as principais funcionalidades do Maná Finance. Comece adicionando suas primeiras transações, cartões e orçamentos. Boa jornada rumo à prosperidade financeira!",
    placement: "bottom",
  },
]

const TOUR_COMPLETED_KEY = "mana_tour_completed"

interface OnboardingTourProps {
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const tourCompleted = window.localStorage.getItem("mana_tour_completed")
    if (!tourCompleted) {
      setTimeout(() => {
        setIsOpen(true)
        updateTargetElement(0)
      }, 1500)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateTargetElement(currentStep)
    }
  }, [currentStep, isOpen])

  useEffect(() => {
    if (isOpen && targetElement) {
      calculateCardPosition()
      window.addEventListener("resize", calculateCardPosition)
      return () => window.removeEventListener("resize", calculateCardPosition)
    }
  }, [targetElement, isOpen])

  const calculateCardPosition = () => {
    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    const step = TOUR_STEPS[currentStep]
    const cardWidth = window.innerWidth < 640 ? window.innerWidth - 32 : 384 // 96 = w-96
    const cardHeight = 300 // Approximate height

    let top = 0
    let left = 0

    switch (step.placement) {
      case "bottom":
        top = rect.bottom + 16
        left = rect.left + rect.width / 2 - cardWidth / 2
        break
      case "top":
        top = rect.top - cardHeight - 16
        left = rect.left + rect.width / 2 - cardWidth / 2
        break
      case "right":
        top = rect.top + rect.height / 2 - cardHeight / 2
        left = rect.right + 16
        break
      case "left":
        top = rect.top + rect.height / 2 - cardHeight / 2
        left = rect.left - cardWidth - 16
        break
      default:
        top = rect.bottom + 16
        left = rect.left + rect.width / 2 - cardWidth / 2
    }

    // Keep card within viewport
    const padding = 16
    top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding))

    setCardPosition({ top, left })
  }

  const updateTargetElement = (stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex]
    const element = document.querySelector(step.target) as HTMLElement
    setTargetElement(element)

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.style.position = "relative"
      element.style.zIndex = "9999"
    }
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    window.localStorage.setItem("mana_tour_completed", "true")
    setIsOpen(false)
    TOUR_STEPS.forEach((step) => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        element.style.position = ""
        element.style.zIndex = ""
      }
    })
    onComplete?.()
  }

  if (!isOpen || !targetElement) return null

  const step = TOUR_STEPS[currentStep]
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm" onClick={handleSkip} />

      {/* Tour Card */}
      <Card
        className="fixed z-[9999] w-[calc(100vw-2rem)] sm:w-96 p-4 sm:p-6 shadow-2xl border-2 border-primary/20"
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold truncate">{step.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.content}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip} className="h-8 w-8 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Passo {currentStep + 1} de {TOUR_STEPS.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 gap-2">
            <Button variant="ghost" onClick={handleSkip} className="text-xs sm:text-sm h-9 px-3">
              Pular tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="h-9 px-3 text-xs sm:text-sm bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
              )}
              <Button onClick={handleNext} className="h-9 px-3 text-xs sm:text-sm">
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">Próximo</span>
                    <span className="sm:hidden">Avançar</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Concluir"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
