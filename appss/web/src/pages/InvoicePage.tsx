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
  serviceCharge:   number
  total:           number
  paymentMethod:   PaymentMethod
  customerName:    string
  onBackToTables:  () => void
  isTemporary?:    boolean
  // Dynamic settings
  restaurantName?: string
  tagline?:        string
  address?:        string
  phone?:          string
  gstNumber?:      string
  receiptFooter?:  string
}

export function InvoicePage({
  selectedTable, cartItems, subtotal, gst, serviceCharge, total,
  paymentMethod, customerName, onBackToTables, isTemporary = false,
  restaurantName = "Hotel Grand",
  tagline        = "Restaurant & Family Dining",
  address        = "",
  phone          = "",
  gstNumber      = "",
  receiptFooter  = "Thank you for dining with us!",
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
          title={isTemporary ? "Temporary Bill" : "Invoice"}
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

          {/* ── Screen preview (non-print) ─── */}
          <Card className="overflow-hidden border border-border p-0 shadow-warm print:hidden print:shadow-none">
            {/* Receipt header */}
            <div className="bg-espresso px-5 py-6 text-center text-white">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary shadow-warm">
                <span className="text-[1.25rem]">🍽️</span>
              </div>
              <h1 className="text-[1.25rem] font-black tracking-tight">{restaurantName}</h1>
              <p className="mt-1 text-[0.6875rem] text-white/70">{tagline}</p>
              {address && <p className="mt-0.5 text-[0.625rem] text-white/50">{address}</p>}
              {phone && <p className="mt-0.5 text-[0.625rem] text-white/50">{phone}</p>}
              {gstNumber && <p className="mt-0.5 text-[0.625rem] text-white/50">GST: {gstNumber}</p>}
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
              <span className="text-text-sec">{isTemporary ? "Status" : "Payment"}</span>
              <span className="text-right font-bold capitalize text-text">{isTemporary ? "Temporary / Unpaid" : paymentMethod}</span>
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
              {gst > 0 && (
                <>
                  <div className="flex justify-between text-[0.75rem] text-text-sec">
                    <span>CGST</span>
                    <span className="tabular-nums">{money.format(Math.round(gst / 2))}</span>
                  </div>
                  <div className="flex justify-between text-[0.75rem] text-text-sec">
                    <span>SGST</span>
                    <span className="tabular-nums">{money.format(Math.round(gst / 2))}</span>
                  </div>
                </>
              )}
              {serviceCharge > 0 && (
                <div className="flex justify-between text-[0.75rem] text-text-sec">
                  <span>Service Charge</span>
                  <span className="tabular-nums">{money.format(serviceCharge)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-[1.125rem] font-black text-text">
                <span>Total</span>
                <span className="tabular-nums text-primary">{money.format(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center border-t border-dashed border-border px-4 pb-6 pt-4">
              {receiptFooter.split("\n").map((line, i) => (
                <p key={i} className="mt-1 text-center text-[0.75rem] font-bold text-text">{line}</p>
              ))}
              {phone && <p className="mt-0.5 text-center text-[0.625rem] text-text-sec">{restaurantName} · {phone}</p>}
              <p className="mt-4 text-center text-[0.5625rem] uppercase tracking-widest text-border">
                — End of Bill —
              </p>
            </div>
          </Card>

          {/* ── Thermal print target (hidden on screen, shown on print) ─── */}
          <div id="thermal-receipt" className="hidden print:block" style={{
            fontFamily: "'Courier New', Courier, monospace",
            width: "80mm",
            margin: "0 auto",
            padding: "8px 6px",
            color: "#000",
            background: "#fff",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "0.5px" }}>{restaurantName}</div>
              {isTemporary && <div style={{ fontSize: "12px", fontWeight: 900, color: "#000", marginTop: "2px" }}>*** TEMPORARY BILL ***</div>}
              {tagline && <div style={{ fontSize: "11px", fontWeight: 600 }}>{tagline}</div>}
              {address && <div style={{ fontSize: "10px" }}>{address}</div>}
              {phone && <div style={{ fontSize: "10px" }}>{phone}</div>}
              {gstNumber && <div style={{ fontSize: "10px" }}>GST: {gstNumber}</div>}
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Meta */}
            <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Order ID</span><span style={{ fontWeight: 700 }}>{orderId}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Date</span><span style={{ fontWeight: 700 }}>{dateStr}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Time</span><span style={{ fontWeight: 700 }}>{timeStr}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Table</span><span style={{ fontWeight: 700 }}>{selectedTable.name}</span></div>
              {customerName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Customer</span><span style={{ fontWeight: 700 }}>{customerName}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{isTemporary ? "Status" : "Payment"}</span><span style={{ fontWeight: 700, textTransform: "capitalize" }}>{isTemporary ? "Temporary / Unpaid" : paymentMethod}</span></div>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Items */}
            <div style={{ fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "3px" }}>
                <span style={{ flex: 1 }}>ITEM</span>
                <span style={{ width: "30px", textAlign: "center" }}>QTY</span>
                <span style={{ width: "60px", textAlign: "right" }}>AMT</span>
              </div>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", lineHeight: "1.5" }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "4px" }}>{item.name}</span>
                  <span style={{ width: "30px", textAlign: "center" }}>{item.quantity}</span>
                  <span style={{ width: "60px", textAlign: "right", fontWeight: 700 }}>{money.format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Totals */}
            <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{money.format(subtotal)}</span></div>
              {gst > 0 && <>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CGST</span><span>{money.format(Math.round(gst / 2))}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>SGST</span><span>{money.format(Math.round(gst / 2))}</span></div>
              </>}
              {serviceCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service Charge</span><span>{money.format(serviceCharge)}</span></div>
              )}
            </div>
            <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 900 }}>
              <span>TOTAL</span>
              <span>{money.format(total)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: "11px", marginTop: "6px" }}>
              {receiptFooter.split("\n").map((line, i) => (
                <div key={i} style={{ fontWeight: 600 }}>{line}</div>
              ))}
              <div style={{ marginTop: "8px", fontSize: "9px", letterSpacing: "1px" }}>*** END OF BILL ***</div>
            </div>
          </div>

          {/* Action buttons (hidden when printing) */}
          <div className="mt-5 flex gap-3 print:hidden">
            <Button variant="secondary" onClick={onBackToTables} className="h-11 flex-1">
              <ArrowLeft size={16} /> {isTemporary ? "Back to Tables" : "New Order"}
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
