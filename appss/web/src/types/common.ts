/**
 * RESTAURANT POS — Common Types
 * Structural domain interfaces used across the application.
 * Sprint 2 foundation types — no business logic, no API calls.
 *
 * Note: runtime mock data lives in src/mocks/pos.ts. Admin data is in src/mocks/.
 * These interfaces describe the shape of that data and will be
 * reused when the API layer is wired in a future sprint.
 */

// ── Table ──────────────────────────────────────────────────────────
export type TableStatus = 'empty' | 'active' | 'bill' | 'paid'

export interface DiningTable {
  id:      string
  name:    string
  seats:   number
  section: 'Restaurant' | 'Family Section' | 'Takeaway'
  status:  TableStatus
}

// ── Menu ───────────────────────────────────────────────────────────
export type DietaryType = 'Veg' | 'Non-Veg'

export interface MenuItem {
  id:       string
  name:     string
  price:    number
  category: string
  type:     DietaryType
  image:    string
  available?: boolean
  description?: string
}

export interface MenuCategory {
  id:        string
  name:      string
  sortOrder: number
}

// ── Orders ─────────────────────────────────────────────────────────
export interface OrderItem {
  menuItemId: string
  name:       string
  price:      number
  quantity:   number
  notes?:     string
}

export type OrderStatus = 'open' | 'billed' | 'paid' | 'cancelled'

export interface Order {
  id:          string
  tableId:     string
  tableNumber: number
  items:       OrderItem[]
  subtotal:    number
  tax:         number
  total:       number
  status:      OrderStatus
  createdAt:   string
  updatedAt:   string
}

export interface OrderTicket {
  id:     string
  table:  string
  time:   string
  items:  string
  amount: number
}

// ── Payment ────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit' | 'razorpay'

// ── Navigation ─────────────────────────────────────────────────────
export type MainScreen = 'tables' | 'menu' | 'orders' | 'reports'
export type Screen     = MainScreen | 'tableOrder' | 'payment' | 'invoice'

// ── Utility ────────────────────────────────────────────────────────
export interface WithChildren {
  children?: import("react").ReactNode
}

export interface WithClassName {
  className?: string
}

// ── Cart (Sprint 5) ────────────────────────────────────────────────
export interface CartItem {
  id:       string
  name:     string
  price:    number
  quantity: number
  image:    string
}
export type Cart = Record<string, CartItem>
