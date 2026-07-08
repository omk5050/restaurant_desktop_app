import { ArrowLeft, ReceiptText, Building2, Phone, Globe, Hash } from "lucide-react"
import { Button } from "@/components/ui"
import { Header } from "@/components/layout"
import { type PaymentMethod } from "@/mocks/pos"
import { type ApiTable as DiningTable } from "@/store/tableStore"
import type { CartItem } from "@/types/common"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useCurrency } from "@/hooks/useCurrency"
import { useDateTime } from "@/hooks/useDateTime"

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
  const fmt = useCurrency()
  const { formatDate, formatTime } = useDateTime()

  const orderId  = `ORD-${Date.now().toString().slice(-6)}`
  const now      = new Date()
  const dateStr  = formatDate(now)
  const timeStr  = formatTime(now)

  useKeyboardShortcuts([
    { key: "Escape", ctrl: false, action: onBackToTables },
    { key: "p",      ctrl: true,  action: () => window.print() },
  ])

  const cgst = Math.round(gst / 2)
  const sgst = gst - cgst

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
        <div className="mx-auto w-full max-w-[28rem]">

          {/* ── Screen preview (non-print) ─── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-warm-lg print:hidden">
            {/* Receipt header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-espresso via-espresso to-espresso/90 px-6 py-8 text-center text-white">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20" />
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-primary/10" />
              
              <div className="relative">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/20 ring-2 ring-primary/40 shadow-warm">
                  <span className="text-[1.5rem]">🍽️</span>
                </div>
                <h1 className="text-[1.5rem] font-black tracking-tight">{restaurantName}</h1>
                {tagline && <p className="mt-1 text-[0.75rem] font-medium text-white/70">{tagline}</p>}
                {address && (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/60">
                    <Building2 size={11} />
                    {address}
                  </p>
                )}
                {phone && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/60">
                    <Phone size={11} />
                    {phone}
                  </p>
                )}
                {gstNumber && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/60">
                    <Hash size={11} />
                    GST: {gstNumber}
                  </p>
                )}
                {isTemporary && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow/40 bg-yellow/20 px-3 py-1 text-[0.6875rem] font-bold text-yellow">
                    ⏳ TEMPORARY BILL — NOT YET PAID
                  </div>
                )}
              </div>
            </div>

            {/* Wavy separator */}
            <div className="flex h-3 w-full bg-panel">
              <svg viewBox="0 0 400 12" preserveAspectRatio="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,0 Q50,12 100,6 T200,6 T300,6 T400,0 L400,0 L0,0 Z" fill="rgb(var(--color-espresso, 41 21 14))" />
              </svg>
            </div>

            {/* Meta */}
            <div className="bg-panel/40 px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.75rem]">
                {[
                  { label: "Order ID", value: orderId },
                  { label: "Date",     value: dateStr },
                  { label: "Time",     value: timeStr },
                  { label: "Table",    value: selectedTable.name },
                  ...(customerName ? [{ label: "Customer", value: customerName }] : []),
                  { label: isTemporary ? "Status" : "Payment", value: isTemporary ? "Temporary / Unpaid" : paymentMethod },
                ].map(({ label, value }) => (
                  <div key={label} className="contents">
                    <span className="text-text-sec">{label}</span>
                    <span className="text-right font-bold capitalize text-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-4">
              <div className="mb-3 grid grid-cols-[1fr_2.5rem_5.5rem] gap-2">
                <span className="text-[0.5625rem] font-black uppercase tracking-wider text-text-sec">Item</span>
                <span className="text-center text-[0.5625rem] font-black uppercase tracking-wider text-text-sec">Qty</span>
                <span className="text-right text-[0.5625rem] font-black uppercase tracking-wider text-text-sec">Amount</span>
              </div>
              <div className="border-t border-dashed border-border" />
              {cartItems.length === 0 ? (
                <p className="py-4 text-center text-[0.75rem] text-text-sec">No items</p>
              ) : (
                <div className="divide-y divide-dashed divide-border/60">
                  {cartItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_2.5rem_5.5rem] items-center gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[0.8125rem] font-bold text-text">{item.name}</p>
                        <p className="text-[0.6875rem] text-text-sec">{fmt.format(item.price)} × {item.quantity}</p>
                      </div>
                      <span className="text-center text-[0.8125rem] font-bold text-text">{item.quantity}</span>
                      <span className="text-right text-[0.875rem] font-black tabular-nums text-text">
                        {fmt.format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border bg-panel/30 px-5 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[0.8125rem] text-text-sec">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt.format(subtotal)}</span>
                </div>
                {gst > 0 && (
                  <>
                    <div className="flex justify-between text-[0.8125rem] text-text-sec">
                      <span>CGST</span>
                      <span className="tabular-nums">{fmt.format(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-[0.8125rem] text-text-sec">
                      <span>SGST</span>
                      <span className="tabular-nums">{fmt.format(sgst)}</span>
                    </div>
                  </>
                )}
                {serviceCharge > 0 && (
                  <div className="flex justify-between text-[0.8125rem] text-text-sec">
                    <span>Service Charge</span>
                    <span className="tabular-nums">{fmt.format(serviceCharge)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-primary px-4 py-3">
                <span className="text-[1rem] font-black text-white">TOTAL</span>
                <span className="text-[1.375rem] font-black tabular-nums text-white">{fmt.format(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center gap-2 border-t border-dashed border-border px-5 pb-6 pt-4 text-center">
              {receiptFooter.split("\n").map((line, i) => (
                <p key={i} className="text-[0.8125rem] font-bold text-text">{line}</p>
              ))}
              {phone && (
                <p className="flex items-center gap-1 text-[0.6875rem] text-text-sec">
                  <Globe size={10} />
                  {restaurantName} · {phone}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="h-px w-12 bg-border" />
                <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-border">End of Bill</p>
                <span className="h-px w-12 bg-border" />
              </div>
            </div>
          </div>

          {/* ── Thermal print target (hidden on screen, shown on print) ─── */}
          <div id="thermal-receipt" className="hidden print:block" style={{
            fontFamily: "'Courier New', Courier, monospace",
            width: "80mm",
            margin: "0 auto",
            padding: "8px 6px",
            color: "#000",
            background: "#fff",
            boxSizing: "border-box",
          }}>
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
                #thermal-receipt {
                  position: fixed;
                  left: 0;
                  top: 0;
                  width: 80mm;
                  padding: 8px 6px;
                  margin: 0;
                  background: #fff !important;
                }
              }
            `}</style>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "6px" }}>
              <div style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "1px" }}>{restaurantName}</div>
              {isTemporary && <div style={{ fontSize: "11px", fontWeight: 900, marginTop: "2px" }}>*** TEMPORARY BILL ***</div>}
              {tagline && <div style={{ fontSize: "11px", fontWeight: 600 }}>{tagline}</div>}
              {address && <div style={{ fontSize: "10px", marginTop: "2px" }}>{address}</div>}
              {phone && <div style={{ fontSize: "10px" }}>{phone}</div>}
              {gstNumber && <div style={{ fontSize: "10px" }}>GST: {gstNumber}</div>}
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Meta */}
            <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Order ID</span><span style={{ fontWeight: 700 }}>{orderId}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Date</span><span style={{ fontWeight: 700 }}>{dateStr}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Time</span><span style={{ fontWeight: 700 }}>{timeStr}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Table</span><span style={{ fontWeight: 700 }}>{selectedTable.name}</span></div>
              {customerName && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Customer</span><span style={{ fontWeight: 700 }}>{customerName}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{isTemporary ? "Status" : "Payment"}</span><span style={{ fontWeight: 700, textTransform: "capitalize" }}>{isTemporary ? "Temporary / Unpaid" : paymentMethod}</span></div>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Items header */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 900, marginBottom: "3px" }}>
              <span style={{ flex: 1 }}>ITEM</span>
              <span style={{ width: "30px", textAlign: "center" }}>QTY</span>
              <span style={{ width: "60px", textAlign: "right" }}>AMT</span>
            </div>
            <div style={{ borderTop: "1px dashed #000", marginBottom: "4px" }} />

            {/* Items */}
            <div style={{ fontSize: "11px" }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", lineHeight: "1.6", marginBottom: "2px" }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "4px" }}>{item.name}</span>
                  <span style={{ width: "30px", textAlign: "center" }}>{item.quantity}</span>
                  <span style={{ width: "60px", textAlign: "right", fontWeight: 700 }}>{fmt.format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

            {/* Totals */}
            <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{fmt.format(subtotal)}</span></div>
              {gst > 0 && <>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>CGST</span><span>{fmt.format(cgst)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>SGST</span><span>{fmt.format(sgst)}</span></div>
              </>}
              {serviceCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Service Charge</span><span>{fmt.format(serviceCharge)}</span></div>
              )}
            </div>
            <div style={{ borderTop: "2px solid #000", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 900 }}>
              <span>TOTAL</span>
              <span>{fmt.format(total)}</span>
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
