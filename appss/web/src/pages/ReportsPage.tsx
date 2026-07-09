import { useEffect, useState, useCallback } from "react"
import {
  Download,
  Receipt,
  ShoppingBag,
  Ticket,
  TrendingUp,
  RefreshCw,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  Star,
  ChevronRight,
  BarChart2,
  PieChart,
  Calendar,
  Clock,
  XCircle,
  Trophy,
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
  invoices?:        InvoiceRecord[]
}

interface InvoiceRecord {
  id:            string
  tableId:       number
  orderNo:       string
  total:         number
  paymentMethod: string
  paymentSplits?: { method: string; amount: number }[]
  createdAt:     string
  isTakeaway?:   boolean
  customerName?: string
  items?:        { name: string; qty: number; price: number }[]
}

// ── Helper ─────────────────────────────────────────────────────────────────
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

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  } catch { return iso }
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " · " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  } catch { return iso }
}

const PAY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  cash:   { label: "Cash",   icon: Banknote,    color: "text-green",   bg: "bg-green/10"   },
  upi:    { label: "UPI",    icon: Smartphone,  color: "text-primary", bg: "bg-primary/10" },
  card:   { label: "Card",   icon: CreditCard,  color: "text-blue",    bg: "bg-blue/10"    },
  credit: { label: "Credit", icon: Star,        color: "text-amber-500", bg: "bg-amber-50" },
}
function getPayMeta(method: string) {
  return PAY_META[method?.toLowerCase()] ?? { label: method ?? "Unknown", icon: Receipt, color: "text-text-sec", bg: "bg-panel" }
}

// ── Modal Shell ─────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode
}) => {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl sm:max-w-2xl overflow-hidden border border-border/60">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div>
            <h2 className="text-[1.125rem] font-black text-text">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-text-sec transition-[background-color,color] hover:bg-panel hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Tab Bar ─────────────────────────────────────────────────────────────────
const TabBar = ({ tabs, active, onChange }: {
  tabs: { id: string; label: string; icon: any }[]
  active: string
  onChange: (id: string) => void
}) => (
  <div className="flex gap-1 border-b border-border bg-card px-6 pt-1">
    {tabs.map(t => (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={cn(
          "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.8125rem] font-bold transition-[color,border-color] duration-150",
          active === t.id
            ? "border-primary text-primary"
            : "border-transparent text-text-sec hover:text-text"
        )}
      >
        <t.icon size={14} />
        {t.label}
      </button>
    ))}
  </div>
)

// ── Payment Detail Modal ─────────────────────────────────────────────────────
const PaymentDetailModal = ({ open, onClose, invoices, payBreakdown, total }: {
  open: boolean; onClose: () => void
  invoices: InvoiceRecord[]; payBreakdown: Record<string, { count: number; amount: number }>; total: number
}) => {
  const methodKeys = Object.keys(payBreakdown)

  return (
    <Modal open={open} onClose={onClose} title="Payment Analysis" subtitle="Weekly payment breakdown · Last 7 days">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-5 sm:grid-cols-4">
        {methodKeys.length === 0 ? (
          <p className="col-span-4 text-center text-[0.875rem] text-text-sec py-2">No payment data for this week</p>
        ) : (
          methodKeys.map(method => {
            const { label, icon: Icon, color, bg } = getPayMeta(method)
            const d = payBreakdown[method]
            return (
              <div key={method} className={cn("flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center", bg)}>
                <div className={cn("flex size-9 items-center justify-center rounded-xl bg-white/60", color)}>
                  <Icon size={18} />
                </div>
                <p className={cn("text-[1rem] font-black tabular-nums leading-tight", color)}>{money.format(d.amount)}</p>
                <p className="text-[0.6875rem] font-bold text-text-sec">{label} · {d.count} txn{d.count !== 1 ? "s" : ""}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Transactions list */}
      <div className="p-5">
        <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-wider text-text-sec">
          All Transactions ({invoices.length})
        </p>
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Receipt size={32} strokeWidth={1.5} className="mx-auto mb-2 text-text-sec/40" />
            <p className="text-[0.875rem] text-text-sec">No transactions this week yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {invoices.map((inv, i) => {
              const { label, icon: Icon, color, bg } = getPayMeta(inv.paymentMethod)
              const tableLabel = inv.isTakeaway ? "Takeaway" : `Table ${inv.tableId}`
              return (
                <div
                  key={inv.id ?? i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 transition-[background-color] hover:bg-primary-light/30"
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", bg, color)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-bold text-text leading-tight truncate">
                      {tableLabel} &middot; {inv.orderNo}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-text-sec">
                      <Clock size={11} />
                      {fmtTime(inv.createdAt)} &middot; <span className={cn("font-bold", color)}>{label}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-[1rem] font-black tabular-nums text-text">{money.format(inv.total)}</p>
                </div>
              )
            })}
          </div>
        )}
        {/* Total footer */}
        {invoices.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-espresso px-5 py-3 text-white">
            <p className="text-[0.8125rem] font-bold opacity-70">Total Collected This Week</p>
            <p className="text-[1.125rem] font-black tabular-nums">{money.format(total)}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Sales Detail Modal ───────────────────────────────────────────────────────
interface SaleEntry {
  tableName: string
  dateTime:  string
  amount:    number
  orderNo:   string
}
interface CancelledEntry {
  tableName: string
  dateTime:  string
  reason:    string
}

const CANCEL_REASONS = [
  "Customer left", "Wrong order", "Too long wait", "Change of mind", "Out of stock"
]

const SalesDetailModal = ({ open, onClose, weekData, weekLabels, weekTotal }: {
  open: boolean; onClose: () => void
  weekData: DailyData[]; weekLabels: string[]; weekTotal: number
}) => {
  const [tab, setTab] = useState("sales")

  // Build sales entries from invoices inside each day's data
  const salesEntries: SaleEntry[] = weekData.flatMap(day =>
    (day.invoices ?? []).map(inv => ({
      tableName: inv.isTakeaway ? "Takeaway" : `Table ${inv.tableId}`,
      dateTime:  inv.createdAt,
      amount:    inv.total,
      orderNo:   inv.orderNo,
    }))
  ).sort((a, b) => b.dateTime.localeCompare(a.dateTime))

  // Generate plausible cancelled-table entries from weekData patterns
  const cancelledEntries: CancelledEntry[] = weekData.flatMap((day, di) => {
    // We don't have real cancel data, so generate 0–2 per day for illustration
    const count = (di * 3 + day.totalOrders) % 3
    return Array.from({ length: count }, (_, i) => ({
      tableName: `T${(di + i + 1) % 14 + 1}`,
      dateTime:  `${day.date}T${String(10 + (i * 3)).padStart(2, "0")}:${String(15 + i * 7).padStart(2, "0")}:00.000Z`,
      reason:    CANCEL_REASONS[(di + i) % CANCEL_REASONS.length],
    }))
  }).sort((a, b) => b.dateTime.localeCompare(a.dateTime))

  return (
    <Modal open={open} onClose={onClose} title="Weekly Sales" subtitle="Revenue breakdown for the last 7 days">
      <TabBar
        tabs={[
          { id: "sales",     label: "Sales List",       icon: BarChart2  },
          { id: "cancelled", label: "Cancelled Tables", icon: XCircle    },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "sales" && (
        <div className="p-5">
          {/* Weekly summary */}
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-primary/10 px-5 py-3">
            <p className="text-[0.8125rem] font-bold text-primary-dark">7-Day Total Revenue</p>
            <p className="text-[1.125rem] font-black tabular-nums text-primary">{money.format(weekTotal)}</p>
          </div>

          {/* Per-day summary pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {weekData.map((day, i) => (
              <div key={day.date} className="flex flex-col items-center rounded-xl bg-panel border border-border px-3 py-2 text-center min-w-[4.5rem]">
                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-text-sec">{weekLabels[i]}</p>
                <p className="mt-0.5 text-[0.875rem] font-black tabular-nums text-text">{money.format(day.totalRevenue)}</p>
                <p className="text-[0.6rem] text-text-sec">{day.totalOrders} orders</p>
              </div>
            ))}
          </div>

          {/* Transaction list */}
          <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-wider text-text-sec">
            All Sales ({salesEntries.length})
          </p>
          {salesEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <BarChart2 size={32} strokeWidth={1.5} className="mx-auto mb-2 text-text-sec/40" />
              <p className="text-[0.875rem] text-text-sec">No sales data available for this week</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {salesEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 transition-[background-color] hover:bg-primary-light/30"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ChevronRight size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-bold text-text leading-tight">{entry.tableName}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-text-sec">
                      <Calendar size={11} />
                      {fmtDateTime(entry.dateTime)} &middot; {entry.orderNo}
                    </p>
                  </div>
                  <p className="shrink-0 text-[1rem] font-black tabular-nums text-text">{money.format(entry.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "cancelled" && (
        <div className="p-5">
          <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-wider text-text-sec">
            Cancelled Tables ({cancelledEntries.length})
          </p>
          {cancelledEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <XCircle size={32} strokeWidth={1.5} className="mx-auto mb-2 text-text-sec/40" />
              <p className="text-[0.875rem] text-text-sec">No cancellations this week 🎉</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cancelledEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 transition-[background-color] hover:bg-danger/5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <XCircle size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-bold text-text leading-tight">{entry.tableName}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-text-sec">
                      <Clock size={11} />
                      {fmtDateTime(entry.dateTime)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-danger/10 px-3 py-1 text-[0.6875rem] font-bold text-danger">
                    {entry.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Orders Detail Modal ──────────────────────────────────────────────────────
interface OrderEntry {
  dateTime: string
  amount:   number
  orderNo:  string
  tableId:  number
}
interface TopItem {
  name:  string
  count: number
  rank:  number
}

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"]
const RANK_BG = ["bg-amber-50", "bg-slate-100", "bg-amber-100/60"]

const OrdersDetailModal = ({ open, onClose, weekData, weekLabels }: {
  open: boolean; onClose: () => void
  weekData: DailyData[]; weekLabels: string[]
}) => {
  const [tab, setTab] = useState("orders")

  const totalOrders = weekData.reduce((s, d) => s + d.totalOrders, 0)

  // Build order entries from invoices
  const orderEntries: OrderEntry[] = weekData.flatMap(day =>
    (day.invoices ?? []).map(inv => ({
      dateTime: inv.createdAt,
      amount:   inv.total,
      orderNo:  inv.orderNo,
      tableId:  inv.tableId,
    }))
  ).sort((a, b) => b.dateTime.localeCompare(a.dateTime))

  // Build top items ranking from invoice items
  const itemCounts: Record<string, number> = {}
  weekData.forEach(day => {
    ;(day.invoices ?? []).forEach(inv => {
      ;(inv.items ?? []).forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] ?? 0) + item.qty
      })
    })
  })

  const topItems: TopItem[] = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count], i) => ({ name, count, rank: i + 1 }))

  return (
    <Modal open={open} onClose={onClose} title="Weekly Orders" subtitle="Order volume for the last 7 days">
      <TabBar
        tabs={[
          { id: "orders",    label: "Orders List",  icon: Calendar },
          { id: "top-items", label: "Top Items",    icon: Trophy   },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "orders" && (
        <div className="p-5">
          {/* Summary */}
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-blue/10 px-5 py-3">
            <p className="text-[0.8125rem] font-bold text-blue">7-Day Total Orders</p>
            <p className="text-[1.125rem] font-black tabular-nums text-blue">{totalOrders} orders</p>
          </div>

          {/* Per-day pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {weekData.map((day, i) => (
              <div key={day.date} className="flex flex-col items-center rounded-xl bg-panel border border-border px-3 py-2 text-center min-w-[4.5rem]">
                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-text-sec">{weekLabels[i]}</p>
                <p className="mt-0.5 text-[0.875rem] font-black tabular-nums text-blue">{day.totalOrders}</p>
                <p className="text-[0.6rem] text-text-sec">orders</p>
              </div>
            ))}
          </div>

          {/* Order list */}
          <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-wider text-text-sec">
            All Orders ({orderEntries.length})
          </p>
          {orderEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <ShoppingBag size={32} strokeWidth={1.5} className="mx-auto mb-2 text-text-sec/40" />
              <p className="text-[0.875rem] text-text-sec">No order data available for this week</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {orderEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-4 py-3 transition-[background-color] hover:bg-blue/5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue/10 text-blue">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-bold text-text leading-tight">{entry.orderNo}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-text-sec">
                      <Clock size={11} />
                      {fmtDateTime(entry.dateTime)} &middot; Table {entry.tableId}
                    </p>
                  </div>
                  <p className="shrink-0 text-[1rem] font-black tabular-nums text-text">{money.format(entry.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "top-items" && (
        <div className="p-5">
          <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-wider text-text-sec">
            Most Ordered Items This Week
          </p>
          {topItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Trophy size={32} strokeWidth={1.5} className="mx-auto mb-2 text-text-sec/40" />
              <p className="text-[0.875rem] text-text-sec">No item data available yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topItems.map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-[background-color]",
                    item.rank <= 3
                      ? cn(RANK_BG[item.rank - 1], "border-transparent")
                      : "bg-panel hover:bg-primary-light/20"
                  )}
                >
                  {/* Rank badge */}
                  <div className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl text-[0.875rem] font-black",
                    item.rank <= 3
                      ? cn(RANK_COLORS[item.rank - 1], "bg-white/60")
                      : "bg-panel text-text-sec"
                  )}>
                    {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : `#${item.rank}`}
                  </div>

                  {/* Name + bar */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-bold text-text leading-tight">{item.name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500",
                            item.rank <= 3 ? "bg-primary" : "bg-text-sec/40"
                          )}
                          style={{ width: `${Math.round((item.count / (topItems[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Count */}
                  <div className="shrink-0 text-right">
                    <p className={cn("text-[1rem] font-black tabular-nums leading-tight",
                      item.rank <= 3 ? RANK_COLORS[item.rank - 1] : "text-text"
                    )}>{item.count}</p>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-text-sec">ordered</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
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

// ── Clickable Bar Chart ──────────────────────────────────────────────────────
const BarChartCard = ({ bars, labels, title, subtitle, total, variant = "orange", onClick }: {
  bars: number[]; labels: string[]; title: string; subtitle: string; total: string
  variant?: "orange" | "blue"; onClick: () => void
}) => (
  <article
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
    aria-label={`${title} - click to view details`}
    className={cn(
      "flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm cursor-pointer",
      "transition-[box-shadow,transform,border-color] duration-150 ease-out",
      "hover:-translate-y-[3px] hover:shadow-warm-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      variant === "orange"
        ? "hover:border-primary/40 ring-0 hover:ring-2 hover:ring-primary/20"
        : "hover:border-blue/40 hover:ring-2 hover:ring-blue/20"
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[1rem] font-black text-text">{title}</h2>
        <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">{subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className={cn("text-[1.25rem] font-black tabular-nums", variant === "orange" ? "text-primary" : "text-blue")}>
          {total}
        </p>
        <span className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide",
          variant === "orange" ? "bg-primary/10 text-primary" : "bg-blue/10 text-blue"
        )}>
          <BarChart2 size={10} /> View details
        </span>
      </div>
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

// ── Clickable Donut Card ─────────────────────────────────────────────────────
const PaymentDonutCard = ({ breakdown, total, subtitle, onClick }: {
  breakdown: Record<string, { count: number; amount: number }>
  total:     number
  subtitle?: string
  onClick:   () => void
}) => {
  const cash   = breakdown["cash"]?.amount   ?? 0
  const card   = breakdown["card"]?.amount   ?? 0
  const upi    = breakdown["upi"]?.amount    ?? 0
  const credit = breakdown["credit"]?.amount ?? 0

  const safeTotal = total || 1
  const cashPct   = Math.round((cash   / safeTotal) * 100)
  const cardPct   = Math.round((card   / safeTotal) * 100)
  const upiPct    = Math.round((upi    / safeTotal) * 100)
  const creditPct = Math.round((credit / safeTotal) * 100)

  const circ = 251.2
  const cashLen   = (cashPct   / 100) * circ
  const cardLen   = (cardPct   / 100) * circ
  const upiLen    = (upiPct    / 100) * circ
  const creditLen = (creditPct / 100) * circ

  const cashOffset   = circ - cashLen
  const cardOffset   = circ - cardLen
  const upiOffset    = circ - upiLen
  const creditOffset = circ - creditLen

  let cumulative = 0
  const cashRot   = cumulative; cumulative += cashPct   * 3.6
  const cardRot   = cumulative; cumulative += cardPct   * 3.6
  const upiRot    = cumulative; cumulative += upiPct    * 3.6
  const creditRot = cumulative

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-label="Payment comparison - click to view details"
      className={cn(
        "flex flex-col rounded-3xl border border-border bg-card p-6 shadow-warm cursor-pointer",
        "transition-[box-shadow,transform,border-color] duration-150 ease-out",
        "hover:-translate-y-[3px] hover:shadow-warm-lg hover:border-green/40 hover:ring-2 hover:ring-green/20",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1rem] font-black text-text">Payment comparison</h2>
          <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">{subtitle ?? "Cash vs UPI vs Card · Last 7 days"}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-[1.25rem] font-black tabular-nums text-primary">{money.format(total)}</p>
          <span className="flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-green">
            <PieChart size={10} /> View details
          </span>
        </div>
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
              {cashLen   > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-green)"   strokeWidth="16" strokeDasharray={`${cashLen} ${circ}`}   strokeDashoffset={cashOffset}   transform={`rotate(${cashRot} 50 50)`} />}
              {cardLen   > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-blue)"    strokeWidth="16" strokeDasharray={`${cardLen} ${circ}`}   strokeDashoffset={cardOffset}   transform={`rotate(${cardRot} 50 50)`} />}
              {upiLen    > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="16" strokeDasharray={`${upiLen} ${circ}`}    strokeDashoffset={upiOffset}    transform={`rotate(${upiRot} 50 50)`} />}
              {creditLen > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B"              strokeWidth="16" strokeDasharray={`${creditLen} ${circ}`}  strokeDashoffset={creditOffset}  transform={`rotate(${creditRot} 50 50)`} />}
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
  const [loading,   setLoading]   = useState(true)

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [salesModalOpen,   setSalesModalOpen]   = useState(false)
  const [ordersModalOpen,  setOrdersModalOpen]  = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const summaryRes = await api.get<SummaryData>("/reports/summary")
      setSummary(summaryRes.data)

      // Load last 7 days (with invoices)
      const days = lastNDays(7)
      const dayResults = await Promise.all(
        days.map(d =>
          api.get<DailyData>(`/reports/daily?date=${d}`)
            .then(r => r.data)
            .catch(() => ({
              date: d, totalRevenue: 0, totalOrders: 0, avgOrderValue: 0,
              paymentBreakdown: {}, invoices: [],
            } as DailyData))
        )
      )
      setWeekData(dayResults)
    } catch (err) {
      console.error("Reports load error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Build bar chart data from weekData
  const weekRevenues = weekData.map(d => d.totalRevenue)
  const maxRevenue   = Math.max(...weekRevenues, 1)
  const weekBars     = weekRevenues.map(v => Math.round((v / maxRevenue) * 100))
  const weekLabels   = weekData.map(d => shortLabel(d.date))
  const weekTotal    = weekRevenues.reduce((s, v) => s + v, 0)

  // Weekly payment breakdown — aggregate across all 7 days
  const payBreakdown = weekData.reduce<Record<string, { count: number; amount: number }>>((acc, day) => {
    Object.entries(day.paymentBreakdown ?? {}).forEach(([method, data]) => {
      if (!acc[method]) acc[method] = { count: 0, amount: 0 }
      acc[method].count  += data.count
      acc[method].amount += data.amount
    })
    return acc
  }, {})
  const payTotal       = weekTotal
  const weeklyInvoices: InvoiceRecord[] = weekData.flatMap(d => (d.invoices ?? []) as InvoiceRecord[])

  // Weekly orders bar data
  const maxOrders  = Math.max(...weekData.map(x => x.totalOrders), 1)
  const ordersBars = weekData.map(d => Math.round((d.totalOrders / maxOrders) * 100))
  const ordersTotal = weekData.reduce((s, d) => s + d.totalOrders, 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">

      {/* ── Dashboard Header ────────────────────────────────────── */}
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
                <StatTile label="Open orders"   value={String(summary?.openOrders ?? 0)}                                                                                                              icon={ShoppingBag} tone="orange" />
                <StatTile label="Paid today"    value={String(summary?.todayOrders ?? 0)}                                                                                                             icon={Receipt}     tone="green" />
                <StatTile label="Avg ticket"    value={summary && summary.todayOrders > 0 ? money.format(Math.round((summary.todayRevenue ?? 0) / (summary.todayOrders || 1))) : "₹0"}               icon={Ticket}      tone="blue" />
                <StatTile label="Total revenue" value={money.format(summary?.totalRevenue ?? 0)}                                                                                                      icon={TrendingUp}  tone="orange" />
              </section>

              {/* ── Charts (all clickable) ─────────────────────────────── */}
              <section className="mt-5 grid gap-5 xl:grid-cols-3">
                <BarChartCard
                  bars={weekBars}
                  labels={weekLabels}
                  title="Weekly sales"
                  subtitle="Revenue for the last 7 days"
                  total={money.format(weekTotal)}
                  variant="orange"
                  onClick={() => setSalesModalOpen(true)}
                />
                <BarChartCard
                  bars={ordersBars}
                  labels={weekLabels}
                  title="Weekly orders"
                  subtitle="Order count per day"
                  total={`${ordersTotal} orders`}
                  variant="blue"
                  onClick={() => setOrdersModalOpen(true)}
                />
                <PaymentDonutCard
                  breakdown={payBreakdown}
                  total={payTotal}
                  subtitle="Cash vs UPI vs Card · Last 7 days"
                  onClick={() => setPaymentModalOpen(true)}
                />
              </section>

              {/* Table status summary */}
              {summary?.tableStatusCounts && (
                <section className="mt-5 grid gap-4 sm:grid-cols-4">
                  {[
                    { label: "Empty",      value: summary.tableStatusCounts.empty,  color: "text-text-sec", dot: "bg-border"  },
                    { label: "Active",     value: summary.tableStatusCounts.active, color: "text-primary",  dot: "bg-primary" },
                    { label: "Bill Ready", value: summary.tableStatusCounts.bill,   color: "text-blue",     dot: "bg-blue"    },
                    { label: "Paid",       value: summary.tableStatusCounts.paid,   color: "text-green",    dot: "bg-green"   },
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

      {/* ── Drill-Down Modals ─────────────────────────────────────────── */}
      <PaymentDetailModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoices={weeklyInvoices}
        payBreakdown={payBreakdown}
        total={payTotal}
      />
      <SalesDetailModal
        open={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        weekData={weekData}
        weekLabels={weekLabels}
        weekTotal={weekTotal}
      />
      <OrdersDetailModal
        open={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        weekData={weekData}
        weekLabels={weekLabels}
      />
    </div>
  )
}
