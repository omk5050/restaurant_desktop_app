import { create } from "zustand"
import { api } from "@/lib/api"

// ── Types ───────────────────────────────────────────────────────────

export type TableStatus  = "empty" | "active" | "bill" | "paid"
export type TableSection = "Restaurant" | "Family Section" | "Takeaway"

export interface ApiTable {
  _id:            string
  adminId:        string
  id:             number
  name:           string
  seats:          number
  section:        TableSection
  status:         TableStatus
  currentOrderId: string | null
}

interface TableState {
  tables:  ApiTable[]
  loading: boolean
  error:   string | null

  fetchTables:       () => Promise<void>
  updateTableStatus: (tableId: number, status: TableStatus) => Promise<void>
  setTableOrder:     (tableId: number, orderId: string | null) => Promise<void>
  addTable:          (tableData: Partial<ApiTable>) => Promise<ApiTable | null>
  updateTable:       (tableId: number, tableData: Partial<ApiTable>) => Promise<void>
  deleteTable:       (tableId: number) => Promise<void>
  clearTable:        (tableId: number) => Promise<void>
}

// ── Store ───────────────────────────────────────────────────────────

export const useTableStore = create<TableState>((set) => ({
  tables:  [],
  loading: false,
  error:   null,

  fetchTables: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<ApiTable[]>("/tables")
      set({ tables: data, loading: false })
    } catch (err: any) {
      console.error("fetchTables error:", err)
      set({ error: err.message, loading: false })
    }
  },

  updateTableStatus: async (tableId, status) => {
    try {
      const { data } = await api.patch<ApiTable>(`/tables/${tableId}`, { status })
      set(state => ({
        tables: state.tables.map(t => (t.id === tableId ? data : t)),
      }))
    } catch (err) {
      console.error("updateTableStatus error:", err)
    }
  },

  setTableOrder: async (tableId, orderId) => {
    try {
      const status = orderId ? "active" : "empty"
      const { data } = await api.patch<ApiTable>(`/tables/${tableId}`, {
        currentOrderId: orderId,
        status,
      })
      set(state => ({
        tables: state.tables.map(t => (t.id === tableId ? data : t)),
      }))
    } catch (err) {
      console.error("setTableOrder error:", err)
    }
  },

  addTable: async (tableData) => {
    try {
      const { data } = await api.post<ApiTable>("/tables", tableData)
      set(state => ({ tables: [...state.tables, data] }))
      return data
    } catch (err) {
      console.error("addTable error:", err)
      return null
    }
  },

  updateTable: async (tableId, tableData) => {
    try {
      const { data } = await api.patch<ApiTable>(`/tables/${tableId}`, tableData)
      set(state => ({
        tables: state.tables.map(t => (t.id === tableId ? data : t)),
      }))
    } catch (err) {
      console.error("updateTable error:", err)
    }
  },

  deleteTable: async (tableId) => {
    try {
      await api.delete(`/tables/${tableId}`)
      set(state => ({
        tables: state.tables.filter(t => t.id !== tableId),
      }))
    } catch (err) {
      console.error("deleteTable error:", err)
    }
  },

  clearTable: async (tableId) => {
    try {
      const { data } = await api.post<ApiTable>(`/tables/${tableId}/clear`)
      set(state => ({
        tables: state.tables.map(t => (t.id === tableId ? data : t)),
      }))
    } catch (err) {
      console.error("clearTable error:", err)
    }
  },
}))
