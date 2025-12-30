import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  colorClass?: string
}

export function StatCard({ title, value, icon: Icon, trend, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card className="p-3 md:p-4 lg:p-6 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 md:space-y-2 flex-1 min-w-0 overflow-hidden">
          <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xs md:text-lg lg:text-xl font-bold text-foreground break-words leading-tight">{value}</p>
          {trend && (
            <p
              className={`text-[9px] md:text-xs font-medium ${trend.isPositive ? "text-secondary" : "text-destructive"}`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-lg md:rounded-xl p-1.5 md:p-3 ${colorClass.replace("text-", "bg-")}/10 shrink-0`}>
          <Icon className={`h-3.5 w-3.5 md:h-5 md:w-5 lg:h-6 lg:w-6 ${colorClass}`} />
        </div>
      </div>
    </Card>
  )
}
