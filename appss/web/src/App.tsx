import { useState, type ReactNode } from "react"
import { BottomNav, Sidebar } from "@/components/layout"
import { defaultSidebarItems, type SidebarItemId } from "@/components/layout"
import { cn } from "@/lib/cn"
import { type DiningTable, type PaymentMethod, type Screen, tables } from "@/mocks/pos"
import { useCart } from "@/hooks/useCart"
// POS pages
import { TablesPage }     from "@/pages/TablesPage"
import { TableOrderPage } from "@/pages/TableOrderPage"
import { PaymentPage }    from "@/pages/PaymentPage"
import { InvoicePage }    from "@/pages/InvoicePage"
import { MenuPage }       from "@/pages/MenuPage"
import { OrdersPage }     from "@/pages/OrdersPage"
import { ReportsPage }    from "@/pages/ReportsPage"
// Admin pages
import { CategoryPage }        from "@/pages/admin/CategoryPage"
import { TablesManagementPage} from "@/pages/admin/TablesManagementPage"
import { SettingsPage }        from "@/pages/admin/SettingsPage"

// ── Helpers ────────────────────────────────────────────────────────
const FULLSCREEN_SCREENS: Screen[] = ["tableOrder", "payment", "invoice"]

const getActiveItem = (screen: Screen): SidebarItemId => {
  if (FULLSCREEN_SCREENS.includes(screen)) return "tables"
  return screen as SidebarItemId
}

// ── Layout wrapper ─────────────────────────────────────────────────
const AppShell = ({
  activeItem, children, fullscreen, onNavigate,
}: {
  activeItem: SidebarItemId
  children:   ReactNode
  fullscreen: boolean
  onNavigate: (id: SidebarItemId) => void
}) => {
  if (fullscreen) return <>{children}</>
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <div className="hidden lg:flex">
        <Sidebar activeItem={activeItem} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <div className="lg:hidden">
          <BottomNav
            activeItem={activeItem}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────
export function App() {
  const [screen,        setScreen]        = useState<Screen>("tables")
  const [selectedTable, setSelectedTable] = useState<DiningTable>(tables[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [customerName,  setCustomerName]  = useState("")
  const [kitchenNote,   setKitchenNote]   = useState("")

  const cart = useCart()
  const gst   = Math.round(cart.subtotal * 0.15)
  const total  = cart.subtotal + gst

  const navigate = (id: SidebarItemId) => setScreen(id as Screen)

  const openTable = (table: DiningTable) => {
    setSelectedTable(table)
    cart.clearCart()
    setCustomerName("")
    setKitchenNote("")
    setScreen("tableOrder")
  }

  const fullscreen = FULLSCREEN_SCREENS.includes(screen)

  return (
    <AppShell
      activeItem={getActiveItem(screen)}
      fullscreen={fullscreen}
      onNavigate={navigate}
    >
      {/* ── POS ─────────────────────────────────────────── */}
      {screen === "tables"  && <TablesPage onOpenTable={openTable} />}
      {screen === "menu"    && <MenuPage />}
      {screen === "orders"  && <OrdersPage />}
      {screen === "reports" && <ReportsPage />}

      {screen === "tableOrder" && (
        <TableOrderPage
          cart={cart}
          customerName={customerName}
          kitchenNote={kitchenNote}
          onBack={() => setScreen("tables")}
          onCustomerName={setCustomerName}
          onKitchenNote={setKitchenNote}
          onPayment={() => setScreen("payment")}
          selectedTable={selectedTable}
        />
      )}
      {screen === "payment" && (
        <PaymentPage
          cartItems={cart.cartItems}
          gst={gst}
          onBack={() => setScreen("tableOrder")}
          onComplete={() => setScreen("invoice")}
          selectedTable={selectedTable}
          subtotal={cart.subtotal}
          total={total}
        />
      )}
      {screen === "invoice" && (
        <InvoicePage
          cartItems={cart.cartItems}
          customerName={customerName}
          gst={gst}
          onBackToTables={() => setScreen("tables")}
          paymentMethod={paymentMethod}
          selectedTable={selectedTable}
          subtotal={cart.subtotal}
          total={total}
        />
      )}

      {/* ── Admin ────────────────────────────────────────── */}
      {screen === "categories"    && <CategoryPage />}
      {screen === "tables-admin"  && <TablesManagementPage />}
      {screen === "settings"      && <SettingsPage />}
    </AppShell>
  )
}
