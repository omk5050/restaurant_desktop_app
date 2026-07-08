import { create } from "zustand"
import { api } from "@/lib/api"

// ── Types ───────────────────────────────────────────────────────────

export interface ApiOrderItem {
  menuItemId: string
  name:       string
  price:      number
  qty:        number
  notes:      string
}

export type ApiOrderStatus = "open" | "hold" | "billed" | "paid"

export interface ApiOrder {
  _id:           string
  adminId:       string
  id:            string
  tableId:       number
  orderNo:       string
  guests:        number
  status:        ApiOrderStatus
  items:         ApiOrderItem[]
  subtotal:      number
  gstAmount:     number
  total:         number
  openedAt:      string
  closedAt:      string | null
  paymentMethod: string | null
  isTakeaway:    boolean
  customerName:  string
  customerPhone: string
}

export interface CreateOrderPayload {
  tableId:      number
  items:        ApiOrderItem[]
  guests?:      number
  isTakeaway?:  boolean
  customerName?:  string
  customerPhone?: string
  gstPercent?:  number
}

export interface PaymentPayload {
  paymentMethod: string
  paymentSplits?: Array<{ method: string; amount: number }>
}

interface OrderState {
  orders:  ApiOrder[]
  loading: boolean
  error:   string | null

  fetchOrders:    (filter?: { status?: string; tableId?: number }) => Promise<void>
  createOrder:    (payload: CreateOrderPayload) => Promise<ApiOrder | null>
  updateOrder:    (id: string, data: Partial<ApiOrder>) => Promise<ApiOrder | null>
  processPayment: (id: string, payload: PaymentPayload) => Promise<ApiOrder | null>
  getOrderForTable: (tableId: number) => ApiOrder | undefined
}

// ── Store ───────────────────────────────────────────────────────────

export const useOrderStore = create<OrderState>((set, get) => ({
  orders:  [],
  loading: false,
  error:   null,

  fetchOrders: async (filter = {}) => {
    set({ loading: true, error: null })
    try {
      const params: Record<string, string> = {}
      if (filter.status)  params.status  = filter.status
      if (filter.tableId) params.tableId = String(filter.tableId)
      const { data } = await api.get<ApiOrder[]>("/orders", { params })
      set({ orders: data, loading: false })
    } catch (err: any) {
      console.error("fetchOrders error:", err)
      set({ error: err.message, loading: false })
    }
  },

  createOrder: async (payload) => {
    try {
      const { data } = await api.post<ApiOrder>("/orders", payload)
      set(state => ({ orders: [data, ...state.orders] }))
      return data
    } catch (err) {
      console.error("createOrder error:", err)
      return null
    }
  },

  updateOrder: async (id, updateData) => {
    try {
      const { data } = await api.patch<ApiOrder>(`/orders/${id}`, updateData)
      set(state => ({
        orders: state.orders.map(o => (o.id === id ? data : o)),
      }))
      return data
    } catch (err) {
      console.error("updateOrder error:", err)
      return null
    }
  },

  processPayment: async (id, payload) => {
    try {
      const { data } = await api.post<{ order: ApiOrder }>(`/orders/${id}/pay`, payload)
      const paid = data.order
      set(state => ({
        orders: state.orders.map(o => (o.id === id ? paid : o)),
      }))
      return paid
    } catch (err) {
      console.error("processPayment error:", err)
      return null
    }
  },

  getOrderForTable: (tableId) =>
    get().orders.find(o => o.tableId === tableId && (o.status === "open" || o.status === "hold")),
}))
