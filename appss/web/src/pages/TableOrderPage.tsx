import { useState, useRef, useMemo } from "react"
import {
  ArrowLeft, BadgeIndianRupee, Minus, Plus, ShieldCheck, Trash2, Utensils,
  Search, StickyNote, Receipt, Printer, CreditCard, ClipboardList, Pause,
  Layers2, Percent,
  type LucideIcon,
  Soup, Salad, Drumstick, Beef, Fish, GlassWater, IceCream,
  UtensilsCrossed, Flame, Star, Layers, Cookie, CupSoda, Wheat,
} from "lucide-react"
import { Input } from "@/components/ui"
import { cn } from "@/lib/cn"
import { type DiningTable, type PosMenuItem, posCategories, posMenuItems } from "@/mocks/pos"
import { money } from "@/utils/currency"
import type { UseCartReturn } from "@/hooks/useCart"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

type PosCategory = (typeof posCategories)[number]

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
// CategorySidebar
// ─────────────────────────────────────────────────────────────────────────────
function CategorySidebar({ categories, active, itemCounts, onSelect }: {
  categories:  readonly string[]
  active:      string
  itemCounts:  Record<string, number>
  onSelect:    (cat: string) => void
}) {
  return (
    <nav
      aria-label="Menu categories"
      className="flex w-[10rem] shrink-0 flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden border-r border-border bg-card dark:bg-bg"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map(cat => {
        const isActive = cat === active
        const count    = itemCounts[cat] ?? 0
        const Icon     = CATEGORY_ICON_MAP[cat] ?? Utensils

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
            {/* Left accent bar */}
            <span
              className={cn(
                "absolute inset-y-3 left-0 w-[4px] rounded-r-full transition-[opacity,background-color] duration-[160ms]",
                isActive ? "bg-white/80 opacity-100" : "opacity-0",
              )}
            />

            {/* Count badge */}
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

            {/* Icon */}
            <Icon
              size={24}
              strokeWidth={isActive ? 2.25 : 1.75}
              className={cn("shrink-0", isActive ? "text-white" : "text-text")}
            />

            {/* Label */}
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
  item:       PosMenuItem
  quantity:   number
  onIncrease: () => void
  onDecrease: () => void
}) {
  const isVeg = !(
    item.name.toLowerCase().includes("chicken") ||
    item.name.toLowerCase().includes("mutton")  ||
    item.name.toLowerCase().includes("egg")     ||
    item.name.toLowerCase().includes("tandoori")||
    item.name.toLowerCase().includes("fish")    ||
    item.name.toLowerCase().includes("non-veg")
  )

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
        <img
          alt={item.name}
          src={item.image}
          className="h-[7.5rem] w-auto max-w-[85%] object-contain drop-shadow-md mix-blend-multiply"
        />
        {/* Veg/Non-Veg indicator dot */}
        <span
          className={cn(
            "absolute right-3 top-3 size-3 rounded-full border-[2px] border-card shadow-sm",
            isVeg ? "bg-green" : "bg-danger",
          )}
        />
      </div>

      {/* ── Text + controls ─────────── */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-center">

        {/* Name — exact 2-line height reserved, center-aligned */}
        <p className="line-clamp-2 h-[2.5rem] text-[0.875rem] font-black leading-tight text-text">
          {item.name}
        </p>

        {/* Price — fixed height row */}
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

          {/* Minus button */}
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

          {/* Quantity */}
          <span
            key={quantity}
            className="animate-qty min-w-[1.5rem] text-center text-[1rem] font-black tabular-nums text-text"
            style={{ display: "inline-block" }}
          >
            {quantity}
          </span>

          {/* Plus button */}
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
// OrderSummary — right panel
// ─────────────────────────────────────────────────────────────────────────────

// Shared button classes to keep every action button identical in size
const BTN_PRIMARY   = "flex h-9 items-center justify-center gap-1 rounded-xl bg-primary px-2 text-[0.6875rem] font-bold text-white transition-[background-color,transform] duration-[140ms] hover:bg-primary-dark active:scale-95"
const BTN_DARK      = "flex h-9 items-center justify-center gap-1 rounded-xl bg-ink px-2 text-[0.6875rem] font-bold text-white transition-[background-color,transform] duration-[140ms] hover:bg-ink/85 active:scale-95"
const BTN_OUTLINED  = "flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-card px-2 text-[0.6875rem] font-bold text-text-sec transition-[border-color,background-color,color,transform] duration-[140ms] hover:border-primary hover:bg-primary-light hover:text-primary active:scale-95"

function OrderSummary({
  selectedTable, customerName, cart, gst, total, kitchenNote,
  onKitchenNote, onPayment,
}: {
  selectedTable: DiningTable
  customerName:  string
  cart:          UseCartReturn
  gst:           number
  total:         number
  kitchenNote:   string
  onKitchenNote: (v: string) => void
  onPayment:     () => void
}) {
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
          // Empty state — vertically centered, compact
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

                {/* KOT check */}
                <div className="flex justify-center">
                  <div className="flex size-[1.125rem] items-center justify-center rounded-[0.25rem] bg-green text-white">
                    <ShieldCheck size={11} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    className="flex size-[1.25rem] items-center justify-center rounded-full border border-border bg-card text-text-sec transition hover:border-primary hover:text-primary active:scale-90"
                    onClick={() => cart.removeItem(item.id)}
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
              <div className="flex justify-between text-[0.75rem] text-text-sec">
                <span>GST (15%)</span>
                <span className="tabular-nums">{money.format(gst)}</span>
              </div>
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
          <button onClick={onPayment} className={BTN_PRIMARY}>
            <Receipt size={12} />Save
          </button>
          <button onClick={onPayment} className={BTN_PRIMARY}>
            <Printer size={12} />Save &amp; Print
          </button>
          <button onClick={onPayment} className={cn(BTN_OUTLINED, "border-primary text-primary hover:bg-primary-light")}>
            <CreditCard size={12} />Pay Bill
          </button>
        </div>

        {/* Secondary actions row */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1.5">
          <button className={BTN_DARK}>
            <ClipboardList size={12} />KOT
          </button>
          <button className={BTN_DARK}>
            <Printer size={12} />KOT &amp; Print
          </button>
          <button className={BTN_OUTLINED}>
            <Pause size={12} />Hold
          </button>
        </div>

        {/* Tertiary actions row */}
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1.5">
          <button className={BTN_OUTLINED}>
            <Layers2 size={12} />Split Bill
          </button>
          <button className={BTN_OUTLINED}>
            <Percent size={12} />TAX
          </button>
          <button className={BTN_OUTLINED}>
            <BadgeIndianRupee size={12} />Discount
          </button>
        </div>

        {/* Kitchen note */}
        <div className="px-3 pb-3 pt-1">
          <label className="flex h-8 items-center gap-2 rounded-xl border border-border bg-panel px-3 transition-[border-color,background-color] focus-within:border-primary focus-within:bg-card">
            <StickyNote size={13} className="shrink-0 text-text-sec/60" />
            <input
              type="text"
              placeholder="Kitchen note (KOT only)…"
              value={kitchenNote}
              onChange={e => onKitchenNote(e.target.value)}
              className="flex-1 bg-transparent text-[0.75rem] text-text outline-none placeholder:text-text-sec/50"
              aria-label="Kitchen note"
            />
          </label>
        </div>
      </div>
    </aside>
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
  const [activeCategory, setActiveCategory] = useState<PosCategory>(posCategories[0])
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")

  const gst   = Math.round(cart.subtotal * 0.15)
  const total  = cart.subtotal + gst

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of posCategories) counts[cat] = posMenuItems.length
    return counts
  }, [])

  const filteredItems = posMenuItems.filter(item =>
    search === "" || item.name.toLowerCase().includes(search.toLowerCase()),
  )

  useKeyboardShortcuts([
    { key: "Escape", ctrl: false, action: onBack },
    { key: "f",     ctrl: true,  action: () => searchRef.current?.focus() },
  ])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">

      {/* ── Top bar ───────────────────────────────────────────────── */}
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
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[0.75rem] font-bold text-text-sec transition-[border-color,background-color,color] hover:border-green/60 hover:bg-green-light hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
          >
            <span className="size-2 rounded-full bg-green" />
            Veg
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-[0.75rem] font-bold text-text-sec transition-[border-color,background-color,color] hover:border-danger/40 hover:bg-danger/5 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <span className="size-2 rounded-full bg-danger" />
            Non-Veg
          </button>
          <button
            type="button"
            onClick={cart.clearCart}
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
            </h2>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-warm">
                  <Utensils size={28} strokeWidth={1} className="text-border" />
                </div>
                <div>
                  <p className="text-[0.875rem] font-bold text-text-sec">No items found</p>
                  <p className="mt-0.5 text-[0.75rem] text-text-sec/60">
                    Try a different search term
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
                    onDecrease={() => cart.removeItem(item.id)}
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
          gst={gst}
          total={total}
          kitchenNote={kitchenNote}
          onKitchenNote={onKitchenNote}
          onPayment={onPayment}
        />
      </main>
    </div>
  )
}
