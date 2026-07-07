/**
 * POS mock data — floor plan tables, ordering menu, order tickets.
 * Migrated from src/data/mock.ts during Sprint 6 refactor.
 *
 * Admin-facing tables are in src/mocks/tables.ts (AdminTable).
 * These are the POS-runtime records used by the waiter workflow.
 */
import heroImage from "@/assets/hero.png"
import type { SidebarItemId } from "@/components/layout"

// ── Navigation ──────────────────────────────────────────────────────
/** All navigable screens in the app. */
export type Screen =
  | SidebarItemId
  | "tableOrder"
  | "payment"
  | "invoice"

// ── Tables ──────────────────────────────────────────────────────────
export type TableStatus  = "empty" | "active" | "bill" | "paid"
export type TableSection = "Restaurant" | "Family Section" | "Takeaway"

export interface DiningTable {
  id:      string
  name:    string
  seats:   number
  section: TableSection
  status:  TableStatus
}

export const tables: DiningTable[] = [
  { id: "t1",  name: "T1",  seats: 2, section: "Restaurant",     status: "empty"  },
  { id: "t2",  name: "T2",  seats: 4, section: "Restaurant",     status: "active" },
  { id: "t3",  name: "T3",  seats: 4, section: "Restaurant",     status: "active" },
  { id: "t4",  name: "T4",  seats: 6, section: "Restaurant",     status: "bill"   },
  { id: "t5",  name: "T5",  seats: 2, section: "Restaurant",     status: "empty"  },
  { id: "t6",  name: "T6",  seats: 4, section: "Restaurant",     status: "active" },
  { id: "t7",  name: "T7",  seats: 8, section: "Family Section", status: "active" },
  { id: "t8",  name: "T8",  seats: 6, section: "Family Section", status: "active" },
  { id: "t9",  name: "T9",  seats: 8, section: "Family Section", status: "empty"  },
  { id: "t10", name: "T10", seats: 6, section: "Family Section", status: "active" },
  { id: "t11", name: "T11", seats: 4, section: "Family Section", status: "paid"   },
  { id: "t12", name: "PK1", seats: 2, section: "Takeaway",       status: "empty"  },
  { id: "t13", name: "PK2", seats: 2, section: "Takeaway",       status: "active" },
  { id: "t14", name: "PK3", seats: 2, section: "Takeaway",       status: "empty"  },
]

// ── Payment ─────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "upi" | "card" | "credit" | "razorpay"

// ── Menu (card view for MenuPage) ───────────────────────────────────
export interface MenuItem {
  id:    string
  name:  string
  price: number
  image: string
  type:  "Veg" | "Non-Veg"
}

export const menuItems: MenuItem[] = [
  { id: "mi1", name: "Chicken Dum Biryani",  price: 200, image: heroImage, type: "Non-Veg" },
  { id: "mi2", name: "Veg Dum Biryani",      price: 160, image: heroImage, type: "Veg"     },
  { id: "mi3", name: "Mutton Dum Biryani",   price: 250, image: heroImage, type: "Non-Veg" },
]

// ── Order Tickets (OrdersPage queue) ────────────────────────────────
export interface OrderTicket {
  id:     string
  table:  string
  time:   string
  items:  string
  amount: number
}

export const orderTickets: OrderTicket[] = [
  { id: "ORD-001", table: "T2",  time: "12:34 PM", items: "Chicken Dum Biryani × 2, Cold Drink × 2", amount: 480  },
  { id: "ORD-002", table: "T3",  time: "12:41 PM", items: "Mutton Dum Biryani × 1, Chapati × 2",     amount: 290  },
  { id: "ORD-003", table: "T6",  time: "12:55 PM", items: "Veg Dum Biryani × 2",                      amount: 320  },
  { id: "ORD-004", table: "T7",  time: "1:02 PM",  items: "Family Combo × 1, Soft Drink × 4",         amount: 680  },
  { id: "ORD-005", table: "T8",  time: "1:10 PM",  items: "Chicken Tikka Biryani × 3",                amount: 660  },
  { id: "ORD-006", table: "T10", time: "1:18 PM",  items: "Tandoori Biryani × 2, Water × 2",          amount: 520  },
  { id: "ORD-007", table: "PK2", time: "1:25 PM",  items: "Chicken 65 × 1, Jeera Rice × 1",           amount: 260  },
]

// ── POS Ordering Items (TableOrderPage menu grid) ───────────────────
export interface PosMenuItem {
  id:    string
  name:  string
  price: number
  image: string
}

export const posMenuItems: PosMenuItem[] = [
  { id: "m1",  name: "500 Ml",                price: 60,  image: heroImage },
  { id: "m2",  name: "Chapati",               price: 20,  image: heroImage },
  { id: "m3",  name: "Chicken Dum Biryani",   price: 200, image: heroImage },
  { id: "m4",  name: "Chicken Tikka Biryani", price: 220, image: heroImage },
  { id: "m5",  name: "Cold Drink",            price: 40,  image: heroImage },
  { id: "m6",  name: "Custom",                price: 0,   image: heroImage },
  { id: "m7",  name: "Egg Dum Biryani",       price: 180, image: heroImage },
  { id: "m8",  name: "Jeera Rice",            price: 80,  image: heroImage },
  { id: "m9",  name: "Jeera Soda",            price: 30,  image: heroImage },
  { id: "m10", name: "Mutton Dum Biryani",    price: 250, image: heroImage },
  { id: "m11", name: "Paneer Tikka Biryani",  price: 200, image: heroImage },
  { id: "m12", name: "Tandoori Biryani",      price: 240, image: heroImage },
  { id: "m13", name: "Veg Dum Biryani",       price: 160, image: heroImage },
  { id: "m14", name: "Water",                 price: 20,  image: heroImage },
]

// ── POS Categories ───────────────────────────────────────────────────
export const posCategories = [
  "Hyderabadi Dum Biryani",
  "Non-Veg Tandoor & Kebabs",
  "Veg Starters",
  "Non-Veg Starters",
  "Egg Starters",
  "Veg",
  "Chicken",
  "Mutton",
  "Fish",
  "Family Combo",
  "Veg Soup",
  "Chicken Soup",
  "Biryani",
  "Tandoor Platter",
  "Ice Cream",
  "Tandoori Combo",
  "Golden Family Combo",
] as const

export type PosCategory = (typeof posCategories)[number]
