import { type ReactNode, useState } from "react"
import {
  Building2, Check, Globe, Hash, Percent, Settings as SettingsIcon,
  Upload, Printer, ChefHat, CreditCard, Bell, Users, Palette, ShieldAlert,
  RotateCcw, Sun, Moon, Monitor
} from "lucide-react"
import { Button, Card, Input } from "@/components/ui"
import { cn } from "@/lib/cn"
import { defaultSettings, type RestaurantSettings } from "@/mocks"
import { EmptyState } from "@/components/shared/EmptyState"
import { useTheme } from "@/contexts/ThemeContext"

type Theme = RestaurantSettings["theme"]

const THEMES: Array<{ id: Theme; label: string; color: string }> = [
  { id: "orange", label: "Orange (Default)", color: "#F97316" },
  { id: "blue",   label: "Ocean Blue",       color: "#2563EB" },
  { id: "green",  label: "Forest Green",     color: "#16A34A" },
  { id: "purple", label: "Royal Purple",     color: "#7C3AED" },
]

const CURRENCIES = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"]
const TIMEZONES  = ["Asia/Kolkata", "Asia/Dubai", "America/New_York", "Europe/London", "Asia/Singapore"]

const NAV_ITEMS = [
  { id: "General", icon: Globe, desc: "Currency and timezone" },
  { id: "Restaurant", icon: Building2, desc: "Name, address, logo" },
  { id: "Billing & Tax", icon: Percent, desc: "GST & service charges" },
  { id: "Printer", icon: Printer, desc: "Receipts and printing" },
  { id: "Appearance", icon: Palette, desc: "Theme & styles" },
]

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[0.75rem] font-bold text-text uppercase tracking-wider">{label}</label>
    {children}
    {hint && <p className="text-[0.6875rem] font-medium text-text-sec">{hint}</p>}
  </div>
)

const SectionGroup = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <Card className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7 sm:p-8 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-1 hover:shadow-warm-lg">
    <div>
      <h2 className="text-[1.25rem] font-black text-text">{title}</h2>
      {description && <p className="mt-1 text-[0.8125rem] font-medium text-text-sec">{description}</p>}
    </div>
    <div className="flex flex-col gap-6">
      {children}
    </div>
  </Card>
)

export function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings)
  const [saved,    setSaved]    = useState(false)
  const [activeTab, setActiveTab] = useState("General")
  const themeCtx = useTheme()

  const set = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  
  const handleReset = () => {
    setSettings(defaultSettings)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "General":
        return (
          <SectionGroup title="Currency & Region" description="Configure your primary currency and timezone.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Currency">
                <select value={settings.currency} onChange={e => set("currency", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[0.8125rem] font-medium text-text outline-none transition-[border-color] focus:border-primary">
                  {CURRENCIES.map(c => <option key={c} value={c.split(" ")[0]}>{c}</option>)}
                </select>
              </Field>
              <Field label="Timezone">
                <select value={settings.timezone} onChange={e => set("timezone", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[0.8125rem] font-medium text-text outline-none transition-[border-color] focus:border-primary">
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </SectionGroup>
        )
      case "Restaurant":
        return (
          <div className="flex flex-col gap-8">
            <SectionGroup title="Brand Identity" description="Upload your restaurant logo and branding assets.">
              <div className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-panel p-8 transition-colors hover:border-primary/50 hover:bg-primary/5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-card shadow-sm text-primary transition-transform group-hover:scale-105">
                  <Upload size={24} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-[0.8125rem] font-bold text-text">Upload Restaurant Logo</p>
                  <p className="mt-1 text-[0.6875rem] font-medium text-text-sec">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </SectionGroup>
            
            <SectionGroup title="Restaurant Details" description="Basic information about your business.">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Restaurant Name *">
                    <Input value={settings.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Hotel Grand" className="h-10 rounded-xl" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Tagline">
                    <Input value={settings.tagline} onChange={e => set("tagline", e.target.value)} placeholder="e.g. Fine Dining & Grill" className="h-10 rounded-xl" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Input value={settings.address} onChange={e => set("address", e.target.value)} placeholder="123 Main Street, City" className="h-10 rounded-xl" />
                  </Field>
                </div>
                <Field label="Phone">
                  <Input value={settings.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" className="h-10 rounded-xl" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={settings.email} onChange={e => set("email", e.target.value)} placeholder="info@hotel.com" className="h-10 rounded-xl" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Website">
                    <Input value={settings.website} onChange={e => set("website", e.target.value)} placeholder="www.hotel.com" className="h-10 rounded-xl" />
                  </Field>
                </div>
              </div>
            </SectionGroup>
          </div>
        )
      case "Billing & Tax":
        return (
          <SectionGroup title="Tax & Charges" description="Configure GST and automatic service charges.">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="GST Number" hint="Used on printed receipts">
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec pointer-events-none" />
                    <Input value={settings.gstNumber} onChange={e => set("gstNumber", e.target.value)}
                      placeholder="29ABCDE1234F1Z5" className="h-10 rounded-xl pl-9 w-full" />
                  </div>
                </Field>
              </div>
              <Field label="GST %" hint="Applied to all orders">
                <div className="relative">
                  <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec pointer-events-none" />
                  <Input type="number" min={0} max={100} value={settings.gstPercent}
                    onChange={e => set("gstPercent", Number(e.target.value))} className="h-10 rounded-xl pl-9 w-full" />
                </div>
              </Field>
              <Field label="Service Charge %" hint="Optional, 0 to disable">
                <div className="relative">
                  <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec pointer-events-none" />
                  <Input type="number" min={0} max={30} value={settings.serviceChargePercent}
                    onChange={e => set("serviceChargePercent", Number(e.target.value))} className="h-10 rounded-xl pl-9 w-full" />
                </div>
              </Field>

              {/* Live preview */}
              <div className="sm:col-span-2 mt-2 flex flex-col gap-3 rounded-2xl border border-border bg-panel p-6">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec mb-2">Invoice Preview — ₹1,000 order</p>
                <div className="flex justify-between text-[0.875rem] font-medium text-text-sec">
                  <span>Subtotal</span><span>₹1,000</span>
                </div>
                {settings.gstPercent > 0 && (
                  <div className="flex justify-between text-[0.875rem] font-medium text-text-sec">
                    <span>GST ({settings.gstPercent}%)</span>
                    <span>₹{(1000 * settings.gstPercent / 100).toFixed(0)}</span>
                  </div>
                )}
                {settings.serviceChargePercent > 0 && (
                  <div className="flex justify-between text-[0.875rem] font-medium text-text-sec">
                    <span>Service ({settings.serviceChargePercent}%)</span>
                    <span>₹{(1000 * settings.serviceChargePercent / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-border/80 pt-3 text-[1.125rem] font-black text-text">
                  <span>Total</span>
                  <span>₹{(1000 * (1 + settings.gstPercent / 100 + settings.serviceChargePercent / 100)).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </SectionGroup>
        )
      case "Printer":
        return (
          <SectionGroup title="Receipt Configuration" description="Customize printed receipt content.">
            <Field label="Footer Message" hint="Shown at the bottom of every printed receipt">
              <textarea
                value={settings.receiptFooter}
                onChange={e => set("receiptFooter", e.target.value)}
                placeholder="Thank you for dining with us!"
                className="min-h-[120px] w-full rounded-xl border border-border bg-card p-3 text-[0.8125rem] font-medium text-text outline-none resize-y placeholder:text-text-sec transition-[border-color] focus:border-primary"
              />
            </Field>
            {/* Preview */}
            <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-panel p-6 py-8 text-center">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec mb-4">Receipt Footer Preview</p>
              {settings.receiptFooter.split("\n").map((line, i) => (
                <p key={i} className="text-[0.8125rem] font-bold leading-relaxed text-text-sec">{line}</p>
              ))}
            </div>
          </SectionGroup>
        )
      case "Appearance":
        return (
          <div className="flex flex-col gap-8">
            <SectionGroup title="Theme Mode" description="Choose the appearance of the application.">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Monitor },
                ].map(m => (
                  <button key={m.id} type="button" onClick={() => themeCtx.setMode(m.id as any)}
                    className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all duration-150 ease-out active:scale-95",
                      themeCtx.mode === m.id ? "border-primary bg-primary-light shadow-sm text-primary-dark" : "border-border bg-card text-text hover:border-primary/50 hover:bg-panel")}>
                    <m.icon size={24} strokeWidth={2} />
                    <span className="text-[0.875rem] font-bold">{m.label} Mode</span>
                  </button>
                ))}
              </div>
            </SectionGroup>

            <SectionGroup title="Accent Color" description="Select the primary brand color for the POS interface.">
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "orange", label: "Orange", color: "#F97316" },
                  { id: "blue", label: "Blue", color: "#2563EB" },
                  { id: "green", label: "Green", color: "#16A34A" },
                  { id: "purple", label: "Purple", color: "#7C3AED" },
                ].map(c => (
                  <button key={c.id} type="button" onClick={() => themeCtx.setAccent(c.id as any)}
                    className={cn("flex items-center gap-3 rounded-full border px-4 py-2 transition-all duration-150 ease-out active:scale-95",
                      themeCtx.accent === c.id ? "border-primary bg-primary-light shadow-sm text-primary-dark" : "border-border bg-card text-text hover:border-primary/50 hover:bg-panel")}>
                    <span className="size-4 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[0.8125rem] font-bold">{c.label}</span>
                  </button>
                ))}
              </div>
            </SectionGroup>

            <SectionGroup title="Density & Scale" description="Adjust spacing and sizing to fit your screen.">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Layout Density">
                  <div className="flex rounded-xl border border-border bg-panel p-1">
                    {[
                      { id: false, label: "Comfortable" },
                      { id: true, label: "Compact" },
                    ].map(opt => (
                      <button key={opt.label} type="button" onClick={() => themeCtx.setCompact(opt.id)}
                        className={cn("flex-1 rounded-lg py-2 text-[0.8125rem] font-bold transition-all duration-150",
                          themeCtx.compact === opt.id ? "bg-card text-text shadow-sm" : "text-text-sec hover:text-text")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="UI Scale">
                  <div className="flex rounded-xl border border-border bg-panel p-1">
                    {(["90", "100", "110"] as const).map(s => (
                      <button key={s} type="button" onClick={() => themeCtx.setScale(s)}
                        className={cn("flex-1 rounded-lg py-2 text-[0.8125rem] font-bold transition-all duration-150",
                          themeCtx.scale === s ? "bg-card text-text shadow-sm" : "text-text-sec hover:text-text")}>
                        {s}%
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </SectionGroup>

            <SectionGroup title="Effects & Style" description="Customize animations and component rounding.">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Animations">
                  <div className="flex rounded-xl border border-border bg-panel p-1">
                    {[
                      { id: false, label: "Normal" },
                      { id: true, label: "Reduced Motion" },
                    ].map(opt => (
                      <button key={opt.label} type="button" onClick={() => themeCtx.setReducedMotion(opt.id)}
                        className={cn("flex-1 rounded-lg py-2 text-[0.8125rem] font-bold transition-all duration-150",
                          themeCtx.reducedMotion === opt.id ? "bg-card text-text shadow-sm" : "text-text-sec hover:text-text")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Card Style">
                  <div className="flex rounded-xl border border-border bg-panel p-1">
                    {[
                      { id: "soft", label: "Soft (Rounded)" },
                      { id: "sharp", label: "Sharp (Edges)" },
                    ].map(opt => (
                      <button key={opt.label} type="button" onClick={() => themeCtx.setCardStyle(opt.id as any)}
                        className={cn("flex-1 rounded-lg py-2 text-[0.8125rem] font-bold transition-all duration-150",
                          themeCtx.cardStyle === opt.id ? "bg-card text-text shadow-sm" : "text-text-sec hover:text-text")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </SectionGroup>
          </div>
        )
      default:
        const currentItem = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0]
        return (
          <Card className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-border p-10 text-center shadow-warm">
             <EmptyState
                icon={<currentItem.icon size={48} strokeWidth={1} />}
                title={`${activeTab} Settings`}
                description="This module is not enabled for your account yet."
                action={<Button variant="secondary">Contact Support</Button>}
             />
          </Card>
        )
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      {/* Header */}
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card dark:bg-bg px-6">
        <div>
          <h1 className="text-[1.25rem] font-black text-text">Settings</h1>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Configure restaurant info, taxes, branding and preferences</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleReset} className="h-10 rounded-xl px-4 text-[0.8125rem]">
            <RotateCcw size={16} /> Reset
          </Button>
          <Button onClick={handleSave} className={cn("h-10 rounded-xl px-4 text-[0.8125rem] transition-colors", saved && "border-green bg-green text-white hover:bg-green/90")}>
            {saved ? <><Check size={16} /> Saved Successfully</> : "Save Changes"}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto flex max-w-[80rem] flex-col gap-8 md:flex-row">
          
          {/* Navigation Sidebar */}
          <aside className="w-full shrink-0 md:w-[260px] lg:w-[280px]">
            <nav className="sticky top-0 flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-150 active:scale-95",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-text hover:bg-primary/10"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-text-sec"} />
                    <div className="flex flex-col">
                      <span className={cn("text-[0.875rem] font-bold", isActive ? "text-white" : "text-text")}>
                        {item.id}
                      </span>
                      <span className={cn("text-[0.6875rem] font-medium", isActive ? "text-white/80" : "text-text-sec")}>
                        {item.desc}
                      </span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Settings Section */}
          <div className="min-w-0 flex-1">
            {renderContent()}
          </div>
          
        </div>
      </main>
    </div>
  )
}
