import { cn } from "@/lib/cn"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-border/40", className)}
      aria-hidden="true"
    />
  )
}

export function TableCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-2">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function MenuTileSkeleton() {
  return (
    <div className={cn("flex min-h-[13.75rem] flex-col rounded-3xl border-2 border-border bg-card p-3")}>
      <Skeleton className="h-[6.25rem] w-full rounded-[1.125rem]" />
      <Skeleton className="mt-4 h-5 w-3/4 mx-auto" />
      <Skeleton className="mt-2 h-4 w-1/2 mx-auto" />
      <div className="mt-4 flex items-center justify-center gap-4">
        <Skeleton className="size-9 rounded-[0.75rem]" />
        <Skeleton className="h-6 w-6" />
        <Skeleton className="size-9 rounded-[0.75rem]" />
      </div>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <Skeleton className="h-6 w-1/2 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
