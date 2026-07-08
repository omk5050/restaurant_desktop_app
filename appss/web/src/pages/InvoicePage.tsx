import { ArrowLeft, ReceiptText } from "lucide-react"
import { Button, Card } from "@/components/ui"
import { Header } from "@/components/layout"
import { type PaymentMethod } from "@/mocks/pos"
import { type ApiTable as DiningTable } from "@/store/tableStore"
import { money } from "@/utils/currency"
import type { CartItem } from "@/types/common"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface InvoicePageProps {
  selectedTable:   DiningTable
  cartItems:       CartItem[]
  subtotal:        number
  gst:             number
  total:           number
  paymentMethod:   PaymentMethod
  customerName:    string
  onBackToTables:  () => void
}

export function InvoicePage({
  selectedTable, cartItems, subtotal, gst, total,
  paymentMethod, customerName, onBackToTables,
}: InvoicePageProps) {
  const orderId  = `ORD-${Date.now().toString().slice(-6)}`
  const now      = new Date()
  const dateStr  = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const timeStr  = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  useKeyboardShortcuts([
    { key: "Escape", ctrl: false, action: onBackToTables },
    { key: "p",      ctrl: true,  action: () => window.print() },
  ])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="print:hidden">
        <Header
          title="Invoice"
          trailing={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onBackToTables}>
                <ArrowLeft size={16} /> Back to Tables
              </Button>
              <Button onClick={() => window.print()}>
                <ReceiptText size={16} /> Print (Ctrl+P)
              </Button>
            </div>
          }
        />
      </div>

      <main className="flex flex-1 overflow-y-auto bg-bg py-6 px-4">
        <div className="mx-auto w-full max-w-[25rem]">

          {/* Thermal receipt card */}
          <Card className="overflow-hidden border border-border p-0 shadow-warm print-receipt-card print:shadow-none print:border-0 print:bg-white">


            {/* Receipt header */}
            <div className="bg-espresso px-5 py-6 text-center text-white">
              {/* Logo placeholder */}
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary shadow-warm">
                <span className="text-[1.25rem]">🍽️</span>
              </div>
              <h1 className="text-[1.25rem] font-black tracking-tight">Hotel Grand</h1>
              <p className="mt-1 text-[0.6875rem] text-white/70">Restaurant & Family Dining</p>
              <p className="mt-0.5 text-[0.625rem] text-white/50">GST: 29ABCDE1234F1Z5</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-border px-4 py-3.5 text-[0.75rem]">
              <span className="text-text-sec">Order ID</span>
              <span className="text-right font-bold text-text">{orderId}</span>
              <span className="text-text-sec">Date</span>
              <span className="text-right font-bold text-text">{dateStr}</span>
              <span className="text-text-sec">Time</span>
              <span className="text-right font-bold text-text">{timeStr}</span>
              <span className="text-text-sec">Table</span>
              <span className="text-right font-bold text-text">{selectedTable.name}</span>
              {customerName && (
                <>
                  <span className="text-text-sec">Customer</span>
                  <span className="text-right font-bold text-text truncate">{customerName}</span>
                </>
              )}
              <span className="text-text-sec">Payment</span>
              <span className="text-right font-bold capitalize text-text">{paymentMethod}</span>
            </div>

            {/* Items */}
            <div className="px-4 py-3.5">
              <div className="mb-2 grid grid-cols-[1fr_2.5rem_5rem] gap-2 text-[0.5625rem] font-black uppercase tracking-wider text-text-sec">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="border-t border-dashed border-border pt-2">
                {cartItems.length === 0 ? (
                  <p className="py-4 text-center text-[0.75rem] text-text-sec">No items</p>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="grid grid-cols-[1fr_2.5rem_5rem] items-start gap-2 py-1 border-b border-dashed border-border/40 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate text-[0.75rem] font-bold text-text">{item.name}</p>
                          <p className="text-[0.625rem] text-text-sec">{money.format(item.price)} each</p>
                        </div>
                        <span className="text-center text-[0.75rem] font-bold text-text">{item.quantity}</span>
                        <span className="text-right text-[0.75rem] font-black tabular-nums text-text">
                          {money.format(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border px-4 py-3.5 space-y-1.5 bg-panel/30">
              <div className="flex justify-between text-[0.75rem] text-text-sec">
                <span>Subtotal</span>
                <span className="tabular-nums">{money.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[0.75rem] text-text-sec">
                <span>CGST (7.5%)</span>
                <span className="tabular-nums">{money.format(Math.round(gst / 2))}</span>
              </div>
              <div className="flex justify-between text-[0.75rem] text-text-sec">
                <span>SGST (7.5%)</span>
                <span className="tabular-nums">{money.format(Math.round(gst / 2))}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-[1.125rem] font-black text-text">
                <span>Total</span>
                <span className="tabular-nums text-primary">{money.format(total)}</span>
              </div>
            </div>

            {/* QR + footer */}
            <div className="flex flex-col items-center border-t border-dashed border-border px-4 pb-6 pt-4">
              {/* QR Placeholder */}
              <div className="flex size-24 items-center justify-center rounded-xl border border-dashed border-border bg-panel">
                <span className="text-center text-[0.5625rem] text-text-sec leading-tight">Scan to pay<br/>/ feedback</span>
              </div>
              <p className="mt-4 text-center text-[0.75rem] font-bold text-text">Thank you for dining with us!</p>
              <p className="mt-0.5 text-center text-[0.625rem] text-text-sec">Hotel Grand · +91 98765 43210</p>
              <p className="mt-4 text-center text-[0.5625rem] uppercase tracking-widest text-border">
                — End of Bill —
              </p>
            </div>
          </Card>

          {/* Action buttons (hidden when printing) */}
          <div className="mt-5 flex gap-3 print:hidden">
            <Button variant="secondary" onClick={onBackToTables} className="h-11 flex-1">
              <ArrowLeft size={16} /> New Order
            </Button>
            <Button onClick={() => window.print()} className="h-11 flex-1">
              <ReceiptText size={16} /> Print
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
