import { useEffect, useState } from "react"
import {
  Download,
  Receipt,
  ShoppingBag,
  Ticket,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { money } from "@/utils/currency"
import { api } from "@/lib/api"

// ── Types ──────────────────────────────────────────────────────────────────
interface SummaryData {
  todayRevenue:      number
  todayOrders:       number
  totalRevenue:      number
  totalOrders:       number
  openOrders:        number
  tableStatusCounts: { empty: number; active: number; bill: number; paid: number }
}

interface DailyData {
  date:             string
  totalRevenue:     number
  totalOrders:      number
  avgOrderValue:    number
  paymentBreakdown: Record<string, { count: number; amount: number }>
}

// ── Helper: last N days as ISO date strings ────────────────────────────────
function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split("T")[0])
  }
  return days
}

function shortLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// ── Sub-components ──────────────────────────────────────────────────────────

const HeroPanel = ({ revenue, orders }: { revenue: number; orders: number }) => (
  <section className="rounded-3xl bg-espresso px-5 py-4 text-white shadow-warm">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary-mid">Sales Pulse</p>
        <h2 className="mt-0.5 text-[1.5rem] font-black leading-tight text-white">Today's Performance</h2>
        <p className="mt-1 max-w-md text-[0.8125rem] font-medium leading-normal opacity-70">
          Live revenue, orders, and payment breakdown.
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-center rounded-2xl bg-primary px-4 py-3 text-center shadow-sm">
        <p className="text-[1.5rem] font-black leading-none tabular-nums">{money.format(revenue)}</p>
        <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-widest text-white/90">today</p>
        <p className="mt-1 text-[0.75rem] font-bold text-white/80">{orders} orders</p>
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
              style={{ height: `${Math.max(bar, 2)}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">{labels[index]}</span>
        </div>
      ))}
    </div>
  </article>
)

const PaymentDonutCard = ({ breakdown, total }: {
  breakdown: Record<string, { count: number; amount: number }>
  total:     number
}) => {
  const cash  = breakdown["cash"]?.amount  ?? 0
  const card  = breakdown["card"]?.amount  ?? 0
  const upi   = breakdown["upi"]?.amount   ?? 0
  const credit = breakdown["credit"]?.amount ?? 0

  const safeTotal = total || 1
  const cashPct   = Math.round((cash  / safeTotal) * 100)
  const cardPct   = Math.round((card  / safeTotal) * 100)
  const upiPct    = Math.round((upi   / safeTotal) * 100)
  const creditPct = Math.round((credit / safeTotal) * 100)

  // SVG donut segments (circumference ≈ 251.2 for r=40)
  const circ = 251.2
  const cashLen   = (cashPct  / 100) * circ
  const cardLen   = (cardPct  / 100) * circ
  const upiLen    = (upiPct   / 100) * circ
  const creditLen = (creditPct / 100) * circ

  const cashOffset   = circ - cashLen
  const cardOffset   = circ - cardLen
  const upiOffset    = circ - upiLen
  const creditOffset = circ - creditLen

  let cumulative = 0
  const cashRot   = cumulative; cumulative += cashPct * 3.6
  const cardRot   = cumulative; cumulative += cardPct * 3.6
  const upiRot    = cumulative; cumulative += upiPct  * 3.6
  const creditRot = cumulative

  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1rem] font-black text-text">Payment comparison</h2>
          <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">Cash vs UPI vs Card</p>
        </div>
        <p className="text-[1.25rem] font-black tabular-nums text-primary">{money.format(total)}</p>
      </div>
      
      <div className="mt-8 flex h-48 items-center justify-between gap-6 px-4">
        {/* SVG Donut */}
        <div className="relative flex size-32 items-center justify-center">
          {total === 0 ? (
            <svg viewBox="0 0 100 100" className="overflow-visible">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-border)" strokeWidth="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 100 100" className="-rotate-90 overflow-visible">
              {cashLen  > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-green)"  strokeWidth="16" strokeDasharray={`${cashLen} ${circ}`}  strokeDashoffset={cashOffset}  transform={`rotate(${cashRot} 50 50)`} />}
              {cardLen  > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-blue)"   strokeWidth="16" strokeDasharray={`${cardLen} ${circ}`}  strokeDashoffset={cardOffset}  transform={`rotate(${cardRot} 50 50)`} />}
              {upiLen   > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="16" strokeDasharray={`${upiLen} ${circ}`}   strokeDashoffset={upiOffset}   transform={`rotate(${upiRot} 50 50)`} />}
              {creditLen > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B"             strokeWidth="16" strokeDasharray={`${creditLen} ${circ}`} strokeDashoffset={creditOffset} transform={`rotate(${creditRot} 50 50)`} />}
            </svg>
          )}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[0.875rem] font-black text-text leading-tight">{money.format(total)}</span>
            <span className="text-[0.5rem] font-bold uppercase tracking-widest text-text-sec mt-0.5">Total</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-green" />
            <span className="text-[0.75rem] font-bold text-text-sec">Cash: <span className="text-text">{money.format(cash)}</span>{total > 0 ? ` (${cashPct}%)` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-primary" />
            <span className="text-[0.75rem] font-bold text-text-sec">UPI: <span className="text-text">{money.format(upi)}</span>{total > 0 ? ` (${upiPct}%)` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-blue" />
            <span className="text-[0.75rem] font-bold text-text-sec">Card: <span className="text-text">{money.format(card)}</span>{total > 0 ? ` (${cardPct}%)` : ""}</span>
          </div>
          {credit > 0 && (
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-yellow-500" />
              <span className="text-[0.75rem] font-bold text-text-sec">Credit: <span className="text-text">{money.format(credit)}</span> ({creditPct}%)</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [summary,   setSummary]   = useState<SummaryData | null>(null)
  const [weekData,  setWeekData]  = useState<DailyData[]>([])
  const [todayData, setTodayData] = useState<DailyData | null>(null)
  const [loading,   setLoading]   = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, todayRes] = await Promise.all([
        api.get<SummaryData>("/reports/summary"),
        api.get<DailyData>("/reports/daily"),
      ])
      setSummary(summaryRes.data)
      setTodayData(todayRes.data)

      // Load last 7 days
      const days = lastNDays(7)
      const dayResults = await Promise.all(
        days.map(d => api.get<DailyData>(`/reports/daily?date=${d}`).then(r => r.data).catch(() => ({
          date: d, totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, paymentBreakdown: {},
        } as DailyData)))
      )
      setWeekData(dayResults)
    } catch (err) {
      console.error("Reports load error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Build bar chart data from weekData
  const weekRevenues  = weekData.map(d => d.totalRevenue)
  const maxRevenue    = Math.max(...weekRevenues, 1)
  const weekBars      = weekRevenues.map(v => Math.round((v / maxRevenue) * 100))
  const weekLabels    = weekData.map(d => shortLabel(d.date))
  const weekTotal     = weekRevenues.reduce((s, v) => s + v, 0)

  // Today's payment breakdown
  const payBreakdown  = todayData?.paymentBreakdown ?? {}
  const payTotal      = todayData?.totalRevenue ?? 0

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      
      {/* ── Dashboard Header ──────────────────────────────────────── */}
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card px-6">
        <div>
          <h1 className="text-[1.25rem] font-black text-text">Reports</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[0.8125rem] font-bold text-text transition-[border-color,transform] duration-150 hover:border-primary/40 hover:bg-panel active:scale-[0.97]",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            <RefreshCw size={16} className={cn("text-text-sec", loading && "animate-spin")} />
            Refresh
          </button>
          
          <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[0.8125rem] font-bold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-dark active:scale-[0.97]">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem]">

          {loading && !summary ? (
            <div className="flex h-64 items-center justify-center text-text-sec">
              <RefreshCw size={24} className="animate-spin mr-3" />
              Loading reports…
            </div>
          ) : (
            <>
              <HeroPanel
                revenue={summary?.todayRevenue ?? 0}
                orders={summary?.todayOrders ?? 0}
              />
              
              <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Open orders"  value={String(summary?.openOrders ?? 0)}                                           icon={ShoppingBag} tone="orange" />
                <StatTile label="Paid today"   value={String(summary?.todayOrders ?? 0)}                                          icon={Receipt}     tone="green" />
                <StatTile label="Avg ticket"   value={summary && summary.todayOrders > 0 ? money.format(Math.round((summary.todayRevenue ?? 0) / (summary.todayOrders || 1))) : "₹0"} icon={Ticket}      tone="blue" />
                <StatTile label="Total revenue" value={money.format(summary?.totalRevenue ?? 0)}                                  icon={TrendingUp}  tone="orange" />
              </section>
              
              <section className="mt-5 grid gap-5 xl:grid-cols-3">
                <BarChartCard
                  bars={weekBars}
                  labels={weekLabels}
                  title="Weekly sales"
                  subtitle="Revenue for the last 7 days"
                  total={money.format(weekTotal)}
                  variant="orange"
                />
                <BarChartCard
                  bars={weekData.map(d => {
                    const maxOrders = Math.max(...weekData.map(x => x.totalOrders), 1)
                    return Math.round((d.totalOrders / maxOrders) * 100)
                  })}
                  labels={weekLabels}
                  title="Weekly orders"
                  subtitle="Order count per day"
                  total={String(weekData.reduce((s, d) => s + d.totalOrders, 0)) + " orders"}
                  variant="blue"
                />
                <PaymentDonutCard breakdown={payBreakdown} total={payTotal} />
              </section>

              {/* Table status summary */}
              {summary?.tableStatusCounts && (
                <section className="mt-5 grid gap-4 sm:grid-cols-4">
                  {[
                    { label: "Empty",      value: summary.tableStatusCounts.empty,  color: "text-text-sec", dot: "bg-border" },
                    { label: "Active",     value: summary.tableStatusCounts.active, color: "text-primary",  dot: "bg-primary" },
                    { label: "Bill Ready", value: summary.tableStatusCounts.bill,   color: "text-blue",     dot: "bg-blue" },
                    { label: "Paid",       value: summary.tableStatusCounts.paid,   color: "text-green",    dot: "bg-green" },
                  ].map(s => (
                    <article key={s.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <span className={cn("size-3 rounded-full", s.dot)} />
                      <span className="text-[0.875rem] font-bold text-text-sec">{s.label}</span>
                      <span className={cn("ml-auto text-[1.25rem] font-black tabular-nums", s.color)}>{s.value}</span>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
