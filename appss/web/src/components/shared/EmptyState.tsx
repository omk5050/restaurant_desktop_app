import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

interface EmptyStateProps {
  icon?:        ReactNode
  title:        string
  description?: string
  action?:      ReactNode
  className?:   string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && (
        <div className="mb-4 text-border" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-[1rem] font-black text-text-sec">{title}</p>
      {description && (
        <p className="mt-1.5 text-[0.8125rem] text-text-sec">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
