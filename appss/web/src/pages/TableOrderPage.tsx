import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import {
  ArrowLeft, BadgeIndianRupee, Minus, Plus, ShieldCheck, Trash2, Utensils,
  Search, StickyNote, Receipt, Printer, CreditCard, ClipboardList, Pause,
  Layers2, Percent, X, Check, AlertTriangle, Leaf, Drumstick,
  type LucideIcon,
  Soup, Salad, Beef, Fish, GlassWater, IceCream,
  UtensilsCrossed, Flame, Star, Layers, Cookie, CupSoda, Wheat,
} from "lucide-react"
import { Input } from "@/components/ui"
import { cn } from "@/lib/cn"
import { useTableStore, type ApiTable as DiningTable } from "@/store/tableStore"
import { useOrderStore } from "@/store/orderStore"
import { useKotStore } from "@/store/kotStore"
import { money } from "@/utils/currency"
import type { UseCartReturn } from "@/hooks/useCart"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useMenuStore } from "@/store/menuStore"
import { useSettingsStore } from "@/store/settingsStore"

type PosCategory = string
type VegFilter = "all" | "veg" | "nonveg"

// ─────────────────────────────────────────────────────────────────────────────
// Category icon map
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "Hyderabadi Dum Biryani":   UtensilsCrossed,
  "Non-Veg Tandoor & Kebabs": Flame,
  "Veg Starters":             Salad,
  "Non-Veg Starters":         Drumstick,
  "Egg Starters":             Layers,
  "Veg":                      Salad,
  "Chicken":                  Drumstick,
  "Mutton":                   Beef,
  "Fish":                     Fish,
  "Family Combo":             Star,
  "Veg Soup":                 Soup,
  "Chicken Soup":             Soup,
  "Biryani":                  UtensilsCrossed,
  "Tandoor Platter":          Flame,
  "Ice Cream":                IceCream,
  "Tandoori Combo":           Flame,
  "Golden Family Combo":      Star,
  "Seafood":                  Fish,
  "Breads":                   Wheat,
  "Rice & Pulao":             Layers,
  "Beverages":                CupSoda,
  "Desserts":                 Cookie,
  "Drinks":                   GlassWater,
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Modal backdrop
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CategorySidebar
// ─────────────────────────────────────────────────────────────────────────────
function CategorySidebar({ categories, active, itemCounts, apiCategories, onSelect }: {
  categories:    readonly string[]
  active:        string
  itemCounts:    Record<string, number>
  apiCategories: import("@/store/menuStore").ApiCategory[]
  onSelect:      (cat: string) => void
}) {
  return (
    <nav
      aria-label="Menu categories"
      className="flex w-[10rem] shrink-0 flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden border-r border-border bg-card dark:bg-bg"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map(cat => {
        const category = apiCategories.find(c => c.name === cat)
        const emoji    = category?.icon
        const Icon     = CATEGORY_ICON_MAP[cat] ?? Utensils
        const isActive = cat === active
        const count    = itemCounts[cat] ?? 0

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            aria-label={cat}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative flex h-[5.75rem] w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border px-2 text-center",
              "transition-[background-color,color,box-shadow,border-color] duration-[160ms] ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              isActive
                ? "bg-primary border-primary text-white shadow-warm-lg"
                : "bg-card text-text-sec shadow-sm hover:border-primary-mid hover:text-primary hover:-translate-y-[1px]",
            )}
          >
            <span
              className={cn(
                "absolute inset-y-3 left-0 w-[4px] rounded-r-full transition-[opacity,background-color] duration-[160ms]",
                isActive ? "bg-white/80 opacity-100" : "opacity-0",
              )}
            />
            {count > 0 && (
              <span
                className={cn(
                  "absolute right-2 top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5",
                  "text-[0.625rem] font-black tabular-nums leading-none",
                  isActive ? "bg-white/90 text-primary shadow-sm" : "bg-panel text-text-sec",
                )}
              >
                {count}
              </span>
            )}
            {emoji ? (
              <span className="text-[1.5rem] shrink-0 leading-none" aria-hidden="true">
                {emoji}
              </span>
            ) : (
              <Icon
                size={24}
                strokeWidth={isActive ? 2.25 : 1.75}
                className={cn("shrink-0", isActive ? "text-white" : "text-text")}
              />
            )}
            <span className="line-clamp-2 w-full px-1 text-[0.6875rem] font-bold leading-tight tracking-tight">
              {cat}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuCard
// ─────────────────────────────────────────────────────────────────────────────
function MenuCard({ item, quantity, onIncrease, onDecrease }: {
  item:       { id: string; name: string; price: number; image: string; emoji: string; isVeg: boolean; categoryName: string; isAvailable: boolean }
  quantity:   number
  onIncrease: () => void
  onDecrease: () => void
}) {
  const isVeg = item.isVeg

  return (
    <article
      className={cn(
        "flex h-[19rem] w-[14.5rem] flex-col overflow-hidden rounded-3xl border bg-card",
        "transition-[border-color,box-shadow,transform] duration-[180ms] ease-out",
        "hover:-translate-y-1 hover:shadow-warm-lg",
        quantity > 0
          ? "border-primary shadow-warm-lg"
          : "border-border shadow-warm hover:border-primary/50",
      )}
    >
      {/* ── Image area ─── */}
      <div className="relative h-[9rem] w-full shrink-0 overflow-hidden bg-panel/50 pt-3 flex items-center justify-center">
        {item.image ? (
          <img
            alt={item.name}
            src={item.image}
            className="h-[7.5rem] w-auto max-w-[85%] object-contain drop-shadow-md mix-blend-multiply"
          />
        ) : (
          <span className="text-[4rem]">{item.emoji}</span>
        )}
        {/* Veg/Non-Veg indicator */}
        <span
          className={cn(
            "absolute right-3 top-3 flex size-5 items-center justify-center rounded-sm border-2 border-card",
            isVeg ? "bg-green-light" : "bg-danger/10",
          )}
        >
          <span className={cn("block size-2.5 rounded-full", isVeg ? "bg-green" : "bg-danger")} />
        </span>
      </div>

      {/* ── Text + controls ─────────── */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-center">
        <p className="line-clamp-2 h-[2.5rem] text-[0.875rem] font-black leading-tight text-text">
          {item.name}
        </p>
        <div className="mt-1.5 flex items-center justify-center">
          {item.price > 0
            ? (
              <span className="text-[1.125rem] font-black text-primary">
                {money.format(item.price)}
              </span>
            )
            : (
              <span className="text-[0.875rem] font-bold text-text-sec">
                Custom price
              </span>
            )
          }
        </div>

        {/* ── Quantity controls ─────── */}
        <div className="mt-auto flex items-center justify-between gap-1.5 rounded-2xl border border-border bg-panel px-2 py-2">
          <button
            type="button"
            aria-label={`Decrease ${item.name}`}
            disabled={quantity === 0}
            onClick={onDecrease}
            className={cn(
              "flex h-[2.25rem] w-[2.5rem] items-center justify-center rounded-[0.875rem] border",
              "transition-[background-color,border-color,color,transform] duration-[140ms] ease-out",
              "active:scale-[0.92]",
              quantity === 0
                ? "cursor-not-allowed border-transparent bg-transparent text-text-sec/40"
                : "border-border bg-card text-text-sec shadow-sm hover:border-primary/50 hover:text-primary",
            )}
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span
            key={quantity}
            className="animate-qty min-w-[1.5rem] text-center text-[1rem] font-black tabular-nums text-text"
            style={{ display: "inline-block" }}
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase ${item.name}`}
            onClick={onIncrease}
            className={cn(
              "flex h-[2.25rem] w-[2.5rem] items-center justify-center rounded-[0.875rem]",
              "bg-primary text-white shadow-sm",
              "transition-[background-color,transform] duration-[140ms] ease-out",
              "hover:bg-primary-dark active:scale-[0.92]",
            )}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KOT Receipt (print target)
// ─────────────────────────────────────────────────────────────────────────────
function KotReceiptPrint({ tableName, orderNo, items, kitchenNote }: {
  tableName:   string
  orderNo:     string
  items:       Array<{ name: string; quantity: number; kotSent: boolean }>
  kitchenNote: string
}) {
  const now = new Date()
  
  // Format Date to match: 8/7/2026, 2:16:23 am
  const day = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  
  let hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const dateStr = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`

  const unsentItems = items.filter(i => !i.kotSent)

  const displayOrderNo = orderNo.startsWith("#") ? orderNo : `#${orderNo}`

  return (
    <div id="kot-receipt" className="hidden print:block text-black bg-white" style={{ fontFamily: "'Courier New', Courier, monospace", width: "80mm", padding: "10px", boxSizing: "border-box" }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #kot-receipt, #kot-receipt * {
            visibility: visible;
          }
          #kot-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
      <div className="text-center font-bold text-[18px] tracking-wide mb-1" style={{ fontWeight: 900 }}>
        KITCHEN ORDER (KOT)
      </div>
      <div className="text-center text-[13px] tracking-tight leading-none mb-2" style={{ fontWeight: 900, letterSpacing: "-1px" }}>
        ----------------------------------------
      </div>
      
      <div className="text-left text-[15px] font-bold space-y-1" style={{ fontWeight: 900, lineHeight: "1.4" }}>
        <div>TABLE/ORDER: {tableName}</div>
        <div>ORDER NO : {displayOrderNo}</div>
        <div>DATE : {dateStr}</div>
      </div>

      <div className="text-center text-[13px] tracking-tight leading-none my-2" style={{ fontWeight: 900, letterSpacing: "-1px" }}>
        ----------------------------------------
      </div>

      <div className="text-left text-[16px] font-bold space-y-1" style={{ fontWeight: 900, lineHeight: "1.4" }}>
        {unsentItems.map((item, idx) => (
          <div key={idx}>
            {item.name} x{item.quantity}
          </div>
        ))}
      </div>

      <div className="text-center text-[13px] tracking-tight leading-none my-2" style={{ fontWeight: 900, letterSpacing: "-1px" }}>
        ----------------------------------------
      </div>

      {kitchenNote && (
        <>
          <div className="text-left text-[14px] font-bold mb-1" style={{ fontWeight: 900 }}>
            <span className="underline">Note:</span> {kitchenNote}
          </div>
          <div className="text-center text-[13px] tracking-tight leading-none my-2" style={{ fontWeight: 900, letterSpacing: "-1px" }}>
            ----------------------------------------
          </div>
        </>
      )}

      <div className="text-center text-[14px] font-bold" style={{ fontWeight: 900 }}>
        Kitchen Copy
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared button styles
// ─────────────────────────────────────────────────────────────────────────────
const BTN_PRIMARY   = "flex h-9 items-center justify-center gap-1 rounded-xl bg-primary px-2 text-[0.6875rem] font-bold text-white transition-[background-color,transform] duration-[140ms] hover:bg-primary-dark active:scale-95"
const BTN_DARK      = "flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-[0.6875rem] font-bold text-white transition-[background-color,transform] duration-[140ms] hover:bg-ink/85 active:scale-95"
const BTN_DARK_DIS  = "flex h-9 items-center justify-center gap-1 rounded-xl bg-ink/40 px-2 text-[0.6875rem] font-bold text-white/60 cursor-not-allowed"
const BTN_OUTLINED  = "flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-card px-2 text-[0.6875rem] font-bold text-text-sec transition-[border-color,background-color,color,transform] duration-[140ms] hover:border-primary hover:bg-primary-light hover:text-primary active:scale-95"
const BTN_OUTLINED_ACTIVE = "flex h-9 items-center justify-center gap-1 rounded-xl border border-primary bg-primary-light px-2 text-[0.6875rem] font-bold text-primary active:scale-95"

// ─────────────────────────────────────────────────────────────────────────────
// OrderSummary — right panel
// ─────────────────────────────────────────────────────────────────────────────

interface BillingState {
  gstEnabled:     boolean
  gstRate:        number          // e.g. 5
  extraCharges:   Array<{ id: string; name: string; value: number; isPercent: boolean }>
  discountType:   "percent" | "flat"
  discountValue:  number
}

function computeTotals(subtotal: number, billing: BillingState) {
  const gstAmount    = billing.gstEnabled ? Math.round(subtotal * billing.gstRate / 100) : 0
  const extraTotal   = billing.extraCharges.reduce((s, c) =>
    s + (c.isPercent ? Math.round(subtotal * c.value / 100) : c.value), 0)
  const afterTax     = subtotal + gstAmount + extraTotal
  const discAmt      = billing.discountType === "percent"
    ? Math.round(afterTax * billing.discountValue / 100)
    : billing.discountValue
  const total        = Math.max(0, afterTax - discAmt)
  return { gstAmount, extraTotal, discAmt, total }
}

function OrderSummary({
  selectedTable, customerName, cart, billing,
  onKitchenNoteClick, kitchenNote,
  onKot, onKotPrint, onSave, onPay, onHold,
  onSplitBill, onTax, onDiscount, onDecreaseItem,
}: {
  selectedTable:      DiningTable
  customerName:       string
  cart:               UseCartReturn
  billing:            BillingState
  kitchenNote:        string
  onKitchenNoteClick: () => void
  onKot:              () => void
  onKotPrint:         () => void
  onSave:             () => void
  onPay:              () => void
  onHold:             () => void
  onSplitBill:        () => void
  onTax:              () => void
  onDiscount:         () => void
  onDecreaseItem:     (item: { id: string; name: string; kotSent: boolean }) => void
}) {
  const { gstAmount, discAmt, total } = computeTotals(cart.subtotal, billing)

  const hasActive = billing.gstEnabled || billing.extraCharges.length > 0
  const hasDisc   = billing.discountValue > 0

  return (
    <aside className="hidden w-[21rem] shrink-0 flex-col border-l border-border bg-card dark:bg-bg xl:flex">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-text-sec/70">
              Current Order
            </p>
            <h2 className="mt-0.5 truncate text-[1.125rem] font-black leading-tight text-primary">
              Table {selectedTable.name}
            </h2>
            {customerName && (
              <p className="mt-0.5 truncate text-[0.75rem] text-text-sec">{customerName}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-[0.6875rem] font-black text-primary">
            Dine In
          </span>
        </div>

        {/* Tab switcher */}
        <div className="mt-3 flex gap-1 rounded-xl bg-panel p-1">
          <button
            type="button"
            className="flex-1 rounded-xl bg-card py-1.5 text-[0.75rem] font-bold text-primary shadow-sm transition"
          >
            Dine In
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl py-1.5 text-[0.75rem] font-semibold text-text-sec transition hover:text-primary"
          >
            Pick Up
          </button>
        </div>
      </div>

      {/* ── Column headers ─────────────────────────────────────────── */}
      <div className="grid shrink-0 grid-cols-[1fr_1.5rem_5rem_3.5rem] gap-1 border-b border-border bg-panel/60 px-4 py-1.5 text-[0.5625rem] font-black uppercase tracking-widest text-text-sec/70">
        <span>Item</span>
        <span className="text-center">KOT</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
      </div>

      {/* ── Item list ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {cart.cartItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-panel shadow-warm">
              <Utensils size={24} strokeWidth={1.25} className="text-border" />
            </div>
            <p className="text-[0.8125rem] font-bold text-text-sec">No items yet</p>
            <p className="text-[0.75rem] leading-snug text-text-sec/60">
              Tap the + button on any dish to add it here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border px-4">
            {cart.cartItems.map(item => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_1.5rem_5rem_3.5rem] items-center gap-1 py-2"
              >
                {/* Name */}
                <span
                  className="truncate text-[0.8125rem] font-semibold text-text"
                  title={item.name}
                >
                  {item.name}
                </span>

                {/* KOT status */}
                <div className="flex justify-center">
                  {item.kotSent ? (
                    <div className="flex size-[1.125rem] items-center justify-center rounded-[0.25rem] bg-green text-white">
                      <ShieldCheck size={11} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="flex size-[1.125rem] items-center justify-center rounded-[0.25rem] bg-yellow/80 text-white">
                      <span className="text-[0.5rem] font-black">NEW</span>
                    </div>
                  )}
                </div>

                {/* Qty stepper */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    className="flex size-[1.25rem] items-center justify-center rounded-full border border-border bg-card text-text-sec transition hover:border-primary hover:text-primary active:scale-90"
                    onClick={() => onDecreaseItem(item)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={9} strokeWidth={2.5} />
                  </button>
                  <span className="w-5 text-center text-[0.8125rem] font-black tabular-nums text-text">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex size-[1.25rem] items-center justify-center rounded-full border border-border bg-card text-text-sec transition hover:border-primary hover:text-primary active:scale-90"
                    onClick={() => cart.addItem(item)}
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={9} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Line total */}
                <span className="text-right text-[0.8125rem] font-black tabular-nums text-text">
                  {money.format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border pt-2">

        {/* Totals */}
        <div className="space-y-1 px-4 pb-2">
          {cart.cartItems.length > 0 && (
            <>
              <div className="flex justify-between text-[0.75rem] text-text-sec">
                <span>Subtotal</span>
                <span className="tabular-nums">{money.format(cart.subtotal)}</span>
              </div>
              {billing.gstEnabled && (
                <div className="flex justify-between text-[0.75rem] text-text-sec">
                  <span>GST ({billing.gstRate}%)</span>
                  <span className="tabular-nums">{money.format(gstAmount)}</span>
                </div>
              )}
              {billing.extraCharges.map(c => (
                <div key={c.id} className="flex justify-between text-[0.75rem] text-text-sec">
                  <span>{c.name}{c.isPercent ? ` (${c.value}%)` : ""}</span>
                  <span className="tabular-nums">
                    {money.format(c.isPercent ? Math.round(cart.subtotal * c.value / 100) : c.value)}
                  </span>
                </div>
              ))}
              {hasDisc && (
                <div className="flex justify-between text-[0.75rem] text-green">
                  <span>Discount{billing.discountType === "percent" ? ` (${billing.discountValue}%)` : ""}</span>
                  <span className="tabular-nums">-{money.format(discAmt)}</span>
                </div>
              )}
              <div className="mt-0.5 border-t border-border/60 pt-1.5" />
            </>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-[0.875rem] font-bold text-text">Total</span>
            <span className="text-[1.125rem] font-black tabular-nums text-primary">
              {cart.cartItems.length > 0 ? money.format(total) : "₹0"}
            </span>
          </div>
        </div>

        {/* Primary actions row */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1.5">
          <button onClick={onSave} className={BTN_PRIMARY}>
            <Receipt size={12} />Save
          </button>
          <button onClick={onSave} className={BTN_PRIMARY}>
            <Printer size={12} />Save &amp; Print
          </button>
          <button onClick={onPay} className={cn(BTN_OUTLINED, "border-primary text-primary hover:bg-primary-light")}>
            <CreditCard size={12} />Pay Bill
          </button>
        </div>

        {/* KOT actions row */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1.5">
          <button
            onClick={onKot}
            disabled={!cart.hasUnsentItems}
            className={cart.hasUnsentItems ? BTN_DARK : BTN_DARK_DIS}
            title={cart.hasUnsentItems ? "Send KOT" : "No new items to KOT"}
          >
            <ClipboardList size={12} />KOT
          </button>
          <button
            onClick={onKotPrint}
            disabled={!cart.hasUnsentItems}
            className={cart.hasUnsentItems ? BTN_DARK : BTN_DARK_DIS}
            title={cart.hasUnsentItems ? "Send KOT & Print" : "No new items to KOT"}
          >
            <Printer size={12} />KOT &amp; Print
          </button>
          <button onClick={onHold} className={BTN_OUTLINED}>
            <Pause size={12} />Hold
          </button>
        </div>

        {/* Billing actions row */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1.5">
          <button onClick={onSplitBill} className={BTN_OUTLINED}>
            <Layers2 size={12} />Split Bill
          </button>
          <button onClick={onTax} className={hasActive ? BTN_OUTLINED_ACTIVE : BTN_OUTLINED}>
            <Percent size={12} />TAX
          </button>
          <button onClick={onDiscount} className={hasDisc ? BTN_OUTLINED_ACTIVE : BTN_OUTLINED}>
            <BadgeIndianRupee size={12} />Discount
          </button>
        </div>

        {/* Kitchen note (click to open popup) */}
        <div className="px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={onKitchenNoteClick}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-xl border bg-panel px-3 text-left transition-[border-color,background-color]",
              kitchenNote ? "border-primary bg-primary-light" : "border-border hover:border-primary",
            )}
          >
            <StickyNote size={13} className={cn("shrink-0", kitchenNote ? "text-primary" : "text-text-sec/60")} />
            <span className={cn("flex-1 truncate text-[0.75rem]", kitchenNote ? "text-primary font-semibold" : "text-text-sec/50")}>
              {kitchenNote || "Kitchen note (KOT only)…"}
            </span>
            {kitchenNote && <span className="text-[0.6rem] font-bold text-primary">EDIT</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KitchenNote Modal
// ─────────────────────────────────────────────────────────────────────────────
function KitchenNoteModal({ value, onSave, onClose }: {
  value:   string
  onSave:  (v: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState(value)
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-modal">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-black text-text">Kitchen Note</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full border border-border text-text-sec hover:bg-panel">
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-[0.75rem] text-text-sec">This note will appear on the KOT receipt sent to the kitchen.</p>
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Extra spicy, no onion on table 5…"
          rows={4}
          className="mt-4 w-full resize-none rounded-xl border border-border bg-panel px-3 py-2.5 text-[0.875rem] text-text outline-none transition-[border-color] focus:border-primary"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className={cn(BTN_OUTLINED, "px-5")}>Cancel</button>
          <button onClick={() => { onSave(note); onClose() }} className={cn(BTN_PRIMARY, "px-6")}>
            <Check size={14} />Save Note
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reason Modal (used for Clear and Item Removal after KOT)
// ─────────────────────────────────────────────────────────────────────────────
function ReasonModal({ title, description, onConfirm, onClose }: {
  title:       string
  description: string
  onConfirm:   (reason: string) => void
  onClose:     () => void
}) {
  const [reason, setReason] = useState("")
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-modal">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-danger/10">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div>
            <h2 className="text-[1.125rem] font-black text-text">{title}</h2>
            <p className="mt-1 text-[0.75rem] text-text-sec">{description}</p>
          </div>
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter reason…"
          rows={3}
          className="mt-4 w-full resize-none rounded-xl border border-border bg-panel px-3 py-2.5 text-[0.875rem] text-text outline-none transition-[border-color] focus:border-primary"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className={cn(BTN_OUTLINED, "px-5")}>Cancel</button>
          <button
            onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); onClose() } }}
            disabled={!reason.trim()}
            className={cn(!reason.trim() ? "opacity-40 cursor-not-allowed " : "", BTN_PRIMARY.replace("bg-primary", "bg-danger hover:bg-danger/85"), "px-5")}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KOT Sent Toast
// ─────────────────────────────────────────────────────────────────────────────
function KotSentToast({ tableName }: { tableName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-card px-10 py-8 shadow-modal border border-border animate-scale-in">
        <div className="flex size-16 items-center justify-center rounded-full bg-green/10">
          <ClipboardList size={32} className="text-green" />
        </div>
        <div className="text-center">
          <p className="text-[1.5rem] font-black text-text">KOT Sent!</p>
          <p className="mt-1 text-[0.9375rem] text-text-sec">
            Kitchen Order for <span className="font-bold text-primary">Table {tableName}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Split Bill Modal
// ─────────────────────────────────────────────────────────────────────────────
function SplitBillModal({ total, onClose }: { total: number; onClose: () => void }) {
  const [mode, setMode] = useState<"equal" | "manual">("equal")
  const [parts, setParts] = useState(2)
  const [manualValues, setManualValues] = useState<string[]>(["", ""])

  const equalAmt = Math.floor(total / parts)
  const remainder = total - equalAmt * parts

  const updateParts = (n: number) => {
    setParts(n)
    setManualValues(Array(n).fill(""))
  }

  const manualTotal = manualValues.reduce((s, v) => s + (parseFloat(v) || 0), 0)

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-modal">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-black text-text">Split Bill</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full border border-border text-text-sec hover:bg-panel">
            <X size={16} />
          </button>
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-text-sec">Total: <span className="font-black text-primary">{money.format(total)}</span></p>

        {/* Mode toggle */}
        <div className="mt-4 flex gap-1 rounded-xl bg-panel p-1">
          <button
            type="button"
            onClick={() => setMode("equal")}
            className={cn("flex-1 rounded-xl py-2 text-[0.8125rem] font-bold transition", mode === "equal" ? "bg-card text-primary shadow-sm" : "text-text-sec")}
          >
            Equal Split
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn("flex-1 rounded-xl py-2 text-[0.8125rem] font-bold transition", mode === "manual" ? "bg-card text-primary shadow-sm" : "text-text-sec")}
          >
            Manual Split
          </button>
        </div>

        {mode === "equal" ? (
          <div className="mt-4">
            <p className="text-[0.75rem] font-bold text-text-sec mb-2">Number of sections</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateParts(Math.max(2, parts - 1))}
                className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-text-sec hover:border-primary hover:text-primary"
              >
                <Minus size={16} />
              </button>
              <span className="text-[1.5rem] font-black tabular-nums text-text w-10 text-center">{parts}</span>
              <button
                type="button"
                onClick={() => updateParts(Math.min(10, parts + 1))}
                className="flex size-9 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {Array.from({ length: parts }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-panel px-4 py-2.5">
                  <span className="text-[0.875rem] font-bold text-text">Section {i + 1}</span>
                  <span className="text-[0.9375rem] font-black tabular-nums text-primary">
                    {money.format(equalAmt + (i === 0 ? remainder : 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.75rem] font-bold text-text-sec">Enter amounts per section</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => updateParts(Math.max(2, parts - 1))} className="flex size-7 items-center justify-center rounded-lg border border-border text-text-sec hover:text-primary"><Minus size={12} /></button>
                <span className="text-[0.75rem] font-bold tabular-nums text-text w-6 text-center">{parts}</span>
                <button type="button" onClick={() => updateParts(Math.min(10, parts + 1))} className="flex size-7 items-center justify-center rounded-lg bg-primary text-white"><Plus size={12} /></button>
              </div>
            </div>
            <div className="grid gap-2">
              {manualValues.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 text-[0.75rem] font-bold text-text-sec w-20">Section {i + 1}</span>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.875rem] font-bold text-text-sec">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={v}
                      onChange={e => {
                        const next = [...manualValues]
                        next[i] = e.target.value
                        setManualValues(next)
                      }}
                      className="h-9 w-full rounded-xl border border-border bg-panel pl-7 pr-3 text-[0.875rem] tabular-nums text-text outline-none focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={cn(
              "mt-3 flex items-center justify-between rounded-xl px-4 py-2.5",
              Math.abs(manualTotal - total) < 0.01 ? "bg-green/10" : "bg-danger/10",
            )}>
              <span className={cn("text-[0.8125rem] font-bold", Math.abs(manualTotal - total) < 0.01 ? "text-green" : "text-danger")}>
                {Math.abs(manualTotal - total) < 0.01 ? "✓ Balanced" : `Remaining: ${money.format(total - manualTotal)}`}
              </span>
              <span className={cn("tabular-nums font-black", Math.abs(manualTotal - total) < 0.01 ? "text-green" : "text-danger")}>
                {money.format(manualTotal)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className={cn(BTN_OUTLINED, "px-5")}>Close</button>
          <button onClick={onClose} className={cn(BTN_PRIMARY, "px-6")}>
            <Check size={14} />Confirm Split
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tax Modal
// ─────────────────────────────────────────────────────────────────────────────
function TaxModal({ billing, subtotal, onSave, onClose }: {
  billing:  BillingState
  subtotal: number
  onSave:   (b: Partial<BillingState>) => void
  onClose:  () => void
}) {
  const [gstEnabled, setGstEnabled] = useState(billing.gstEnabled)
  const [gstRate, setGstRate]       = useState(billing.gstRate)
  const [charges, setCharges]       = useState(billing.extraCharges)
  const [newName, setNewName]       = useState("")
  const [newVal, setNewVal]         = useState("")
  const [newPct, setNewPct]         = useState(false)

  const addCharge = () => {
    if (!newName.trim() || !newVal) return
    setCharges(prev => [...prev, { id: crypto.randomUUID(), name: newName.trim(), value: parseFloat(newVal), isPercent: newPct }])
    setNewName(""); setNewVal("")
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-modal">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-black text-text">Tax & Charges</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full border border-border text-text-sec hover:bg-panel"><X size={16} /></button>
        </div>

        {/* GST toggle */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-panel px-4 py-3">
          <div>
            <p className="text-[0.875rem] font-bold text-text">GST</p>
            <p className="text-[0.75rem] text-text-sec">Government tax on order</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={gstRate}
              onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
              className="h-8 w-16 rounded-xl border border-border bg-card px-2 text-center text-[0.8125rem] font-bold outline-none focus:border-primary"
            />
            <span className="text-[0.75rem] text-text-sec">%</span>
            <button
              type="button"
              onClick={() => setGstEnabled(p => !p)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                gstEnabled ? "bg-green" : "bg-border",
              )}
            >
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", gstEnabled ? "left-5" : "left-0.5")} />
            </button>
          </div>
        </div>

        {/* Extra charges */}
        <div className="mt-4">
          <p className="text-[0.75rem] font-bold uppercase tracking-wider text-text-sec mb-2">Additional Charges</p>
          {charges.length > 0 && (
            <div className="mb-3 flex flex-col gap-1.5">
              {charges.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2">
                  <span className="text-[0.8125rem] font-bold text-text">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] tabular-nums text-primary font-bold">
                      {c.isPercent ? `${c.value}%` : money.format(c.value)}
                      {c.isPercent && <span className="text-text-sec text-[0.6875rem] ml-1">({money.format(Math.round(subtotal * c.value / 100))})</span>}
                    </span>
                    <button type="button" onClick={() => setCharges(prev => prev.filter(x => x.id !== c.id))} className="flex size-7 items-center justify-center rounded-lg text-text-sec hover:bg-danger/10 hover:text-danger">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Add new charge */}
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Charge name…"
              className="h-9 flex-1 rounded-xl border border-border bg-panel px-3 text-[0.8125rem] text-text outline-none focus:border-primary"
            />
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.75rem] font-bold text-text-sec">{newPct ? "%" : "₹"}</span>
              <input
                type="number"
                min={0}
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                placeholder="0"
                className="h-9 w-20 rounded-xl border border-border bg-panel pl-6 pr-2 text-[0.8125rem] tabular-nums text-text outline-none focus:border-primary"
              />
            </div>
            <button type="button" onClick={() => setNewPct(p => !p)} className={cn("h-9 rounded-xl border px-3 text-[0.75rem] font-bold transition", newPct ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-text-sec")}>
              {newPct ? "%" : "₹"}
            </button>
            <button type="button" onClick={addCharge} className={cn(BTN_PRIMARY, "px-3")}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className={cn(BTN_OUTLINED, "px-5")}>Cancel</button>
          <button onClick={() => { onSave({ gstEnabled, gstRate, extraCharges: charges }); onClose() }} className={cn(BTN_PRIMARY, "px-6")}>
            <Check size={14} />Apply
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Discount Modal
// ─────────────────────────────────────────────────────────────────────────────
function DiscountModal({ billing, afterTaxTotal, onSave, onClose }: {
  billing:      BillingState
  afterTaxTotal: number
  onSave:       (b: Partial<BillingState>) => void
  onClose:      () => void
}) {
  const [dtype, setDtype] = useState<"percent" | "flat">(billing.discountType)
  const [dval, setDval]   = useState(billing.discountValue > 0 ? String(billing.discountValue) : "")

  const discAmt = dtype === "percent"
    ? Math.round(afterTaxTotal * (parseFloat(dval) || 0) / 100)
    : (parseFloat(dval) || 0)

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-modal">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-black text-text">Discount</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full border border-border text-text-sec hover:bg-panel"><X size={16} /></button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-panel p-1">
          <button type="button" onClick={() => setDtype("percent")} className={cn("flex-1 rounded-xl py-2 text-[0.8125rem] font-bold transition", dtype === "percent" ? "bg-card text-primary shadow-sm" : "text-text-sec")}>
            Percentage (%)
          </button>
          <button type="button" onClick={() => setDtype("flat")} className={cn("flex-1 rounded-xl py-2 text-[0.8125rem] font-bold transition", dtype === "flat" ? "bg-card text-primary shadow-sm" : "text-text-sec")}>
            Flat (₹)
          </button>
        </div>

        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[1.25rem] font-black text-text-sec">
            {dtype === "percent" ? "%" : "₹"}
          </span>
          <input
            autoFocus
            type="number"
            min={0}
            max={dtype === "percent" ? 100 : undefined}
            value={dval}
            onChange={e => setDval(e.target.value)}
            placeholder={dtype === "percent" ? "e.g. 10" : "e.g. 50"}
            className="h-12 w-full rounded-xl border border-border bg-panel pl-10 pr-4 text-[1.125rem] font-black tabular-nums text-text outline-none transition-colors focus:border-primary focus:bg-card"
          />
        </div>

        {discAmt > 0 && (
          <div className="mt-3 flex justify-between rounded-xl bg-green/10 px-4 py-2.5">
            <span className="text-[0.875rem] font-bold text-green">Discount Amount</span>
            <span className="text-[1rem] font-black tabular-nums text-green">-{money.format(discAmt)}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => { onSave({ discountType: dtype, discountValue: 0 }); onClose() }} className={cn(BTN_OUTLINED, "px-5")}>Remove</button>
          <button onClick={() => { onSave({ discountType: dtype, discountValue: parseFloat(dval) || 0 }); onClose() }} className={cn(BTN_PRIMARY, "px-6")}>
            <Check size={14} />Apply
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TableOrderPage — main export
// ─────────────────────────────────────────────────────────────────────────────
interface TableOrderPageProps {
  selectedTable:  DiningTable
  cart:           UseCartReturn
  customerName:   string
  kitchenNote:    string
  onCustomerName: (v: string) => void
  onKitchenNote:  (v: string) => void
  onBack:         () => void
  onPayment:      () => void
}

export function TableOrderPage({
  selectedTable, cart, customerName, kitchenNote,
  onCustomerName, onKitchenNote, onBack, onPayment,
}: TableOrderPageProps) {
  const { items: apiItems, categories: apiCategories, fetchMenu, fetchCategories } = useMenuStore()
  const { createOrder, updateOrder, fetchOrders } = useOrderStore()
  const { addEvent } = useKotStore()
  const { settings, fetchSettings } = useSettingsStore()

  useEffect(() => {
    fetchMenu()
    fetchCategories()
    fetchSettings()
  }, [fetchMenu, fetchCategories, fetchSettings])

  // ── Billing state ───────────────────────────────────────────────────────
  const [billing, setBillingState] = useState<BillingState>({
    gstEnabled:    true,
    gstRate:       5,
    extraCharges:  [],
    discountType:  "percent",
    discountValue: 0,
  })

  // Sync billing with settings on load
  useEffect(() => {
    if (!settings) return
    const charges: BillingState["extraCharges"] = []
    if ((settings.serviceChargePercent ?? 0) > 0) {
      charges.push({
        id:        "service-charge",
        name:      "Service Charge",
        value:     settings.serviceChargePercent,
        isPercent: true,
      })
    }
    setBillingState(prev => ({
      ...prev,
      gstRate:      settings.gstPercent ?? prev.gstRate,
      gstEnabled:   (settings.gstPercent ?? 0) > 0,
      extraCharges: charges,
    }))
  }, [settings])

  const updateBilling = useCallback((patch: Partial<BillingState>) => {
    setBillingState(prev => ({ ...prev, ...patch }))
  }, [])

  const { gstAmount, extraTotal, total } = computeTotals(cart.subtotal, billing)

  // ── Modal states ─────────────────────────────────────────────────────────
  const [showKitchenNoteModal, setShowKitchenNoteModal] = useState(false)
  const [showKotToast,         setShowKotToast]         = useState(false)
  const [showClearModal,       setShowClearModal]        = useState(false)
  const [showSplitBill,        setShowSplitBill]         = useState(false)
  const [showTaxModal,         setShowTaxModal]          = useState(false)
  const [showDiscountModal,    setShowDiscountModal]     = useState(false)

  // Item removal reason modal
  const [removalTarget, setRemovalTarget] = useState<{ id: string; name: string; wasKotSent: boolean } | null>(null)

  // ── Order persistence ────────────────────────────────────────────────────
  const saveCurrentOrder = async (targetStatus?: "open" | "billed" | "hold") => {
    if (cart.cartItems.length === 0) return null
    const orderItems = cart.cartItems.map(item => ({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      qty: item.quantity,
      notes: ""
    }))
    const payload = {
      tableId: selectedTable.id,
      items: orderItems,
      customerName,
      customerPhone: "",
      isTakeaway: selectedTable.section === "Takeaway",
      guests: 4
    }
    let order = null
    if (selectedTable.currentOrderId) {
      order = await updateOrder(selectedTable.currentOrderId, {
        items: orderItems as any,
        customerName,
        status: targetStatus || "open"
      })
    } else {
      order = await createOrder(payload)
      if (order && targetStatus && targetStatus !== "open") {
        await updateOrder(order.id, { status: targetStatus as any })
      }
    }
    await fetchOrders()
    await useTableStore.getState().fetchTables()
    return order
  }

  // ── KOT handlers ─────────────────────────────────────────────────────────
  const fireKot = async (withPrint: boolean) => {
    // Save/update order as open
    const order = await saveCurrentOrder("open")

    // Add to KOT queue
    addEvent({
      orderId:     order?.id || selectedTable.currentOrderId || null,
      tableId:     selectedTable.id,
      tableName:   selectedTable.name,
      items:       cart.cartItems.map(i => ({ name: i.name, qty: i.quantity, price: i.price, kotSent: i.kotSent })),
      kitchenNote: kitchenNote,
      type:        cart.cartItems.some(i => i.kotSent) ? "update" : "new",
    })

    // Mark all items as kotSent
    cart.markAllKotSent()

    if (withPrint) {
      setTimeout(() => window.print(), 300)
    }

    // Show toast then return to dashboard
    setShowKotToast(true)
    setTimeout(() => {
      setShowKotToast(false)
      onBack()
    }, 1800)
  }

  // ── Intercept item removal ───────────────────────────────────────────────
  // We wrap the cart's removeItem to prompt for reason when a kotSent item is removed
  const handleItemDecrease = useCallback((item: { id: string; name: string; kotSent: boolean }) => {
    if (item.kotSent) {
      setRemovalTarget({ id: item.id, name: item.name, wasKotSent: true })
    } else {
      cart.removeItem(item.id)
    }
  }, [cart])

  const handleRemovalConfirmed = (reason: string) => {
    if (!removalTarget) return
    cart.removeItem(removalTarget.id)
    // Send removal event to queue
    addEvent({
      orderId:     selectedTable.currentOrderId || null,
      tableId:     selectedTable.id,
      tableName:   selectedTable.name,
      items:       [{ name: removalTarget.name, qty: 1, price: 0 }],
      kitchenNote: "",
      type:        "removal",
      reason,
    })
    setRemovalTarget(null)
  }

  // ── Save → Bill Ready ────────────────────────────────────────────────────
  const handleSave = async () => {
    await saveCurrentOrder("billed")
    onBack()
  }

  // ── Hold ─────────────────────────────────────────────────────────────────
  const handleHold = async () => {
    await saveCurrentOrder("open")
    // Explicitly mark the table as active (same as KOT)
    await useTableStore.getState().updateTableStatus(selectedTable.id, "active")
    onBack()
  }

  // ── Pay ──────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    await saveCurrentOrder("open")
    onPayment()
  }

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClearConfirmed = (reason: string) => {
    // Log clear event to queue
    addEvent({
      orderId:     selectedTable.currentOrderId || null,
      tableId:     selectedTable.id,
      tableName:   selectedTable.name,
      items:       [],
      kitchenNote: "",
      type:        "removal",
      reason:      `CLEAR: ${reason}`,
    })
    // Clear locally immediately
    cart.clearCart()
    // Async cleanup in background
    useTableStore.getState().clearTable(selectedTable.id).then(() => {
      fetchOrders()
    })
    onBack()
  }

  // ── Menu data ─────────────────────────────────────────────────────────────
  const posCategories: string[] = apiCategories.length > 0
    ? apiCategories.map(c => c.name)
    : ["All"]

  const posMenuItems = apiItems.map(i => ({
    id:    i.id,
    name:  i.name,
    price: i.price,
    image: i.imageUrl || "",
    emoji: i.emoji,
    isVeg: i.isVeg,
    categoryName: apiCategories.find(c => c.id === i.categoryId)?.name || "",
    isAvailable: i.isAvailable,
  }))

  const [activeCategory, setActiveCategory] = useState<string>(posCategories[0] || "All")
  const [vegFilter, setVegFilter]           = useState<VegFilter>("all")
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch]                 = useState("")

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of posCategories) {
      const catId = apiCategories.find(c => c.name === cat)?.id
      counts[cat] = catId ? apiItems.filter(i => i.categoryId === catId).length : posMenuItems.length
    }
    return counts
  }, [posCategories, apiCategories, apiItems, posMenuItems.length])

  const filteredItems = useMemo(() => {
    const catId = apiCategories.find(c => c.name === activeCategory)?.id
    return posMenuItems.filter(item => {
      const matchCat    = !catId || item.categoryName === activeCategory
      const matchSearch = search === "" || item.name.toLowerCase().includes(search.toLowerCase())
      const matchVeg    = vegFilter === "all" || (vegFilter === "veg" ? item.isVeg : !item.isVeg)
      return matchCat && matchSearch && item.isAvailable && matchVeg
    })
  }, [activeCategory, search, posMenuItems, apiCategories, vegFilter])

  useKeyboardShortcuts([
    { key: "Escape", ctrl: false, action: onBack },
    { key: "f",     ctrl: true,  action: () => searchRef.current?.focus() },
  ])

  // Wrap the addItem for the right panel stepper (increases don't need special treatment)
  const handleMenuCardDecrease = useCallback((item: typeof posMenuItems[0]) => {
    const cartItem = cart.cartItems.find(i => i.id === item.id)
    if (cartItem?.kotSent) {
      setRemovalTarget({ id: item.id, name: item.name, wasKotSent: true })
    } else {
      cart.removeItem(item.id)
    }
  }, [cart])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card dark:bg-bg px-4 py-2">

        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-[0.75rem] font-bold text-text-sec transition-[border-color,color] hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back
        </button>

        <div className="h-5 w-px bg-border" />

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[0.6875rem] text-text-sec">Guests:</span>
            <span className="text-[0.8125rem] font-bold text-text">4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.6875rem] text-text-sec">Table:</span>
            <span className="rounded-md bg-primary-light px-2 py-0.5 text-[0.75rem] font-black text-primary">
              {selectedTable.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.6875rem] text-text-sec">Customer:</span>
            <input
              type="text"
              value={customerName}
              onChange={e => onCustomerName(e.target.value)}
              placeholder="Name (optional)"
              className="h-7 w-[12rem] rounded-xl border border-border bg-panel px-2 text-[0.75rem] text-text outline-none placeholder:text-text-sec/50 transition-[border-color,background-color] focus:border-primary focus:bg-card"
              aria-label="Customer name"
            />
          </div>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Veg toggle */}
          <button
            type="button"
            onClick={() => setVegFilter(prev => prev === "veg" ? "all" : "veg")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.75rem] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green",
              vegFilter === "veg"
                ? "border-green bg-green-light text-green"
                : "border-border bg-card text-text-sec hover:border-green/60 hover:bg-green-light hover:text-green",
            )}
          >
            <Leaf size={13} strokeWidth={2} />
            Veg
          </button>
          {/* Non-Veg toggle */}
          <button
            type="button"
            onClick={() => setVegFilter(prev => prev === "nonveg" ? "all" : "nonveg")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.75rem] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger",
              vegFilter === "nonveg"
                ? "border-danger bg-danger/10 text-danger"
                : "border-border bg-card text-text-sec hover:border-danger/40 hover:bg-danger/5 hover:text-danger",
            )}
          >
            <Drumstick size={13} strokeWidth={2} />
            Non-Veg
          </button>
          {/* Clear */}
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-danger px-3 py-1.5 text-[0.75rem] font-bold text-white transition-[background-color,transform] hover:bg-danger/85 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <Trash2 size={13} strokeWidth={2.5} />
            Clear
          </button>
        </div>
      </header>

      {/* ── POS workspace — 3-column layout ──────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* COL 1: Category sidebar */}
        <CategorySidebar
          categories={posCategories}
          active={activeCategory}
          itemCounts={itemCounts}
          apiCategories={apiCategories}
          onSelect={cat => setActiveCategory(cat as PosCategory)}
        />

        {/* COL 2: Search + menu grid */}
        <div className="flex flex-1 flex-col overflow-hidden bg-bg">

          {/* Search bar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card dark:bg-bg px-4 py-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/50"
              />
              <input
                ref={searchRef}
                type="text"
                aria-label="Search item"
                placeholder="Search item… (Ctrl+F)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-[0.8125rem] text-text outline-none placeholder:text-text-sec/50 transition-[border-color,background-color] focus:border-primary focus:bg-card"
              />
            </div>
            <Input
              aria-label="Short code"
              className="h-9 w-36 rounded-xl text-[0.8125rem]"
              placeholder="Short Code"
            />
          </div>

          {/* Grid area */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h2 className="mb-4 text-[0.875rem] font-black uppercase tracking-wide text-text-sec">
              {search ? `Results for "${search}"` : activeCategory}
              {vegFilter !== "all" && (
                <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[0.6875rem]",
                  vegFilter === "veg" ? "bg-green/10 text-green" : "bg-danger/10 text-danger"
                )}>
                  {vegFilter === "veg" ? "🟢 Veg only" : "🔴 Non-Veg only"}
                </span>
              )}
            </h2>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-warm">
                  <Utensils size={28} strokeWidth={1} className="text-border" />
                </div>
                <div>
                  <p className="text-[0.875rem] font-bold text-text-sec">No items found</p>
                  <p className="mt-0.5 text-[0.75rem] text-text-sec/60">
                    Try a different search term or filter
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,14.5rem)] gap-4 justify-center">
                {filteredItems.map(item => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={cart.getQty(item.id)}
                    onIncrease={() => cart.addItem(item)}
                    onDecrease={() => handleMenuCardDecrease(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COL 3: Order summary */}
        <OrderSummary
          selectedTable={selectedTable}
          customerName={customerName}
          cart={cart}
          billing={billing}
          kitchenNote={kitchenNote}
          onKitchenNoteClick={() => setShowKitchenNoteModal(true)}
          onKot={() => fireKot(false)}
          onKotPrint={() => fireKot(true)}
          onSave={handleSave}
          onPay={handlePay}
          onHold={handleHold}
          onSplitBill={() => setShowSplitBill(true)}
          onTax={() => setShowTaxModal(true)}
          onDiscount={() => setShowDiscountModal(true)}
          onDecreaseItem={handleItemDecrease}
        />
      </main>

      {/* ── KOT print target (hidden except on print) ─────────────── */}
      <KotReceiptPrint
        tableName={selectedTable.name}
        orderNo={selectedTable.currentOrderId || "NEW"}
        items={cart.cartItems}
        kitchenNote={kitchenNote}
      />

      {/* ── Modals ────────────────────────────────────────────────── */}
      {showKitchenNoteModal && (
        <KitchenNoteModal
          value={kitchenNote}
          onSave={onKitchenNote}
          onClose={() => setShowKitchenNoteModal(false)}
        />
      )}

      {removalTarget && (
        <ReasonModal
          title="Remove KOT Item"
          description={`"${removalTarget.name}" was already sent to the kitchen. Please provide a reason for removing it.`}
          onConfirm={handleRemovalConfirmed}
          onClose={() => setRemovalTarget(null)}
        />
      )}

      {showClearModal && (
        <ReasonModal
          title="Clear Order"
          description="Please provide a reason for clearing this order. This action will be logged in the queue."
          onConfirm={handleClearConfirmed}
          onClose={() => setShowClearModal(false)}
        />
      )}

      {showSplitBill && (
        <SplitBillModal
          total={total}
          onClose={() => setShowSplitBill(false)}
        />
      )}

      {showTaxModal && (
        <TaxModal
          billing={billing}
          subtotal={cart.subtotal}
          onSave={patch => updateBilling(patch as BillingState)}
          onClose={() => setShowTaxModal(false)}
        />
      )}

      {showDiscountModal && (
        <DiscountModal
          billing={billing}
          afterTaxTotal={cart.subtotal + gstAmount + extraTotal}
          onSave={patch => updateBilling(patch as BillingState)}
          onClose={() => setShowDiscountModal(false)}
        />
      )}

      {showKotToast && <KotSentToast tableName={selectedTable.name} />}
    </div>
  )
}
