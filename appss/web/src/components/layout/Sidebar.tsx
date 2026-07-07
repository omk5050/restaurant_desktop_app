import { Utensils } from "lucide-react"
import { cn } from "@/lib/cn"
import { defaultSidebarItems, type SidebarItem, type SidebarItemId } from "./sidebarItems"

export type SidebarProps = {
  activeItem?:     SidebarItemId
  className?:      string
  collapsed?:      boolean
  items?:          SidebarItem[]
  onNavigate?:     (item: SidebarItemId) => void
  restaurantName?: string
  userName?:       string
  userRole?:       string
}

const getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase()

export const Sidebar = ({
  activeItem     = "tables",
  className,
  collapsed      = false,
  items          = defaultSidebarItems,
  onNavigate,
  restaurantName = "Restaurant POS",
  userName       = "John Doe",
  userRole       = "Manager",
}: SidebarProps) => {
  // Group items by section
  const posItems   = items.filter(i => i.section === "pos")
  const adminItems = items.filter(i => i.section === "admin")

  const NavItem = ({ item }: { item: SidebarItem }) => {
    const Icon     = item.icon
    const isActive = item.id === activeItem
    return (
      <li>
        <a
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-9 items-center gap-3 rounded-xl border border-transparent px-3 text-[0.8125rem] font-bold transition-[background-color,color] duration-150 ease-out active:scale-[0.98]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            isActive
              ? "bg-primary-light text-primary-dark"
              : "text-text-sec hover:border-border/50 hover:bg-card hover:text-text",
            collapsed && "justify-center px-0",
          )}
          href={item.href}
          title={collapsed ? item.label : undefined}
          onClick={e => { if (!onNavigate) return; e.preventDefault(); onNavigate(item.id) }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-150",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon aria-hidden="true" size={16} strokeWidth={2.7} className={cn(isActive && "text-primary")} />
          {!collapsed && <span>{item.label}</span>}
        </a>
      </li>
    )
  }

  return (
    <aside
      className={cn(
        "hidden min-h-screen shrink-0 border-r border-border bg-card dark:bg-bg lg:flex lg:flex-col",
        collapsed ? "w-[4.25rem]" : "w-[13.75rem]",
        className,
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-[4.25rem] items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
        <a
          aria-label={restaurantName}
          className={cn(
            "flex items-center gap-3 rounded-xl transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            collapsed && "justify-center",
          )}
          href="/"
          onClick={e => { if (onNavigate) { e.preventDefault(); onNavigate("tables") } }}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-warm">
            <Utensils aria-hidden="true" size={18} strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[0.875rem] font-black text-text leading-tight">{restaurantName}</span>
              <span className="block truncate text-[0.625rem] font-bold text-text-sec uppercase tracking-wider">Web Edition</span>
            </span>
          )}
        </a>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* POS section */}
        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[0.625rem] font-black uppercase tracking-widest text-text-sec/60">
              POS
            </p>
          )}
          <ul className="space-y-1">
            {posItems.map(item => <NavItem item={item} key={item.id} />)}
          </ul>
        </div>

        {/* Admin section */}
        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[0.625rem] font-black uppercase tracking-widest text-text-sec/60">
              Admin
            </p>
          )}
          <ul className="space-y-1">
            {adminItems.map(item => <NavItem item={item} key={item.id} />)}
          </ul>
        </div>
      </nav>

      {/* User footer */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 rounded-xl border border-transparent transition-colors hover:bg-panel p-2", collapsed && "justify-center p-2")}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-panel border border-border text-[0.6875rem] font-bold text-text-sec">
            {getInitials(userName)}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-bold text-text leading-tight">{userName}</span>
              <span className="block truncate text-[0.6875rem] text-text-sec">{userRole}</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
