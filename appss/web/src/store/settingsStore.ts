import { create } from "zustand"
import { api } from "@/lib/api"

// ── Types ───────────────────────────────────────────────────────────

export interface ApiSettings {
  _id?:                 string
  adminId:              string
  restaurantName:       string
  tagline:              string
  address:              string
  phone:                string
  email:                string
  website:              string
  gstNumber:            string
  gstPercent:           number
  serviceChargePercent: number
  currency:             string
  receiptFooter:        string
  theme:                string
  timezone:             string
  tableCount:           number
  restaurantTableCount: number
  familyTableCount:     number
  takeawayTableCount:   number
}

interface SettingsState {
  settings: ApiSettings | null
  loading:  boolean
  error:    string | null

  fetchSettings:  () => Promise<void>
  updateSettings: (data: Partial<ApiSettings>) => Promise<void>
}

// ── Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading:  false,
  error:    null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<ApiSettings>("/settings")
      set({ settings: data, loading: false })
    } catch (err: any) {
      console.error("fetchSettings error:", err)
      set({ error: err.message, loading: false })
    }
  },

  updateSettings: async (updateData) => {
    try {
      const { data } = await api.put<ApiSettings>("/settings", updateData)
      set({ settings: data })
    } catch (err) {
      console.error("updateSettings error:", err)
    }
  },
}))
