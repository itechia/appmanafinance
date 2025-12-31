"use client"

import { useState } from "react"
import { Calendar, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ReportFilters } from "@/lib/report-utils"
import type { Transaction } from "@/lib/types/app-types"

interface ReportFiltersComponentProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  transactions: Transaction[]
}

export function ReportFiltersComponent({ filters, onFiltersChange, transactions }: ReportFiltersComponentProps) {
  const [showFilters, setShowFilters] = useState(false)

  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)))
  const uniqueAccounts = Array.from(new Set(transactions.map((t) => t.account)))

  const quickDateRanges = [
    { label: "Este Mês", start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { label: "Mês Passado", start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: "Últimos 3 Meses", start: subMonths(new Date(), 3), end: new Date() },
    { label: "Este Ano", start: startOfYear(new Date()), end: endOfYear(new Date()) },
  ]

  const activeFilterCount =
    (filters.categories.length > 0 ? 1 : 0) + (filters.accounts.length > 0 ? 1 : 0) + (filters.types.length > 0 ? 1 : 0)

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const toggleAccount = (account: string) => {
    const newAccounts = filters.accounts.includes(account)
      ? filters.accounts.filter((a) => a !== account)
      : [...filters.accounts, account]
    onFiltersChange({ ...filters, accounts: newAccounts })
  }

  const toggleType = (type: "income" | "expense" | "transfer") => {
    const newTypes = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type]
    onFiltersChange({ ...filters, types: newTypes })
  }

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      categories: [],
      accounts: [],
      types: [],
    })
  }

  return (
    <Card className="p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Date Ranges */}
        <div className="flex flex-wrap gap-2">
          {quickDateRanges.map((range) => (
            <Button
              key={range.label}
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent"
              onClick={() => onFiltersChange({ ...filters, startDate: range.start, endDate: range.end })}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {range.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
              <Calendar className="h-3 w-3 mr-1" />
              {format(filters.startDate, "dd/MM/yy")} - {format(filters.endDate, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <div>
                <Label className="text-xs mb-2 block">Data Inicial</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && onFiltersChange({ ...filters, startDate: date })}
                  locale={ptBR}
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Data Final</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && onFiltersChange({ ...filters, endDate: date })}
                  locale={ptBR}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced Filters */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
              <Filter className="h-3 w-3" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filtros Avançados</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                    Limpar
                  </Button>
                )}
              </div>

              {/* Type Filter */}
              <div>
                <Label className="text-xs mb-2 block">Tipo de Transação</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type-income"
                      checked={filters.types.includes("income")}
                      onCheckedChange={() => toggleType("income")}
                    />
                    <label htmlFor="type-income" className="text-xs cursor-pointer">
                      Receitas
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type-expense"
                      checked={filters.types.includes("expense")}
                      onCheckedChange={() => toggleType("expense")}
                    />
                    <label htmlFor="type-expense" className="text-xs cursor-pointer">
                      Despesas
                    </label>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-xs mb-2 block">Categorias</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label htmlFor={`category-${category}`} className="text-xs cursor-pointer">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Filter */}
              <div>
                <Label className="text-xs mb-2 block">Contas</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueAccounts.map((account) => (
                    <div key={account} className="flex items-center space-x-2">
                      <Checkbox
                        id={`account-${account}`}
                        checked={filters.accounts.includes(account)}
                        onCheckedChange={() => toggleAccount(account)}
                      />
                      <label htmlFor={`account-${account}`} className="text-xs cursor-pointer">
                        {account}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          {filters.types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs gap-1">
              {type === "income" ? "Receitas" : "Despesas"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleType(type)} />
            </Badge>
          ))}
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="text-xs gap-1">
              {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(category)} />
            </Badge>
          ))}
          {filters.accounts.map((account) => (
            <Badge key={account} variant="secondary" className="text-xs gap-1">
              {account}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleAccount(account)} />
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
