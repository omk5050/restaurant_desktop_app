import { create } from "zustand"

// ── Types ────────────────────────────────────────────────────────────

export type KotEventType = "new" | "update" | "removal"

export interface KotItem {
  name:     string
  qty:      number
  price:    number
  kotSent?: boolean
}

export interface KotEvent {
  id:           string
  orderId:      string | null
  tableId:      number
  tableName:    string
  items:        KotItem[]
  kitchenNote:  string
  type:         KotEventType
  reason?:      string          // for "removal" events
  timestamp:    string
}

interface KotState {
  events: KotEvent[]
  addEvent: (event: Omit<KotEvent, "id" | "timestamp">) => void
  clearEvents: () => void
}

// ── Store ─────────────────────────────────────────────────────────────

export const useKotStore = create<KotState>((set) => ({
  events: [],

  addEvent: (event) => {
    const newEvent: KotEvent = {
      ...event,
      id:        crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    set(state => ({ events: [newEvent, ...state.events] }))
  },

  clearEvents: () => set({ events: [] }),
}))
