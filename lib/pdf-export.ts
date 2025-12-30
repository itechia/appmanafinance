import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { type ReportMetrics, formatCurrency, formatPercentage } from "./report-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function exportReportToPDF(
  metrics: ReportMetrics,
  filters: { startDate: Date; endDate: Date },
  chartImages: { [key: string]: string },
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Header
  pdf.setFillColor(40, 167, 69)
  pdf.rect(0, 0, pageWidth, 40, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("Maná Finance", margin, 20)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text("Relatório Financeiro Detalhado", margin, 30)

  yPosition = 50

  // Period
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text("Período do Relatório:", margin, yPosition)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `${format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })}`,
    margin + 45,
    yPosition,
  )
  pdf.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth - margin - 60,
    yPosition,
  )

  yPosition += 10

  // Executive Summary
  checkNewPage(60)
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(40, 167, 69)
  pdf.text("Resumo Executivo", margin + 2, yPosition + 6)
  yPosition += 12

  // Summary cards
  const cardWidth = (pageWidth - 2 * margin - 6) / 4
  const summaryData = [
    { label: "Receitas Totais", value: formatCurrency(metrics.totalIncome), color: [162, 209, 156] },
    { label: "Despesas Totais", value: formatCurrency(metrics.totalExpense), color: [212, 175, 55] },
    { label: "Saldo Líquido", value: formatCurrency(metrics.netBalance), color: [40, 167, 69] },
    { label: "Taxa de Poupança", value: formatPercentage(metrics.savingsRate), color: [23, 162, 184] },
  ]

  summaryData.forEach((item, index) => {
    const x = margin + index * (cardWidth + 2)
    pdf.setFillColor(item.color[0], item.color[1], item.color[2])
    pdf.rect(x, yPosition, cardWidth, 20, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "normal")
    pdf.text(item.label, x + 2, yPosition + 5)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(item.value, x + 2, yPosition + 13)
  })

  yPosition += 25

  // Key Metrics
  checkNewPage(40)
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(40, 167, 69)
  pdf.text("Indicadores Chave", margin + 2, yPosition + 6)
  yPosition += 12

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  const keyMetrics = [
    `Total de Transações: ${metrics.transactionCount}`,
    `Média por Transação: ${formatCurrency(metrics.averageTransaction)}`,
    `Média Diária de Receitas: ${formatCurrency(metrics.dailyAverage.income)}`,
    `Média Diária de Despesas: ${formatCurrency(metrics.dailyAverage.expense)}`,
  ]

  keyMetrics.forEach((metric, index) => {
    pdf.text(`• ${metric}`, margin + 5, yPosition + index * 6)
  })
  yPosition += keyMetrics.length * 6 + 5

  // Largest Transactions
  if (metrics.largestIncome || metrics.largestExpense) {
    checkNewPage(30)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(40, 167, 69)
    pdf.text("Transações Destacadas", margin + 2, yPosition + 6)
    yPosition += 12

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    if (metrics.largestIncome) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Maior Receita:", margin + 5, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${metrics.largestIncome.description} - ${formatCurrency(Math.abs(metrics.largestIncome.amount))}`,
        margin + 35,
        yPosition,
      )
      yPosition += 6
    }
    if (metrics.largestExpense) {
      pdf.setFont("helvetica", "bold")
      pdf.text("Maior Despesa:", margin + 5, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${metrics.largestExpense.description} - ${formatCurrency(Math.abs(metrics.largestExpense.amount))}`,
        margin + 35,
        yPosition,
      )
      yPosition += 6
    }
    yPosition += 5
  }

  // Category Breakdown Table
  if (metrics.categoryBreakdown.length > 0) {
    checkNewPage(50)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(40, 167, 69)
    pdf.text("Análise por Categoria", margin + 2, yPosition + 6)
    yPosition += 12

    autoTable(pdf, {
      startY: yPosition,
      head: [["Categoria", "Valor Total", "% do Total", "Transações"]],
      body: metrics.categoryBreakdown
        .slice(0, 15)
        .map((cat) => [
          cat.category,
          formatCurrency(cat.amount),
          formatPercentage(cat.percentage),
          cat.count.toString(),
        ]),
      theme: "striped",
      headStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 10
  }

  // Monthly Trend Table
  if (metrics.monthlyTrend.length > 0) {
    checkNewPage(50)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(40, 167, 69)
    pdf.text("Evolução Mensal", margin + 2, yPosition + 6)
    yPosition += 12

    autoTable(pdf, {
      startY: yPosition,
      head: [["Mês", "Receitas", "Despesas", "Saldo"]],
      body: metrics.monthlyTrend.map((month) => [
        month.month,
        formatCurrency(month.income),
        formatCurrency(month.expense),
        formatCurrency(month.balance),
      ]),
      theme: "striped",
      headStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 10
  }

  // Account Breakdown
  if (metrics.accountBreakdown.length > 0) {
    checkNewPage(50)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(40, 167, 69)
    pdf.text("Análise por Conta", margin + 2, yPosition + 6)
    yPosition += 12

    autoTable(pdf, {
      startY: yPosition,
      head: [["Conta", "Receitas", "Despesas", "Saldo"]],
      body: metrics.accountBreakdown.map((acc) => [
        acc.account,
        formatCurrency(acc.income),
        formatCurrency(acc.expense),
        formatCurrency(acc.balance),
      ]),
      theme: "striped",
      headStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 10
  }

  // User Breakdown (if multi-user)
  if (metrics.userBreakdown.length > 1) {
    checkNewPage(50)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F")
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(40, 167, 69)
    pdf.text("Análise por Usuário", margin + 2, yPosition + 6)
    yPosition += 12

    autoTable(pdf, {
      startY: yPosition,
      head: [["Usuário", "Receitas", "Despesas", "Transações"]],
      body: metrics.userBreakdown.map((user) => [
        user.userName,
        formatCurrency(user.income),
        formatCurrency(user.expense),
        user.transactions.toString(),
      ]),
      theme: "striped",
      headStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 10
  }

  // Footer on all pages
  const pageCount = (pdf as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" })
    pdf.text("Maná Finance - Relatório Confidencial", margin, pageHeight - 10)
  }

  // Save PDF
  const fileName = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
  pdf.save(fileName)
}
