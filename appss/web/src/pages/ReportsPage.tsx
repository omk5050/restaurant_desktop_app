import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Receipt,
  ShoppingBag,
  Ticket,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { money } from "@/utils/currency"

const HeroPanel = () => (
  <section className="rounded-3xl bg-espresso px-5 py-4 text-white shadow-warm">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary-mid">Sales Pulse</p>
        <h2 className="mt-0.5 text-[1.5rem] font-black leading-tight text-white">Sales pulse</h2>
        <p className="mt-1 max-w-md text-[0.8125rem] font-medium leading-normal opacity-70">
          Weekly rhythm, monthly trend, and table velocity.
        </p>
      </div>
      <div className="shrink-0 rounded-2xl bg-primary px-4 py-3 text-center shadow-sm">
        <p className="text-[1.5rem] font-black leading-none tabular-nums">{money.format(0)}</p>
        <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-widest text-white/90">today</p>
      </div>
    </div>
  </section>

)

const StatTile = ({ label, tone = "orange", value, icon: Icon }: {
  label: string; tone?: "orange" | "green" | "blue"; value: string; icon: any
}) => {
  const tones = {
    orange: { text: "text-primary", bg: "bg-primary/10", val: "text-primary-dark" },
    green:  { text: "text-green",   bg: "bg-green/10",   val: "text-green" },
    blue:   { text: "text-blue",    bg: "bg-blue/10",    val: "text-blue" },
  }
  const active = tones[tone]

  return (
    <article className="flex h-[7.5rem] flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg">
      <div className="flex items-start justify-between">
        <p className={cn("text-[1.75rem] font-black leading-none tabular-nums", active.val)}>{value}</p>
        <div className={cn("flex size-10 items-center justify-center rounded-xl", active.bg, active.text)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-[0.8125rem] font-bold text-text-sec">{label}</p>
    </article>
  )
}

const BarChartCard = ({ bars, labels, title, subtitle, total, variant = "orange" }: {
  bars: number[]; labels: string[]; title: string; subtitle: string; total: string; variant?: "orange" | "blue"
}) => (
  <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[1rem] font-black text-text">{title}</h2>
        <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">{subtitle}</p>
      </div>
      <p className={cn("text-[1.25rem] font-black tabular-nums", variant === "orange" ? "text-primary" : "text-blue")}>
        {total}
      </p>
    </div>
    
    <div className="relative mt-8 flex h-48 items-end justify-between gap-3">
      {/* Background grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between border-b border-border/40 pb-5">
        <div className="w-full border-b border-dashed border-border/40" />
        <div className="w-full border-b border-dashed border-border/40" />
        <div className="w-full border-b border-dashed border-border/40" />
        <div className="w-full border-b border-dashed border-border/40" />
      </div>
      
      {/* Bars */}
      {bars.map((bar, index) => (
        <div className="relative z-10 flex h-full flex-1 flex-col items-center gap-2" key={labels[index]}>
          <div className="flex w-full flex-1 items-end justify-center">
            <span
              className={cn(
                "w-full max-w-[2.5rem] rounded-t-lg transition-all duration-150 hover:opacity-80",
                variant === "blue" ? "bg-blue" : "bg-primary"
              )}
              style={{ height: `${bar}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">{labels[index]}</span>
        </div>
      ))}
    </div>
  </article>
)

const DonutChartCard = () => (
  <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[1rem] font-black text-text">Payment comparison</h2>
        <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">Cards vs Cash vs UPI</p>
      </div>
      <p className="text-[1.25rem] font-black tabular-nums text-primary">₹40,322</p>
    </div>
    
    <div className="mt-8 flex h-48 items-center justify-between gap-6 px-4">
      {/* SVG Donut */}
      <div className="relative flex size-32 items-center justify-center">
        <svg viewBox="0 0 100 100" className="-rotate-90 overflow-visible">
          {/* UPI (Orange) - 23% */}
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="193.4" />
          {/* Card (Blue) - 5% */}
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-blue)" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="238.6" strokeDashOffset-adjusted="193.4" transform="rotate(82.8 50 50)" />
          {/* Cash (Green) - 72% */}
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-green)" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="70.3" transform="rotate(100.8 50 50)" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[0.875rem] font-black text-text leading-tight">₹40,322</span>
          <span className="text-[0.5rem] font-bold uppercase tracking-widest text-text-sec mt-0.5">Total Paid</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-green" />
          <span className="text-[0.75rem] font-bold text-text-sec">Cash: <span className="text-text">₹29,060</span> (72%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-blue" />
          <span className="text-[0.75rem] font-bold text-text-sec">Card: <span className="text-text">₹2,091</span> (5%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary" />
          <span className="text-[0.75rem] font-bold text-text-sec">UPI: <span className="text-text">₹9,171</span> (23%)</span>
        </div>
      </div>
    </div>
  </article>
)

const InsightCard = () => (
  <article className="mt-5 flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[2px] hover:shadow-warm-lg">
    <div className="flex items-center gap-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <TrendingUp size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-[1rem] font-black text-text">Top insight</h3>
        <p className="mt-0.5 text-[0.8125rem] font-medium text-text-sec">Sales are up by <span className="font-bold text-text">18%</span> compared to last week.</p>
      </div>
    </div>
    <button type="button" className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-[0.8125rem] font-bold text-primary shadow-sm transition-[border-color,background-color,transform] duration-150 ease-out hover:border-primary/40 hover:bg-primary-light active:scale-[0.97]">
      View details &rsaquo;
    </button>
  </article>
)

export function ReportsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      
      {/* ── Dashboard Header ──────────────────────────────────────── */}
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div>
          <h1 className="text-[1.25rem] font-black text-text">Reports</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[0.8125rem] font-bold text-text transition-[border-color,transform] duration-150 hover:border-primary/40 hover:bg-panel active:scale-[0.97]">
            <Calendar size={16} className="text-text-sec" />
            30 Jun – 6 Jul, 2025
            <ChevronDown size={14} className="text-text-sec" />
          </button>
          
          <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[0.8125rem] font-bold text-text transition-[border-color,transform] duration-150 hover:border-primary/40 hover:bg-panel active:scale-[0.97]">
            <Filter size={16} className="text-text-sec" />
            Filter
          </button>
          
          <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[0.8125rem] font-bold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-dark active:scale-[0.97]">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem]">
          <HeroPanel />
          
          <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Active orders" value="0"      icon={ShoppingBag} tone="orange" />
            <StatTile label="Paid bills"    value="0"      icon={Receipt}     tone="green" />
            <StatTile label="Avg ticket"    value="₹287"   icon={Ticket}      tone="blue" />
            <StatTile label="Month pace"    value="₹5,208" icon={TrendingUp}  tone="orange" />
          </section>
          
          <section className="mt-5 grid gap-5 xl:grid-cols-3">
            <BarChartCard
              bars={[15, 65, 12, 0, 0, 0, 0]}
              labels={["30 Jun", "1 Jul", "2 Jul", "3 Jul", "4 Jul", "5 Jul", "6 Jul"]}
              title="Weekly sales"
              subtitle="Current service week"
              total="₹6,013"
              variant="orange"
            />
            <BarChartCard
              bars={[5, 5, 5, 5, 90, 20]}
              labels={["Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
              title="Monthly sales"
              subtitle="6-month revenue trend"
              total="₹40,699"
              variant="blue"
            />
            <DonutChartCard />
          </section>
          
          <InsightCard />
          
        </div>
      </main>
    </div>
  )
}
