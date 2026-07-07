import type { ReactNode } from "react"
import { Trash2, Plus, Tag } from "lucide-react"
import { Badge, Button, Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { menuItems } from "@/mocks/pos"
import { money } from "@/utils/currency"

// ── Sub-components ──────────────────────────────────────────────────
const HeroPanel = ({ badge, kicker, title, value }: {
  badge: string; kicker: string; title: string; value: string
}) => (
  <section className="rounded-2xl bg-espresso px-5 py-3 text-white shadow-warm">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary-mid">{kicker}</p>
        <h2 className="mt-0.5 text-[1.5rem] font-black leading-tight text-white">{title}</h2>
        <p className="mt-1 max-w-md text-[0.8125rem] font-medium leading-normal opacity-70">{value}</p>
      </div>
      <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center shadow-sm">
        <p className="text-[1.25rem] font-black leading-none">{badge.split(" ")[0]}</p>
        <p className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-widest text-white/90">{badge.split(" ").slice(1).join(" ")}</p>
      </div>
    </div>
  </section>
)

const StatTile = ({ label, tone = "text-primary-dark", value }: {
  label: string; tone?: string; value: string
}) => (
  <Card className="flex h-[5.5rem] flex-col items-center justify-center gap-1 p-2 text-center transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[1px] hover:shadow-warm-lg">
    <p className={cn("text-[1.5rem] font-black leading-none tabular-nums", tone)}>{value}</p>
    <p className="text-[0.6875rem] font-bold text-text-sec">{label}</p>
  </Card>
)

const Chip = ({ active, children, dark, full }: {
  active?: boolean; children: ReactNode; dark?: boolean; full?: boolean
}) => (
  <button
    className={cn(
      "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.75rem] font-bold",
      "transition-[background-color,border-color,color,transform] duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      "active:scale-[0.97]",
      full && "lg:w-full lg:justify-center",
      active
        ? "border-primary bg-primary text-white shadow-sm"
        : "border-border bg-card text-text-sec shadow-sm hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark",
    )}
    type="button"
  >
    {children}
  </button>
)

const FilterRow = () => (
  <div className="mt-4 flex flex-wrap gap-2">
    <Chip active>Main Course</Chip>
    <Chip>Something</Chip>
    <Chip>All types</Chip>
    <Chip>Veg</Chip>
    <Chip>Non-Veg</Chip>
  </div>
)

const MenuCard = ({ item }: { item: (typeof menuItems)[number] }) => (
  <article className="group relative flex h-[19rem] w-[14.5rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-warm transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg">
    
    {/* Image Area */}
    <div className="relative flex h-[7.5rem] w-full shrink-0 items-center justify-center bg-panel/50 pt-2">
      <img alt={item.name} className="h-[6rem] w-auto max-w-[85%] object-contain drop-shadow-sm mix-blend-multiply" src={item.image} />
      
      {/* Veg/Non-Veg dot */}
      <span className={cn(
        "absolute right-2.5 top-2.5 size-2.5 rounded-full border-[2px] border-card shadow-sm",
        item.type === "Veg" ? "bg-green" : "bg-danger",
      )} />

      {/* Delete button */}
      <button
        aria-label={`Delete ${item.name}`}
        className="absolute left-2.5 top-2.5 flex size-8 items-center justify-center rounded-xl bg-card text-text-sec shadow-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] hover:bg-danger hover:text-white"
        type="button"
      >
        <Trash2 size={13} strokeWidth={2.5} />
      </button>
    </div>

    {/* Text + Controls Area */}
    <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-center">
      <h3 className="line-clamp-2 h-[2.5rem] text-[0.875rem] font-black leading-tight text-text">
        {item.name}
      </h3>
      <div className="mt-1 flex items-center justify-center">
        <p className="text-[1.125rem] font-black text-primary">{money.format(item.price)}</p>
      </div>
      
      <div className="mt-auto flex items-center justify-center pt-2">
        <span className="flex h-5 items-center justify-center rounded-full bg-green/10 px-2.5 text-[0.625rem] font-bold uppercase tracking-wide text-green">
          Live
        </span>
      </div>
    </div>
  </article>
)

// ── Page ───────────────────────────────────────────────────────────
export function MenuPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Header eyebrow="MENU CONTROL" title="Kitchen catalog" />
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem] px-6 py-5">
          
          {/* Hero */}
          <HeroPanel
            badge="3 items"
            kicker="Menu Control"
            title="Kitchen catalog"
            value="Fast edits, quick scanning, live availability."
          />
          
          {/* Stats */}
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatTile label="Categories" value="2" />
            <StatTile label="Avg price"  value="₹100" />
            <StatTile label="Veg items"  value="2" />
          </section>
          
          {/* Filters */}
          <FilterRow />
          
          {/* Header */}
          <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[1.25rem] font-black leading-tight text-text">Menu Grid</h2>
            <div className="flex items-center gap-3">
              <span className="text-[0.75rem] font-bold text-green">3 available</span>
              <button type="button" className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[0.75rem] font-bold text-text-sec shadow-sm transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark active:scale-[0.97]">
                <Tag size={14} strokeWidth={2.5} />
                Tags
              </button>
              <button type="button" className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[0.75rem] font-bold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-primary-dark active:scale-[0.97]">
                <Plus size={14} strokeWidth={2.5} />
                Add Item
              </button>
            </div>
          </section>
          
          {/* Grid */}
          <section className="mt-5 grid grid-cols-[repeat(auto-fit,14.5rem)] justify-center gap-5">
            {menuItems.map(item => <MenuCard item={item} key={item.id} />)}
          </section>
        </div>
      </main>
    </div>
  )
}
