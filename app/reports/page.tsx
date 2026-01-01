"use client"

import { useState, useRef, useEffect } from "react"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/lib/user-context"
import {
  calculateReportMetrics,
  filterTransactions,
  formatCurrency,
  formatPercentage,
  type ReportFilters,
} from "@/lib/report-utils"
import { exportReportToPDF } from "@/lib/pdf-export"
import { ReportFiltersComponent } from "@/components/reports/report-filters"
import { CategoryChart } from "@/components/reports/category-chart"
import { MonthlyTrendChart } from "@/components/reports/monthly-trend-chart"
import { TransactionTable } from "@/components/reports/transaction-table"
import { startOfMonth, endOfMonth, differenceInMonths, subMonths } from "date-fns"
import { toast } from "sonner"
import {
  calculateFinancialHealth,
  analyzeBudgets,
  analyzeGoals,
  analyzeSpendingPatterns,
  generateFinancialInsights,
} from "@/lib/financial-health"
import { ProGate } from "@/components/ui/pro-gate"


export default function ReportsPage() {
  const {
    currentUser,
    budgets,
    transactions: contextTransactions,
    goals: contextGoals,
    cards: contextCards,
    categories: contextCategories,
  } = useUser()
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(subMonths(new Date(), 3)), // Changed to last 3 months default
    endDate: endOfMonth(new Date()),
    userIds: [], // Default to ALL users to ensure data visibility
    categories: [],
    accounts: [],
    types: [],
  })

  // Use useEffect to update startDate only on first mount if needed,
  // but initial state is fine.
  // We need to ensure filters update if currentUser loads late, but userIds is set.

  const transactions = contextTransactions
  const goals = contextGoals
  const cards = contextCards
  const categories = contextCategories

  const hasTransactions = transactions && transactions.length > 0
  const hasAnyData = hasTransactions || (budgets && budgets.length > 0) || (goals && goals.length > 0)

  return (
    <ProGate featureName="Relatórios Avançados" description="Desbloqueie análises detalhadas, gráficos de tendências e insights automáticos sobre sua saúde financeira.">
      {!hasTransactions ? (
        <div className="space-y-4 md:space-y-6 pb-20 lg:pb-6 px-2 sm:px-4 md:px-6 max-w-full overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">
                  Relatório Financeiro
                </h1>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">PRO</span>
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Análise detalhada e insights estratégicos</p>
            </div>
          </div>

          {/* Empty State */}
          <Card className="p-8 md:p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Relatórios em Breve</h3>
                <p className="text-sm text-muted-foreground">
                  Seus relatórios financeiros estarão disponíveis assim que você começar a usar o aplicativo.
                </p>
                <p className="text-sm text-muted-foreground">
                  Adicione suas primeiras transações para visualizar análises detalhadas, gráficos e insights sobre suas
                  finanças.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button asChild className="gap-2">
                  <a href="/transactions">
                    <DollarSign className="h-4 w-4" />
                    Adicionar Transação
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-transparent">
                  <a href="/budgets">
                    <Target className="h-4 w-4" />
                    Configurar Orçamentos
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <ReportsContent
          currentUser={currentUser}
          budgets={budgets}
          transactions={transactions}
          goals={goals}
          cards={cards}
          categories={categories}
          filters={filters}
          setFilters={setFilters}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
          reportRef={reportRef}
        />
      )}
    </ProGate>
  )
}

function ReportsContent({
  currentUser,
  budgets,
  transactions,
  goals,
  cards,
  categories,
  filters,
  setFilters,
  isExporting,
  setIsExporting,
  reportRef,
}: any) {
  const metrics = calculateReportMetrics(transactions, filters, cards)
  const filteredTransactions = filterTransactions(transactions, filters, cards)

  const combinedHealthScore = calculateFinancialHealth(
    transactions,
    budgets,
    goals,
    cards,
    currentUser.id,
    filters.startDate,
    filters.endDate
  )

  const budgetAnalysis = analyzeBudgets(transactions, budgets, currentUser.id, filters.startDate, filters.endDate, cards)
  const goalAnalysis = analyzeGoals(goals, transactions, currentUser.id)
  const spendingPatterns = analyzeSpendingPatterns(transactions, currentUser.id, filters.startDate, filters.endDate, cards)
  const insights = generateFinancialInsights(budgetAnalysis, goalAnalysis, spendingPatterns, combinedHealthScore)

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportReportToPDF(metrics, filters, {})
      toast.success("Relatório exportado com sucesso!")
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
      toast.error("Erro ao exportar relatório")
    } finally {
      setIsExporting(false)
    }
  }

  const getScoreInfo = (score: number) => {
    if (score >= 80) return { color: "text-[#A2D19C]", bg: "bg-[#A2D19C]/10", label: "Excelente", icon: CheckCircle2 }
    if (score >= 60) return { color: "text-[#17a2b8]", bg: "bg-[#17a2b8]/10", label: "Bom", icon: TrendingUp }
    if (score >= 40) return { color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", label: "Regular", icon: AlertTriangle }
    return { color: "text-destructive", bg: "bg-destructive/10", label: "Crítico", icon: AlertTriangle }
  }

  const overallScoreInfo = getScoreInfo(combinedHealthScore.overall)

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-6 px-2 sm:px-4 md:px-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">
              Relatório Financeiro
            </h1>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
              <Crown className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">PRO</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Análise detalhada e insights estratégicos</p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm h-9 px-3 shrink-0"
        >
          <Download className="h-3 w-3 md:h-4 md:w-4" />
          {isExporting ? "Exportando..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Filters */}
      <ReportFiltersComponent filters={filters} onFiltersChange={setFilters} transactions={transactions} />

      <div ref={reportRef} className="space-y-4 md:space-y-6">
        {/* Score de Saúde Financeira */}
        <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground">Score de Saúde Financeira</h2>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Combined Score */}
            <div
              className={`${overallScoreInfo.bg} backdrop-blur rounded-lg p-3 md:p-4 border sm:col-span-2 lg:col-span-1`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Score Geral</p>
                <Badge variant="outline" className={`${overallScoreInfo.color} border-current text-xs`}>
                  {overallScoreInfo.label}
                </Badge>
              </div>
              <div className="flex items-end gap-3">
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${overallScoreInfo.color}`}>
                  {combinedHealthScore.overall}
                </p>
                <p className="text-base sm:text-lg text-muted-foreground mb-1">/100</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Poupança</p>
                  <p className="font-semibold">{combinedHealthScore.savings}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Orçamentos</p>
                  <p className="font-semibold">{combinedHealthScore.budgetCompliance}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Metas</p>
                  <p className="font-semibold">{combinedHealthScore.goalProgress}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dívidas</p>
                  <p className="font-semibold">{combinedHealthScore.debtManagement}/100</p>
                </div>
              </div>
            </div>

            {/* Current User Info */}
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 md:p-4 border sm:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Usuário Atual</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-semibold truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Análise baseada no período de {Math.max(1, differenceInMonths(filters.endDate, filters.startDate) + 1)} mês(es)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Análise de Desempenho (Novo) */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4 border-l-4 border-l-[#17a2b8]">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[#17a2b8]" />
              <h3 className="text-sm font-bold">Burn Rate Diário</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.dailyAverage.expense)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Gasto médio por dia no período selecionado.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-[#A2D19C]">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-[#A2D19C]" />
              <h3 className="text-sm font-bold">Taxa de Sobrevivência</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.dailyAverage.expense > 0
                ? `${Math.floor(metrics.netBalance / metrics.dailyAverage.expense)} dias`
                : '∞'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Quanto tempo seu saldo excedente duraria com este ritmo.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Eficiência Financeira</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatPercentage(metrics.savingsRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.savingsRate >= 20 ? 'Alta Eficiência' : metrics.savingsRate >= 10 ? 'Boa Eficiência' : 'Baixa Eficiência'}
            </p>
          </Card>
        </div>

        {/* Insights Principais */}
        {insights.length > 0 && (
          <Card className="p-3 sm:p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Insights Principais</span>
            </h3>
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 md:p-4 rounded-lg border ${insight.type === "error"
                    ? "bg-destructive/10 border-destructive/20"
                    : insight.type === "warning"
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/20"
                      : insight.type === "success"
                        ? "bg-[#A2D19C]/10 border-[#A2D19C]/20"
                        : "bg-muted/50"
                    }`}
                >
                  <p className="text-xs md:text-sm font-semibold mb-1 break-words">{insight.title}</p>
                  <p className="text-xs text-muted-foreground break-words">{insight.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Análise de Orçamentos */}
        {budgetAnalysis.length > 0 && (
          <Card className="p-3 sm:p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Análise de Orçamentos</span>
            </h3>
            <div className="space-y-3">
              {budgetAnalysis.map((budget) => (
                <div key={budget.budgetId} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-xs md:text-sm font-semibold break-words">{budget.category}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${budget.status === "exceeded"
                        ? "border-destructive text-destructive"
                        : budget.status === "critical"
                          ? "border-[#D4AF37] text-[#D4AF37]"
                          : budget.status === "warning"
                            ? "border-[#17a2b8] text-[#17a2b8]"
                            : budget.status === "good"
                              ? "border-[#A2D19C] text-[#A2D19C]"
                              : "bg-muted/50"
                        }`}
                    >
                      {budget.status === "exceeded"
                        ? "Excedido"
                        : budget.status === "critical"
                          ? "Crítico"
                          : budget.status === "warning"
                            ? "Atenção"
                            : budget.status === "good"
                              ? "Bom"
                              : "Excelente"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs gap-2 flex-wrap">
                      <span className="text-muted-foreground break-words">
                        Gasto: {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </span>
                      <span className="font-semibold shrink-0">{budget.percentUsed.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(budget.percentUsed, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground break-words">{budget.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Análise de Metas */}
        {goalAnalysis.length > 0 && (
          <Card className="p-3 sm:p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Análise de Metas</span>
            </h3>
            <div className="space-y-3">
              {goalAnalysis.map((goal) => (
                <div key={goal.goalId} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-xs md:text-sm font-semibold break-words">{goal.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${goal.onTrack ? "border-[#A2D19C] text-[#A2D19C]" : "border-[#D4AF37] text-[#D4AF37]"}`}
                    >
                      {goal.onTrack ? "No Ritmo" : "Fora do Ritmo"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs gap-2 flex-wrap">
                      <span className="text-muted-foreground break-words">
                        Progresso: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className="font-semibold shrink-0">{goal.percentComplete.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(goal.percentComplete, 100)} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <p className="text-muted-foreground">Dias Restantes</p>
                        <p className="font-semibold">{goal.daysRemaining}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contribuição Mensal</p>
                        <p className="font-semibold break-words">{formatCurrency(goal.requiredMonthlyContribution)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 break-words">{goal.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Padrões de Gastos */}
        {spendingPatterns.length > 0 && (
          <Card className="p-3 sm:p-4 md:p-6">
            <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Padrões de Gastos</span>
            </h3>
            <div className="space-y-3">
              {spendingPatterns.slice(0, 8).map((pattern) => (
                <div
                  key={pattern.category}
                  className={`p-3 rounded-lg ${pattern.isProblematic ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20" : "bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-xs md:text-sm font-semibold break-words">{pattern.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${pattern.trend === "increasing"
                          ? "border-destructive text-destructive"
                          : pattern.trend === "decreasing"
                            ? "border-[#A2D19C] text-[#A2D19C]"
                            : "border-muted-foreground text-muted-foreground"
                          }`}
                      >
                        {pattern.trend === "increasing"
                          ? "↑ Aumentando"
                          : pattern.trend === "decreasing"
                            ? "↓ Diminuindo"
                            : "→ Estável"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold break-words">{formatCurrency(pattern.totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Média</p>
                      <p className="font-semibold break-words">{formatCurrency(pattern.averageTransaction)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">% do Total</p>
                      <p className="font-semibold">{pattern.percentOfTotal.toFixed(0)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground break-words">{pattern.recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Resumo Executivo */}
        <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground">Resumo Executivo</h2>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 md:p-4 border">
              <p className="text-xs text-muted-foreground mb-1">Receitas Totais</p>
              <p className="text-xl sm:text-2xl font-bold text-[#A2D19C] break-words">
                {formatCurrency(metrics.totalIncome)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-[#A2D19C] shrink-0" />
                <span className="text-xs text-muted-foreground">{metrics.transactionCount} transações</span>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur rounded-lg p-3 md:p-4 border">
              <p className="text-xs text-muted-foreground mb-1">Despesas Totais</p>
              <p className="text-xl sm:text-2xl font-bold text-[#D4AF37] break-words">
                {formatCurrency(metrics.totalExpense)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-[#D4AF37] shrink-0" />
                <span className="text-xs text-muted-foreground break-words">
                  Média: {formatCurrency(metrics.dailyAverage.expense)}/dia
                </span>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur rounded-lg p-3 md:p-4 border">
              <p className="text-xs text-muted-foreground mb-1">Saldo Líquido</p>
              <p
                className={`text-xl sm:text-2xl font-bold break-words ${metrics.netBalance >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatCurrency(metrics.netBalance)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <DollarSign className="h-3 w-3 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {metrics.netBalance >= 0 ? "Superávit" : "Déficit"}
                </span>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur rounded-lg p-3 md:p-4 border">
              <p className="text-xs text-muted-foreground mb-1">Taxa de Poupança</p>
              <p className="text-xl sm:text-2xl font-bold text-[#17a2b8]">{formatPercentage(metrics.savingsRate)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-[#17a2b8] shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {metrics.savingsRate >= 20 ? "Excelente" : metrics.savingsRate >= 10 ? "Bom" : "Atenção"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Gráficos */}
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          <MonthlyTrendChart data={metrics.monthlyTrend} />
          <CategoryChart
            expenseCategories={metrics.topExpenseCategories}
            incomeCategories={metrics.topIncomeCategories}
            categories={categories}
          />
        </div>

        {/* Detalhes das Transações */}
        <TransactionTable transactions={filteredTransactions} />
      </div>
    </div>
  )
}
