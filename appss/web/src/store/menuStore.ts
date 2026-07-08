import { create } from "zustand"
import { api } from "@/lib/api"

// ── Types ───────────────────────────────────────────────────────────

export interface ApiCategory {
  _id:       string
  adminId:   string
  id:        string
  name:      string
  icon:      string
  color:     string
  sortOrder: number
  section:   "restaurant" | "cafe"
  active:    boolean
}

export interface ApiMenuItem {
  _id:         string
  adminId:     string
  id:          string
  categoryId:  string
  name:        string
  price:       number
  emoji:       string
  isAvailable: boolean
  isVeg:       boolean
  imageUrl:    string
  shortCode:   string
  description: string
}

interface MenuState {
  categories:  ApiCategory[]
  items:       ApiMenuItem[]
  loading:     boolean
  error:       string | null

  fetchCategories: () => Promise<void>
  fetchMenu:       () => Promise<void>
  addItem:         (data: Partial<ApiMenuItem>) => Promise<ApiMenuItem | null>
  updateItem:      (id: string, data: Partial<ApiMenuItem>) => Promise<void>
  deleteItem:      (id: string) => Promise<void>
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>
  addCategory:     (data: Partial<ApiCategory>) => Promise<ApiCategory | null>
  updateCategory:  (id: string, data: Partial<ApiCategory>) => Promise<void>
  deleteCategory:  (id: string) => Promise<void>
}

// ── Store ───────────────────────────────────────────────────────────

export const useMenuStore = create<MenuState>((set) => ({
  categories: [],
  items:      [],
  loading:    false,
  error:      null,

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<ApiCategory[]>("/categories")
      set({ categories: data, loading: false })
    } catch (err: any) {
      console.error("fetchCategories error:", err)
      set({ error: err.message, loading: false })
    }
  },

  fetchMenu: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<ApiMenuItem[]>("/menu")
      set({ items: data, loading: false })
    } catch (err: any) {
      console.error("fetchMenu error:", err)
      set({ error: err.message, loading: false })
    }
  },

  addItem: async (itemData) => {
    try {
      const { data } = await api.post<ApiMenuItem>("/menu", itemData)
      set(state => ({ items: [...state.items, data] }))
      return data
    } catch (err) {
      console.error("addItem error:", err)
      return null
    }
  },

  updateItem: async (id, itemData) => {
    try {
      const { data } = await api.patch<ApiMenuItem>(`/menu/${id}`, itemData)
      set(state => ({ items: state.items.map(i => (i.id === id ? data : i)) }))
    } catch (err) {
      console.error("updateItem error:", err)
    }
  },

  deleteItem: async (id) => {
    try {
      await api.delete(`/menu/${id}`)
      set(state => ({ items: state.items.filter(i => i.id !== id) }))
    } catch (err) {
      console.error("deleteItem error:", err)
    }
  },

  toggleAvailability: async (id, isAvailable) => {
    try {
      const { data } = await api.patch<ApiMenuItem>(`/menu/${id}/availability`, { isAvailable })
      set(state => ({ items: state.items.map(i => (i.id === id ? data : i)) }))
    } catch (err) {
      console.error("toggleAvailability error:", err)
    }
  },

  addCategory: async (catData) => {
    try {
      const { data } = await api.post<ApiCategory>("/categories", catData)
      set(state => ({ categories: [...state.categories, data] }))
      return data
    } catch (err) {
      console.error("addCategory error:", err)
      return null
    }
  },

  updateCategory: async (id, catData) => {
    try {
      const { data } = await api.patch<ApiCategory>(`/categories/${id}`, catData)
      set(state => ({ categories: state.categories.map(c => (c.id === id ? data : c)) }))
    } catch (err) {
      console.error("updateCategory error:", err)
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}`)
      set(state => ({ categories: state.categories.filter(c => c.id !== id) }))
    } catch (err) {
      console.error("deleteCategory error:", err)
    }
  },
}))
