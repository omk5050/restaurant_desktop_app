import { useState, useEffect, type ReactNode } from "react"
import { BottomNav, Sidebar } from "@/components/layout"
import { type SidebarItemId } from "@/components/layout"
import type { PaymentMethod, Screen } from "@/mocks/pos"
import { useCart } from "@/hooks/useCart"
import { useOrderStore } from "@/store/orderStore"
import { useSettingsStore } from "@/store/settingsStore"
// POS pages
import { TablesPage }     from "@/pages/TablesPage"
import type { DiningTable } from "@/pages/TablesPage"
import { TableOrderPage } from "@/pages/TableOrderPage"
import { PaymentPage }    from "@/pages/PaymentPage"
import { InvoicePage }    from "@/pages/InvoicePage"
import { MenuPage }       from "@/pages/MenuPage"
import { OrdersPage }     from "@/pages/OrdersPage"
import { ReportsPage }    from "@/pages/ReportsPage"
// Admin pages
import { CategoryPage }         from "@/pages/admin/CategoryPage"
import { TablesManagementPage } from "@/pages/admin/TablesManagementPage"
import { SettingsPage }         from "@/pages/admin/SettingsPage"

// ── Helpers ────────────────────────────────────────────────────────
const FULLSCREEN_SCREENS: Screen[] = ["tableOrder", "payment", "invoice"]

const getActiveItem = (screen: Screen): SidebarItemId => {
  if (FULLSCREEN_SCREENS.includes(screen)) return "tables"
  return screen as SidebarItemId
}

// ── Layout wrapper ─────────────────────────────────────────────────
const AppShell = ({
  activeItem, children, fullscreen, onNavigate, restaurantName,
}: {
  activeItem:      SidebarItemId
  children:        ReactNode
  fullscreen:      boolean
  onNavigate:      (id: SidebarItemId) => void
  restaurantName?: string
}) => {
  if (fullscreen) return <>{children}</>
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <div className="hidden lg:flex">
        <Sidebar activeItem={activeItem} onNavigate={onNavigate} restaurantName={restaurantName} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <div className="lg:hidden">
          <BottomNav activeItem={activeItem} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────
export function App() {
  const [screen,        setScreen]        = useState<Screen>("tables")
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [customerName,  setCustomerName]  = useState("")
  const [kitchenNote,   setKitchenNote]   = useState("")

  const cart = useCart()

  // Load settings once at root level
  const { settings, fetchSettings } = useSettingsStore()
  useEffect(() => { fetchSettings() }, [fetchSettings])

  // GST and service charge from settings (fallback to 5% GST)
  const gstPercent            = settings?.gstPercent            ?? 5
  const serviceChargePercent  = settings?.serviceChargePercent  ?? 0
  const gst            = Math.round(cart.subtotal * gstPercent / 100)
  const serviceCharge  = Math.round(cart.subtotal * serviceChargePercent / 100)
  const total          = cart.subtotal + gst + serviceCharge

  // Settings-driven display values
  const restaurantName = settings?.restaurantName || "Hotel Grand"
  const tagline        = settings?.tagline        || "Restaurant & Family Dining"
  const address        = settings?.address        || ""
  const phone          = settings?.phone          || ""
  const gstNumber      = settings?.gstNumber      || ""
  const receiptFooter  = settings?.receiptFooter  || "Thank you for dining with us!"

  const navigate = (id: SidebarItemId) => setScreen(id as Screen)

  // Fetch initial orders
  useEffect(() => {
    useOrderStore.getState().fetchOrders()
  }, [])

  const openTable = (table: DiningTable) => {
    setSelectedTable(table)
    cart.clearCart()
    
    // Sync active order if it exists for this table
    const activeOrder = useOrderStore.getState().getOrderForTable(table.id)
    if (activeOrder) {
      setCustomerName(activeOrder.customerName || "")
      activeOrder.items.forEach(item => {
        cart.addItem({
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          image: ""
        }, item.qty)
      })
    } else {
      setCustomerName("")
    }
    setKitchenNote("")
    setScreen("tableOrder")
  }

  const fullscreen = FULLSCREEN_SCREENS.includes(screen)

  return (
    <AppShell
      activeItem={getActiveItem(screen)}
      fullscreen={fullscreen}
      onNavigate={navigate}
      restaurantName={restaurantName}
    >
      {/* ── POS ─────────────────────────────────────────── */}
      {screen === "tables"  && (
        <TablesPage
          onOpenTable={openTable}
          restaurantName={restaurantName}
          tagline={tagline}
        />
      )}
      {screen === "menu"    && <MenuPage />}
      {screen === "orders"  && <OrdersPage />}
      {screen === "reports" && <ReportsPage />}

      {screen === "tableOrder" && selectedTable && (
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
      {screen === "payment" && selectedTable && (
        <PaymentPage
          cartItems={cart.cartItems}
          gst={gst}
          onBack={() => setScreen("tableOrder")}
          onComplete={(method) => {
            setPaymentMethod(method)
            setScreen("invoice")
          }}
          selectedTable={selectedTable}
          subtotal={cart.subtotal}
          total={total}
        />
      )}
      {screen === "invoice" && selectedTable && (
        <InvoicePage
          cartItems={cart.cartItems}
          customerName={customerName}
          gst={gst}
          serviceCharge={serviceCharge}
          onBackToTables={() => setScreen("tables")}
          paymentMethod={paymentMethod}
          selectedTable={selectedTable}
          subtotal={cart.subtotal}
          total={total}
          restaurantName={restaurantName}
          tagline={tagline}
          address={address}
          phone={phone}
          gstNumber={gstNumber}
          receiptFooter={receiptFooter}
        />
      )}

      {/* ── Admin ────────────────────────────────────────── */}
      {screen === "categories"   && <CategoryPage />}
      {screen === "tables-admin" && <TablesManagementPage />}
      {screen === "settings"     && <SettingsPage />}
    </AppShell>
  )
}
