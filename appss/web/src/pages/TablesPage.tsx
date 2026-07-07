import { useMemo, useState, useEffect, useRef, type ReactNode } from "react"
import {
  CalendarDays, CreditCard, ReceiptText, Search, ShoppingBag, Users, Utensils,
} from "lucide-react"
import { Badge, Button, Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { type DiningTable, type TableStatus, tables } from "@/mocks/pos"
import { money } from "@/utils/currency"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { EmptyState } from "@/components/shared/EmptyState"
import { TableCardSkeleton, CardSkeleton } from "@/components/shared/Skeleton"

// ── Status meta ─────────────────────────────────────────────────────
const statusMeta: Record<TableStatus, { label: string; border: string; bg: string; text: string; dot: string }> = {
  active: { bg: "bg-primary-light", border: "border-primary",   dot: "bg-primary",   label: "Active",     text: "text-primary-dark" },
  bill:   { bg: "bg-blue-light",    border: "border-blue",      dot: "bg-blue",      label: "Bill Ready", text: "text-blue" },
  empty:  { bg: "bg-card",         border: "border-border",    dot: "bg-gray",      label: "Empty",      text: "text-text-sec" },
  paid:   { bg: "bg-green-light",   border: "border-green",     dot: "bg-green",     label: "Paid",       text: "text-green" },
}

const sectionMeta = [
  { icon: Utensils,    name: "Restaurant",     tone: "bg-primary-light text-primary" },
  { icon: Users,       name: "Family Section", tone: "bg-green-light text-green" },
  { icon: ShoppingBag, name: "Takeaway",       tone: "bg-purple-light text-purple" },
] as const

const STATUS_FILTERS: Array<{ value: TableStatus | "all"; label: string }> = [
  { value: "all",    label: "All" },
  { value: "empty",  label: "Empty" },
  { value: "active", label: "Active" },
  { value: "bill",   label: "Bill Ready" },
  { value: "paid",   label: "Paid" },
]

// ── Sub-components ──────────────────────────────────────────────────

const HeroPanel = ({ badge, kicker, title, value, valueLabel }: {
  badge: string; kicker: string; title: string; value: string; valueLabel?: string
}) => (
  <section className="rounded-2xl bg-espresso px-5 py-4 text-white shadow-warm-lg">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[0.625rem] font-black uppercase tracking-[1.5px] text-primary-mid">{kicker}</p>
        <h2 className="mt-1 text-[1.875rem] font-black leading-none text-white">{title}</h2>
        {valueLabel && (
          <>
            <p className="mt-6 text-[0.6875rem] text-white/60">{valueLabel}</p>
            <p className="mt-0.5 text-[1.875rem] font-black leading-none tabular-nums">{value}</p>
            <p className="mt-1.5 text-[0.75rem] font-bold text-green">↑ 25% vs yesterday</p>
          </>
        )}
        {!valueLabel && <p className="mt-2 max-w-md text-[0.875rem] font-black">{value}</p>}
      </div>
      <div className="rounded-xl bg-primary px-4 py-3 text-center">
        <p className="text-[1.5rem] font-black leading-none">{badge.split(" ")[0]}</p>
        <p className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-wide">{badge.split(" ").slice(1).join(" ")}</p>
      </div>
    </div>
  </section>
)

const MetricCard = ({ icon, label, tone, value }: {
  icon: ReactNode; label: string; tone: string; value: string
}) => (
  <Card className="flex flex-col items-center gap-2.5 p-4 text-center transition-shadow hover:shadow-warm-lg">
    <span className={cn("flex size-9 items-center justify-center rounded-full", tone)}>{icon}</span>
    <p className={cn("text-[1.75rem] font-black leading-none tabular-nums", tone.split(" ")[0])}>{value}</p>
    <p className="text-[0.75rem] font-semibold text-text-sec">{label}</p>
  </Card>
)

const TableRowButton = ({
  onClick, table, selected,
}: { onClick: () => void; table: DiningTable; selected?: boolean }) => {
  const meta = statusMeta[table.status]
  return (
    <button
      className={cn(
        "group flex items-center gap-2.5 rounded-xl p-1.5 text-left",
        "transition-[background-color,box-shadow] duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected
          ? "bg-primary-light ring-2 ring-primary"
          : "hover:bg-panel active:scale-[0.98]",
      )}
      onClick={onClick}
      type="button"
      aria-pressed={selected}
    >
      {/* Table number circle */}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-[0.8125rem] font-black tabular-nums",
          "transition-[border-color,background-color] duration-150",
          meta.border, meta.text,
          selected ? meta.bg : "bg-card",
        )}
      >
        {table.name.replace(/[A-Z]/g, "")}
      </span>

      {/* Labels */}
      <span className="min-w-0">
        <span className={cn("block text-[0.8125rem] font-bold leading-tight", meta.text)}>
          {meta.label}
        </span>
        <span className="block text-[0.6875rem] text-text-sec">
          {table.seats} seats
        </span>
      </span>
    </button>
  )
}

// ── Main component ──────────────────────────────────────────────────
interface TablesPageProps {
  onOpenTable: (table: DiningTable) => void
}

export function TablesPage({ onOpenTable }: TablesPageProps) {
  const [search,        setSearch]        = useState("")
  const [statusFilter,  setStatusFilter]  = useState<TableStatus | "all">("all")
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  useKeyboardShortcuts([
    { key: "f", ctrl: true, action: () => searchRef.current?.focus() },
  ])

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchSearch = search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.section.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const grouped = useMemo(() =>
    sectionMeta.map(section => ({
      ...section,
      tables: filteredTables.filter(t => t.section === section.name),
    })),
  [filteredTables])

  const counts = useMemo(() => ({
    active: tables.filter(t => t.status === "active").length,
    bill:   tables.filter(t => t.status === "bill").length,
    paid:   tables.filter(t => t.status === "paid").length,
    empty:  tables.filter(t => t.status === "empty").length,
  }), [])

  const handleOpenTable = (table: DiningTable) => {
    setSelectedTable(table.id)
    onOpenTable(table)
  }

  const totalResults = filteredTables.length

  return (
    <>
      <Header
        title="Tables"
        trailing={<Badge label={`${counts.active + counts.bill} live orders`} tone="gray" />}
      />

      <main className="mx-auto max-w-[80rem] px-4 py-4">

        {/* Hero */}
        <HeroPanel
          badge="13 orders"
          kicker="Dining Room Live"
          title="Hotel Grand"
          value={money.format(575)}
          valueLabel="Today Sales"
        />

        {/* Metric cards */}
        <section className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<Utensils size={16} strokeWidth={2} />}    label="Active"    tone="text-primary bg-primary-light" value={String(counts.active)} />
          <MetricCard icon={<ReceiptText size={16} strokeWidth={2} />} label="Bill Ready" tone="text-blue bg-blue-light"       value={String(counts.bill)} />
          <MetricCard icon={<CreditCard size={16} strokeWidth={2} />}  label="Paid"       tone="text-green bg-green-light"     value={String(counts.paid)} />
          <MetricCard icon={<CalendarDays size={16} strokeWidth={2} />} label="Open"      tone="text-purple bg-purple-light"   value={String(counts.empty)} />
        </section>

        {/* Search + Filter */}
        <section className="mt-3 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[13rem] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60"
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tables… (Ctrl+F)"
              aria-label="Search tables"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[0.8125rem] text-text outline-none placeholder:text-text-sec/50 transition-[border-color] focus:border-primary"
            />
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(f => {
              const meta = f.value === "all" ? null : statusMeta[f.value as TableStatus]
              const isSelected = statusFilter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.75rem] font-bold",
                    "transition-[background-color,border-color,color] duration-150 ease-out",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                    "active:scale-95",
                    isSelected
                      ? meta
                        ? cn(meta.bg, meta.border, meta.text)
                        : "border-primary bg-primary-light text-primary-dark"
                      : "border-border bg-card text-text-sec hover:bg-panel",
                  )}
                  aria-pressed={isSelected}
                >
                  {meta && <span className={cn("size-2 rounded-full", meta.dot)} />}
                  {f.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Section header */}
        <section className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[1.375rem] font-black leading-tight text-text">Tables</h2>
            <p className="mt-0.5 text-[0.75rem] text-text-sec">
              {totalResults === tables.length
                ? `${tables.length} tables total`
                : `${totalResults} of ${tables.length} tables`}
            </p>
          </div>
        </section>

        {/* Tables grid */}
        {loading ? (
          <section className="mt-3 grid gap-3 xl:grid-cols-3">
            {[0, 1, 2].map(i => <CardSkeleton key={i} className="min-h-[15rem]" />)}
          </section>
        ) : totalResults === 0 ? (
          <section className="mt-3">
            <Card className="p-6">
              <EmptyState
                icon={<Utensils size={48} strokeWidth={1} />}
                title="No tables found"
                description={
                  search
                    ? `No tables match "${search}". Try a different search.`
                    : "No tables match the selected filter."
                }
                action={
                  <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("all") }}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          </section>
        ) : (
          <section className="mt-3 grid gap-3 xl:grid-cols-3">
            {grouped.map(section => {
              const Icon = section.icon
              if (section.tables.length === 0) return null
              return (
                <Card className="p-4" key={section.name}>
                  {/* Section header */}
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", section.tone)}>
                      <Icon size={15} strokeWidth={2.5} />
                    </span>
                    <div>
                      <h3 className="text-[0.875rem] font-black leading-tight text-text">{section.name}</h3>
                      <p className="text-[0.6875rem] text-text-sec">{section.tables.length} tables</p>
                    </div>
                  </div>

                  {/* Table buttons grid */}
                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {section.tables.map(table =>
                      loading
                        ? <TableCardSkeleton key={table.id} />
                        : (
                          <TableRowButton
                            key={table.id}
                            table={table}
                            selected={selectedTable === table.id}
                            onClick={() => handleOpenTable(table)}
                          />
                        ),
                    )}
                  </div>
                </Card>
              )
            })}
          </section>
        )}
      </main>
    </>
  )
}
