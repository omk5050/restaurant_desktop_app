import { useState, type ReactNode } from "react"
import { ArrowLeft, Banknote, CreditCard, Smartphone, X } from "lucide-react"
import { Button, Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { type DiningTable, type PaymentMethod } from "@/mocks/pos"
import { money } from "@/utils/currency"
import type { CartItem } from "@/types/common"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

// ── Payment method options ─────────────────────────────────────────
const METHOD_OPTIONS: Array<{
  id:    PaymentMethod
  label: string
  icon:  ReactNode
  color: string
  hint:  string
}> = [
  { id: "cash",   label: "Cash",   icon: <Banknote size={28} strokeWidth={1.5} />,   color: "border-green  bg-green-light  text-green",  hint: "Enter cash received below" },
  { id: "upi",    label: "UPI",    icon: <Smartphone size={28} strokeWidth={1.5} />, color: "border-purple bg-purple-light text-purple", hint: "Customer scans QR code" },
  { id: "card",   label: "Card",   icon: <CreditCard size={28} strokeWidth={1.5} />, color: "border-blue   bg-blue-light   text-blue",   hint: "Tap or swipe card" },
  { id: "credit", label: "Credit", icon: <Banknote size={28} strokeWidth={1.5} />,   color: "border-yellow bg-yellow-light text-yellow",  hint: "Record for future payment" },
]

// ── Confirmation dialog ────────────────────────────────────────────
function ConfirmDialog({
  method, total, cashTendered, change, onConfirm, onCancel,
}: {
  method:        PaymentMethod
  total:         number
  cashTendered?: number
  change?:       number
  onConfirm:     () => void
  onCancel:      () => void
}) {
  useKeyboardShortcuts([
    { key: "Enter",  ctrl: false, action: onConfirm },
    { key: "Escape", ctrl: false, action: onCancel  },
  ])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Payment confirmation"
    >
      <Card className="w-full max-w-sm p-5 shadow-modal">

        {/* Dialog header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[1.25rem] font-black text-text">Confirm Payment</h2>
          <button
            className={cn(
              "flex size-8 items-center justify-center rounded-full border border-border text-text-sec",
              "transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-primary",
            )}
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Summary rows */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex justify-between rounded-xl bg-panel px-4 py-2.5">
            <span className="text-[0.8125rem] text-text-sec">Method</span>
            <span className="text-[0.8125rem] font-bold capitalize text-text">{method}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-panel px-4 py-2.5">
            <span className="text-[0.8125rem] text-text-sec">Total</span>
            <span className="text-[1.25rem] font-black tabular-nums text-text">{money.format(total)}</span>
          </div>
          {method === "cash" && cashTendered !== undefined && cashTendered > 0 && (
            <>
              <div className="flex justify-between rounded-xl bg-panel px-4 py-2.5">
                <span className="text-[0.8125rem] text-text-sec">Cash Received</span>
                <span className="text-[0.8125rem] font-bold tabular-nums text-text">{money.format(cashTendered)}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-green-light px-4 py-2.5">
                <span className="text-[0.8125rem] font-bold text-green">Change</span>
                <span className="text-[1.25rem] font-black tabular-nums text-green">
                  {money.format(Math.max(0, (change ?? 0)))}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Keyboard hint */}
        <p className="mt-3 text-center text-[0.6875rem] text-text-sec">
          Press{" "}
          <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[0.6875rem]">Enter</kbd>
          {" "}to confirm,{" "}
          <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[0.6875rem]">Esc</kbd>
          {" "}to cancel
        </p>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel} className="h-11">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="h-11">
            Confirm
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
interface PaymentPageProps {
  selectedTable: DiningTable
  cartItems:     CartItem[]
  subtotal:      number
  gst:           number
  total:         number
  onBack:        () => void
  onComplete:    () => void
}

export function PaymentPage({
  selectedTable, cartItems, subtotal, gst, total, onBack, onComplete,
}: PaymentPageProps) {
  const [method,       setMethod]       = useState<PaymentMethod>("cash")
  const [cashTendered, setCashTendered] = useState<string>("")
  const [showConfirm,  setShowConfirm]  = useState(false)

  const cashValue   = parseFloat(cashTendered) || 0
  const change      = cashValue - total
  const isValidCash = method !== "cash" || cashValue >= total

  useKeyboardShortcuts([
    { key: "Escape", ctrl: false, action: onBack, enabled: !showConfirm },
  ])

  const handleProceed = () => { if (isValidCash) setShowConfirm(true) }
  const handleConfirm = () => { setShowConfirm(false); onComplete() }

  const selectedMeta = METHOD_OPTIONS.find(m => m.id === method)!

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Header
        title="Payment"
        trailing={
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </Button>
        }
      />

      <main className="flex flex-1 overflow-hidden bg-bg">

        {/* Left — Bill summary panel */}
        <aside className="hidden w-[21.25rem] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card dark:bg-bg p-5 xl:flex">
          <div>
            <h2 className="text-[1.25rem] font-black leading-tight text-text">Bill Summary</h2>
            <p className="mt-0.5 text-[0.75rem] text-text-sec">
              {selectedTable.name} · Dine In
            </p>
          </div>

          {/* Item list */}
          <div className="flex-1">
            {cartItems.length === 0 ? (
              <p className="text-[0.8125rem] text-text-sec">No items in order</p>
            ) : (
              <div className="divide-y divide-border">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-[0.8125rem] font-bold text-text">{item.name}</p>
                      <p className="mt-0.5 text-[0.6875rem] text-text-sec">
                        {item.quantity} × {money.format(item.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.8125rem] font-black tabular-nums text-text">
                      {money.format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-border pt-4">
            <div className="flex justify-between text-[0.8125rem] text-text-sec">
              <span>Subtotal</span>
              <span className="tabular-nums">{money.format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[0.8125rem] text-text-sec">
              <span>GST (15%)</span>
              <span className="tabular-nums">{money.format(gst)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-[1.25rem] font-black text-text">
              <span>Total</span>
              <span className="tabular-nums text-primary">{money.format(total)}</span>
            </div>
          </div>
        </aside>

        {/* Right — Payment methods */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="mx-auto w-full max-w-2xl">

            {/* Mobile bill header (xl:hidden) */}
            <div className="mb-4 flex items-center justify-between xl:hidden">
              <div>
                <h2 className="text-[1.125rem] font-black text-text">{selectedTable.name} — Bill</h2>
                <p className="text-[0.75rem] text-text-sec">{cartItems.length} items</p>
              </div>
              <span className="text-[1.75rem] font-black tabular-nums text-primary">{money.format(total)}</span>
            </div>

            <h2 className="mb-3 text-[1.125rem] font-black text-text">Choose Payment Method</h2>

            {/* Method selector grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {METHOD_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 p-4",
                    "transition-[background-color,border-color,color,box-shadow,transform] duration-[160ms] ease-out",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    "active:scale-[0.97]",
                    method === opt.id
                      ? cn(opt.color, "shadow-warm")
                      : "border-border bg-card text-text-sec hover:bg-panel hover:border-border/80",
                  )}
                  onClick={() => setMethod(opt.id)}
                  aria-pressed={method === opt.id}
                  type="button"
                >
                  {opt.icon}
                  <span className="text-[0.9375rem] font-bold">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Method hint */}
            <p className="mt-2.5 text-center text-[0.75rem] text-text-sec">{selectedMeta.hint}</p>

            {/* Cash input section */}
            {method === "cash" && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-[0.9375rem] font-bold text-text">Cash Received</h3>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[1.125rem] font-black text-text-sec">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Enter amount"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-panel pl-10 pr-4 text-[1.125rem] font-black tabular-nums text-text outline-none transition-colors focus:border-primary focus:bg-card"
                    aria-label="Cash tendered"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, 1000].map((amt, i) => (
                    <button
                      key={i}
                      className={cn(
                        "h-8 rounded-full border px-4 text-[0.8125rem] font-bold",
                        "transition-[background-color,border-color,color] duration-150",
                        "active:scale-95",
                        cashValue === amt
                          ? "border-primary bg-primary-light text-primary-dark"
                          : "border-border bg-card text-text-sec hover:bg-panel",
                      )}
                      onClick={() => setCashTendered(String(amt))}
                      type="button"
                    >
                      {money.format(amt)}
                    </button>
                  ))}
                </div>

                {/* Change display */}
                {cashValue > 0 && (
                  <div
                    className={cn(
                      "mt-4 flex items-center justify-between rounded-xl px-4 py-3",
                      change >= 0 ? "bg-green-light" : "bg-danger/10",
                    )}
                  >
                    <span className={cn("text-[0.875rem] font-bold", change >= 0 ? "text-green" : "text-danger")}>
                      {change >= 0 ? "Change to Return" : "Amount Short"}
                    </span>
                    <span className={cn("text-[1.25rem] font-black tabular-nums", change >= 0 ? "text-green" : "text-danger")}>
                      {money.format(Math.abs(change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR */}
            {method === "upi" && (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-card p-6">
                <div className="flex size-48 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-panel">
                  <span className="text-center text-[0.8125rem] text-text-sec">
                    QR Code<br />Placeholder
                  </span>
                </div>
                <p className="mt-4 text-[0.9375rem] font-bold text-text">Amount: {money.format(total)}</p>
                <p className="mt-1 text-[0.75rem] text-text-sec">Customer scans to pay</p>
              </div>
            )}

            {/* Card / Credit */}
            {(method === "card" || method === "credit") && (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-card p-6">
                <CreditCard size={56} strokeWidth={1} className="text-blue" />
                <p className="mt-4 text-[0.9375rem] font-bold text-text">
                  {method === "card" ? "Tap, insert or swipe card" : "Record credit payment"}
                </p>
                <p className="mt-1 text-[0.75rem] text-text-sec">Amount: {money.format(total)}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={onBack} className="h-12 text-[0.9375rem]">
                <ArrowLeft size={16} /> Cancel
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!isValidCash}
                className="h-12 text-[0.9375rem]"
              >
                {method === "cash" && !isValidCash && cashValue > 0
                  ? `Short ${money.format(total - cashValue)}`
                  : "Continue →"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {showConfirm && (
        <ConfirmDialog
          method={method}
          total={total}
          cashTendered={cashValue}
          change={change}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
