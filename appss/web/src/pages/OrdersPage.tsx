import { useEffect } from "react"
import { Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { money } from "@/utils/currency"
import { useOrderStore, type ApiOrder } from "@/store/orderStore"
import { useKotStore, type KotEvent } from "@/store/kotStore"
import { ClipboardList, Trash2, ChefHat, AlertTriangle } from "lucide-react"

const StatTile = ({ label, tone = "text-primary-dark", value }: {
  label: string; tone?: string; value: string
}) => (
  <Card className="flex h-[5.5rem] flex-col items-center justify-center gap-1 rounded-3xl p-2 text-center transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[2px] hover:shadow-warm-lg">
    <p className={cn("text-[1.75rem] font-black leading-none tabular-nums", tone)}>{value}</p>
    <p className="text-[0.6875rem] font-bold text-text-sec">{label}</p>
  </Card>
)

const HeroPanel = ({ liveCount }: { liveCount: number }) => (
  <section className="rounded-2xl bg-espresso px-4 py-3 text-white shadow-warm">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary-mid">Order Rail</p>
        <h2 className="mt-0.5 text-[1.5rem] font-black leading-tight text-white">Live queue</h2>
        <p className="mt-1 max-w-md text-[0.8125rem] font-medium leading-normal opacity-70">
          Keep tables, bills, and payments moving.
        </p>
      </div>
      <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center shadow-sm">
        <p className="text-[1.25rem] font-black leading-none">{liveCount}</p>
        <p className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-widest text-white/90">live</p>
      </div>
    </div>
  </section>
)

const OrderCard = ({ order }: { order: ApiOrder }) => {
  const itemSummary = order.items.map(i => `${i.name} × ${i.qty}`).join(", ")
  const statusLabel =
    order.status === "open"   ? "Cooking"    :
    order.status === "hold"   ? "On Hold"    :
    order.status === "billed" ? "Bill Ready" :
    "Paid"
  const statusTone =
    order.status === "open"   ? "bg-primary-light text-primary-dark"   :
    order.status === "hold"   ? "bg-yellow/10 text-yellow-dark"        :
    order.status === "billed" ? "bg-blue-light text-blue"              :
    "bg-green-light text-green"

  return (
    <article
      key={order.id}
      className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg"
    >
      <div className="absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full bg-primary" />
      <div className="ml-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary-light text-[1.25rem] shadow-sm">
            🛍️
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[1rem] font-black text-text leading-tight">{order.orderNo}</h3>
            <p className="truncate text-[0.75rem] font-medium text-text-sec mt-0.5">
              T{order.tableId} · {new Date(order.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <span className={cn("flex h-7 items-center justify-center rounded-full px-3 text-[0.625rem] font-bold uppercase tracking-wider", statusTone)}>
          {statusLabel}
        </span>
      </div>
      <div className="ml-2 mt-4 rounded-xl border border-border bg-panel px-4 py-2">
        <p className="truncate text-[0.8125rem] font-bold text-text-sec">
          {itemSummary || "No items yet"}
        </p>
      </div>
      <div className="ml-2 mt-4 flex items-center justify-between">
        <span className="flex h-6 items-center justify-center rounded-full bg-panel border border-border px-2.5 text-[0.6875rem] font-bold text-text-sec">
          {order.items.length} items
        </span>
        <span className="text-[1.125rem] font-black tabular-nums text-primary">
          {money.format(order.total)}
        </span>
      </div>
    </article>
  )
}

// ── KOT Queue Card ────────────────────────────────────────────────────
const KotCard = ({ event }: { event: KotEvent }) => {
  const typeLabel =
    event.type === "new"     ? "New KOT"    :
    event.type === "update"  ? "Updated KOT":
    "Item Removed"
  const typeTone =
    event.type === "new"     ? "bg-primary-light text-primary" :
    event.type === "update"  ? "bg-yellow/10 text-yellow-dark" :
    "bg-danger/10 text-danger"
  const TypeIcon =
    event.type === "removal" ? AlertTriangle : event.type === "update" ? ClipboardList : ChefHat

  const timeStr = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <article className={cn(
      "relative flex flex-col overflow-hidden rounded-3xl border bg-card p-4 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[2px] hover:shadow-warm-lg",
      event.type === "removal" ? "border-danger/20" : "border-border",
    )}>
      <div className={cn(
        "absolute bottom-3 left-0 top-3 w-1.5 rounded-r-full",
        event.type === "removal" ? "bg-danger" : event.type === "update" ? "bg-yellow" : "bg-primary",
      )} />
      <div className="ml-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", typeTone)}>
            <TypeIcon size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.875rem] font-black text-text">Table {event.tableName}</p>
            <p className="text-[0.6875rem] text-text-sec">{timeStr}</p>
          </div>
        </div>
        <span className={cn("shrink-0 flex h-6 items-center justify-center rounded-full px-2.5 text-[0.6rem] font-bold uppercase tracking-wider", typeTone)}>
          {typeLabel}
        </span>
      </div>

      {event.items.length > 0 && (
        <div className="ml-2 mt-3 rounded-xl border border-border bg-panel px-3 py-2">
          {event.items.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="text-[0.8125rem] font-semibold text-text">{item.name}</span>
              <span className="text-[0.8125rem] font-black tabular-nums text-text-sec">×{item.qty}</span>
            </div>
          ))}
        </div>
      )}

      {event.reason && (
        <div className="ml-2 mt-2 rounded-xl bg-danger/5 border border-danger/20 px-3 py-2">
          <p className="text-[0.75rem] font-bold text-danger">Reason: {event.reason}</p>
        </div>
      )}

      {event.kitchenNote && (
        <div className="ml-2 mt-2 rounded-xl bg-panel border border-border px-3 py-2">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-text-sec mb-0.5">Kitchen Note</p>
          <p className="text-[0.8125rem] text-text italic">{event.kitchenNote}</p>
        </div>
      )}
    </article>
  )
}

export function OrdersPage() {
  const { orders, loading, fetchOrders } = useOrderStore()
  const { events, clearEvents } = useKotStore()

  useEffect(() => {
    fetchOrders({ status: "open,hold,billed" })
  }, [fetchOrders])

  const liveOrders  = orders.filter(o => o.status === "open" || o.status === "billed")
  const billReady   = orders.filter(o => o.status === "billed").length
  const totalValue  = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Header title="Orders" />
      <main className="flex flex-1 overflow-hidden">

        {/* ── Left: live orders ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="mx-auto max-w-[60rem] px-6 py-5">
            <HeroPanel liveCount={liveOrders.length} />

            <section className="mt-4 grid gap-4 sm:grid-cols-3">
              <StatTile label="Total orders"  value={String(orders.length)} />
              <StatTile label="Need payment"  value={String(billReady)}  tone="text-blue" />
              <StatTile label="Order value"   value={money.format(totalValue)} tone="text-green" />
            </section>

            <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[1.25rem] font-black leading-tight text-text">Service tickets</h2>
                <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">Newest order first</p>
              </div>
              <div className="flex h-7 items-center justify-center rounded-full bg-panel border border-border px-3">
                <span className="text-[0.6875rem] font-bold text-text-sec">{billReady} bills ready</span>
              </div>
            </section>

            {loading ? (
              <div className="mt-4 text-center text-text-sec py-8">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="mt-4 text-center text-text-sec py-8">No active orders</div>
            ) : (
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {orders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: KOT queue ───────────────────────────────── */}
        <aside className="hidden w-[22rem] shrink-0 flex-col border-l border-border bg-card dark:bg-bg xl:flex">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary-light">
                <ClipboardList size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[0.875rem] font-black text-text">KOT Queue</p>
                <p className="text-[0.6875rem] text-text-sec">{events.length} events</p>
              </div>
            </div>
            {events.length > 0 && (
              <button
                type="button"
                onClick={clearEvents}
                className="flex size-8 items-center justify-center rounded-xl border border-border text-text-sec hover:bg-danger/10 hover:text-danger transition-colors"
                title="Clear queue"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "thin" }}>
            {events.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-panel shadow-warm">
                  <ChefHat size={24} strokeWidth={1.25} className="text-border" />
                </div>
                <p className="text-[0.8125rem] font-bold text-text-sec">No KOT events yet</p>
                <p className="text-[0.75rem] leading-snug text-text-sec/60">
                  KOTs sent from tables will appear here
                </p>
              </div>
            ) : (
              events.map(event => <KotCard key={event.id} event={event} />)
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
