"use client"

import { useState } from "react"
import { Plus, Filter, Download, Search } from "lucide-react"
import { addMonths, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/user-context"
import { useSearchParams } from "next/navigation"

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("category") || ""

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  // Filter States
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [accountFilter, setAccountFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("next-3-months") // Default per request
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const { toast } = useToast()

  // Filter Actions
  const filters = {
    type: typeFilter,
    category: categoryFilter,
    account: accountFilter,
    period: periodFilter,
    dateRange: dateRange,
    setType: setTypeFilter,
    setCategory: setCategoryFilter,
    setAccount: setAccountFilter,
    setPeriod: setPeriodFilter,
    setDateRange: setDateRange,
    clearFilters: () => {
      setTypeFilter("all")
      setCategoryFilter("all")
      setAccountFilter("all")
      setPeriodFilter("next-3-months")
      setDateRange(undefined)
      toast({
        title: "Filtros redefinidos",
        description: "Os filtros voltaram ao padrão.",
      })
    }
  }

  const handleExport = () => {
    toast({
      title: "Exportando transações",
      description: "Seu arquivo CSV será baixado em instantes.",
    })
  }

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-xs md:text-base text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button className="gap-2 bg-primary hover:bg-primary/90 h-9 px-3" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
            <Button
              variant="outline"
              className={`gap-2 h-9 px-3 bg-transparent ${isFilterOpen ? "bg-muted" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            <Button variant="outline" className="gap-2 h-9 px-3 bg-transparent" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>
      </div>

      {isFilterOpen && <TransactionFilters filters={filters} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar transações..."
          className="pl-9 h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <TransactionList
        searchQuery={searchQuery}
        filters={{
          type: typeFilter,
          category: categoryFilter,
          account: accountFilter,
          period: periodFilter,
          dateRange: dateRange,
        }}
      />

      <TransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
