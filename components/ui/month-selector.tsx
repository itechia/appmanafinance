"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSelectorProps {
    currentDate: Date
    onDateChange: (date: Date) => void
    disabled?: boolean
}

export function MonthSelector({ currentDate, onDateChange, disabled }: MonthSelectorProps) {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

    const previousMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        onDateChange(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        onDateChange(new Date(year, month + 1, 1))
    }

    return (
        <div className={`flex items-center gap-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={previousMonth} disabled={disabled}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center tabular-nums">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth} disabled={disabled}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
