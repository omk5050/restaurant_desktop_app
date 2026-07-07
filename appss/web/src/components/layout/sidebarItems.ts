import {
  BarChart3, Home, LayoutGrid, ReceiptText,
  Settings, Tag, Utensils,
  type LucideIcon,
} from "lucide-react"

export type SidebarItemId =
  // POS screens
  | "tables" | "menu" | "orders" | "reports"
  // Admin screens
  | "categories" | "tables-admin"
  | "settings"

export type SidebarItem = {
  href:     string
  icon:     LucideIcon
  id:       SidebarItemId
  label:    string
  section:  "pos" | "admin"
}

export const defaultSidebarItems: SidebarItem[] = [
  // ── POS ─────────────────────────────────────────────
  { href: "/",              icon: Home,       id: "tables",       label: "Tables",      section: "pos" },
  { href: "/menu",          icon: Utensils,   id: "menu",         label: "Menu",        section: "pos" },
  { href: "/orders",        icon: ReceiptText,id: "orders",       label: "Orders",      section: "pos" },
  { href: "/reports",       icon: BarChart3,  id: "reports",      label: "Reports",     section: "pos" },
  // ── Admin ────────────────────────────────────────────
  { href: "/admin/cat",     icon: Tag,        id: "categories",   label: "Categories",  section: "admin" },
  { href: "/admin/tables",  icon: LayoutGrid, id: "tables-admin", label: "Table Setup", section: "admin" },
  { href: "/admin/settings",icon: Settings,   id: "settings",     label: "Settings",    section: "admin" },
]
