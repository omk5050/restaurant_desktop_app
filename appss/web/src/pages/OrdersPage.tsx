import { Badge, Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { orderTickets } from "@/mocks/pos"
import { money } from "@/utils/currency"

const StatTile = ({ label, tone = "text-primary-dark", value }: {
  label: string; tone?: string; value: string
}) => (
  <Card className="flex h-[5.5rem] flex-col items-center justify-center gap-1 rounded-3xl p-2 text-center transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[2px] hover:shadow-warm-lg">
    <p className={cn("text-[1.75rem] font-black leading-none tabular-nums", tone)}>{value}</p>
    <p className="text-[0.6875rem] font-bold text-text-sec">{label}</p>
  </Card>
)

const HeroPanel = () => (
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
        <p className="text-[1.25rem] font-black leading-none">11</p>
        <p className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-widest text-white/90">live</p>
      </div>
    </div>
  </section>
)

export function OrdersPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Header title="Orders" />
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem] px-6 py-5">
          <HeroPanel />
          
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatTile label="Total orders"  value="46" />
            <StatTile label="Need payment"  value="1"  tone="text-blue" />
            <StatTile label="Order value"   value="₹9,661" tone="text-green" />
          </section>
          
          <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.25rem] font-black leading-tight text-text">Service tickets</h2>
              <p className="mt-0.5 text-[0.75rem] font-medium text-text-sec">Newest order first</p>
            </div>
            <div className="flex h-7 items-center justify-center rounded-full bg-panel border border-border px-3">
              <span className="text-[0.6875rem] font-bold text-text-sec">1 bills ready</span>
            </div>
          </section>
          
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {orderTickets.map(ticket => (
              <article 
                key={ticket.id} 
                className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg"
              >
                {/* Left status bar */}
                <div className="absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full bg-primary" />
                
                {/* Top header row */}
                <div className="ml-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary-light text-[1.25rem] shadow-sm">
                      🛍️
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[1rem] font-black text-text leading-tight">{ticket.id}</h3>
                      <p className="truncate text-[0.75rem] font-medium text-text-sec mt-0.5">
                        {ticket.table} · {ticket.time}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 items-center justify-center rounded-full bg-primary-light px-3 text-[0.625rem] font-bold uppercase tracking-wider text-primary-dark">
                    Cooking
                  </span>
                </div>
                
                {/* Order items line */}
                <div className="ml-2 mt-4 rounded-xl border border-border bg-panel px-4 py-2">
                  <p className="truncate text-[0.8125rem] font-bold text-text-sec">
                    {ticket.items}
                  </p>
                </div>
                
                {/* Bottom totals row */}
                <div className="ml-2 mt-4 flex items-center justify-between">
                  <span className="flex h-6 items-center justify-center rounded-full bg-panel border border-border px-2.5 text-[0.6875rem] font-bold text-text-sec">
                    {ticket.items === "No items yet" ? "0 items" : ticket.items.split(",").length + " items"}
                  </span>
                  <span className="text-[1.125rem] font-black tabular-nums text-primary">
                    {money.format(ticket.amount)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
