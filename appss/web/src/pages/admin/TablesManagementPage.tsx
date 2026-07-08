import { useState, useMemo, useEffect, type ReactNode } from "react"
import {
  LayoutGrid, Pencil, Plus, Trash2, Search,
  Armchair, CheckCircle2, Users, Coffee
} from "lucide-react"
import { Button, Card, Input } from "@/components/ui"
import { cn } from "@/lib/cn"
import { type AdminTableSection, type AdminTableStatus } from "@/mocks"
import { Dialog, ConfirmDialog } from "@/components/admin/Dialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { useTableStore, type ApiTable } from "@/store/tableStore"

const STATUS_META: Record<AdminTableStatus, { label: string; cls: string }> = {
  empty:  { label: "Available", cls: "bg-panel text-text-sec" },
  active: { label: "Occupied",  cls: "bg-primary-light text-primary" },
  bill:   { label: "Reserved",  cls: "bg-blue-light text-blue" },
  paid:   { label: "Cleaning",  cls: "bg-orange-100 text-orange-600" },
}

const SECTIONS: AdminTableSection[] = ["Restaurant", "Family Section", "Takeaway"]
const FLOORS   = ["Ground", "First", "Rooftop"]

interface FormTable {
  name: string
  seats: number
  section: AdminTableSection
  floor: string
  status: AdminTableStatus
}

const BLANK: FormTable = { name: "", seats: 4, section: "Restaurant", floor: "Ground", status: "empty" }

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[0.8125rem] font-bold text-text">{label}</label>
    {children}
  </div>
)

const StatTile = ({ label, value, icon: Icon, tone = "orange" }: { label: string; value: string | number; icon: any; tone?: "orange" | "green" | "gray" | "blue" }) => {
  const tones = {
    orange: { text: "text-primary", bg: "bg-primary/10", val: "text-primary-dark" },
    green: { text: "text-green", bg: "bg-green/10", val: "text-green" },
    gray: { text: "text-text-sec", bg: "bg-panel", val: "text-text-sec" },
    blue: { text: "text-blue", bg: "bg-blue/10", val: "text-blue" },
  }
  const active = tones[tone]
  return (
    <article className="flex h-[5.5rem] items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-warm transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[2px] hover:shadow-warm-lg">
      <div className="flex items-center gap-4">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", active.bg, active.text)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <p className={cn("text-[1.5rem] font-black leading-none tabular-nums", active.val)}>{value}</p>
          <p className="mt-1 text-[0.75rem] font-bold text-text-sec">{label}</p>
        </div>
      </div>
    </article>
  )
}

export function TablesManagementPage() {
  const { tables, fetchTables, addTable, updateTable, deleteTable } = useTableStore()
  const [section,   setSection]   = useState<AdminTableSection | "All">("All")
  const [search,    setSearch]    = useState("")
  const [addOpen,   setAddOpen]   = useState(false)
  const [editTable, setEditTable] = useState<ApiTable | null>(null)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [form,      setForm]      = useState<FormTable>(BLANK)

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const filtered = useMemo(() => {
    let result = section === "All" ? tables : tables.filter(t => t.section === section)
    if (search.trim()) {
      result = result.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    }
    return result
  }, [tables, section, search])

  const openAdd  = () => { setForm(BLANK); setAddOpen(true) }
  const openEdit = (t: ApiTable) => { setEditTable(t); setForm({ name: t.name, seats: t.seats, section: t.section as AdminTableSection, floor: "Ground", status: t.status as AdminTableStatus }) }
  const closeAll = () => { setAddOpen(false); setEditTable(null); setDeleteId(null) }

  const handleSaveNew  = async () => {
    if (!form.name.trim()) return
    const nextId = tables.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1
    await addTable({
      id: nextId,
      name: form.name,
      seats: form.seats,
      section: form.section as any,
      status: form.status as any,
    })
    closeAll()
  }

  const handleSaveEdit = async () => {
    if (!editTable || !form.name.trim()) return
    await updateTable(editTable.id, {
      name: form.name,
      seats: form.seats,
      section: form.section as any,
      status: form.status as any,
    })
    closeAll()
  }

  const handleDelete   = async () => {
    if (deleteId === null) return
    await deleteTable(deleteId)
    setDeleteId(null)
  }

  const counts = useMemo(() => ({
    total:  tables.length,
    active: tables.filter(t => t.status === "active").length,
    empty:  tables.filter(t => t.status === "empty").length,
    seats:  tables.reduce((s, t) => s + t.seats, 0),
  }), [tables])

  const FormBody = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Table Name / Number *">
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. T1 or A1" className="h-10 text-[0.8125rem] rounded-xl" />
      </Field>
      <Field label="Seating Capacity">
        <Input type="number" min={1} max={20} value={form.seats} className="h-10 text-[0.8125rem] rounded-xl"
          onChange={e => setForm(p => ({ ...p, seats: Number(e.target.value) }))} />
      </Field>
      <Field label="Section">
        <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value as AdminTableSection }))}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[0.8125rem] outline-none transition-[border-color] focus:border-primary">
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Floor">
        <select value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[0.8125rem] outline-none transition-[border-color] focus:border-primary">
          {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      {/* Header */}
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card dark:bg-bg px-6">
        <div>
          <h1 className="text-[1.25rem] font-black text-text">Table Setup</h1>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Manage restaurant tables, sections and layouts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-border bg-card pl-9 pr-3 text-[0.8125rem] text-text outline-none transition-[border-color] focus:border-primary"
            />
          </div>
          <button onClick={openAdd} type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[0.8125rem] font-bold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-dark active:scale-[0.97]">
            <Plus size={16} />
            Add Table
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem]">
          {/* Stats */}
          <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total Tables" value={counts.total} icon={LayoutGrid} tone="orange" />
            <StatTile label="Occupied" value={counts.active} icon={Coffee} tone="green" />
            <StatTile label="Available" value={counts.empty} icon={CheckCircle2} tone="gray" />
            <StatTile label="Total Seats" value={counts.seats} icon={Users} tone="blue" />
          </section>

          {/* Section filter */}
          <div className="mb-5 flex flex-wrap gap-2">
            {(["All", ...SECTIONS] as Array<AdminTableSection | "All">).map(s => (
              <button key={s} type="button" onClick={() => setSection(s)}
                className={cn("flex h-9 items-center rounded-full border px-4 text-[0.75rem] font-bold",
                  "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95",
                  section === s ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-card text-text-sec hover:bg-panel")}>
                {s}
              </button>
            ))}
          </div>

          {/* Table grid */}
          {filtered.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={<LayoutGrid size={48} strokeWidth={1} />} title="No tables found"
                action={<Button onClick={openAdd}><Plus size={16} /> Add Table</Button>} />
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(table => {
                const meta = STATUS_META[table.status] || STATUS_META.empty
                return (
                  <Card key={table.id} className="relative flex flex-col items-center p-5 border border-border shadow-warm transition-[box-shadow,transform] duration-[150ms] hover:-translate-y-[3px] hover:shadow-warm-lg rounded-3xl">
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={cn("rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider", meta.cls)}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Table Icon */}
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mt-3">
                      <Armchair size={24} strokeWidth={2} />
                    </div>

                    {/* Table Info */}
                    <h3 className="mt-4 text-[1.25rem] font-black text-text leading-none">{table.name}</h3>
                    <p className="mt-2 text-[0.75rem] font-bold text-text-sec uppercase tracking-wider text-center">
                      {table.section}
                    </p>
                    <p className="mt-1 text-[0.75rem] font-medium text-text-sec text-center">
                      {table.seats} Seats &middot; Floor Ground
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-6 flex w-full items-center justify-center gap-1.5 border-t border-border/80 pt-4">
                      <button onClick={() => openEdit(table)} type="button" aria-label="Edit Table"
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.8125rem] font-bold text-text-sec transition-[background-color,color,transform] duration-150 hover:bg-primary-light hover:text-primary active:scale-95">
                        <Pencil size={15} /> Edit
                      </button>
                      <button onClick={() => setDeleteId(table.id)} type="button" aria-label="Delete Table"
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-sec transition-[background-color,color,transform] duration-150 hover:bg-danger/10 hover:text-danger active:scale-95">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={addOpen} onClose={closeAll} title="Add Table"
        footer={<><Button variant="secondary" onClick={closeAll} className="h-10 rounded-xl px-4 text-[0.8125rem]">Cancel</Button><Button onClick={handleSaveNew} className="h-10 rounded-xl px-4 text-[0.8125rem]">Save Table</Button></>}>
        <FormBody />
      </Dialog>
      <Dialog open={!!editTable} onClose={closeAll} title="Edit Table"
        footer={<><Button variant="secondary" onClick={closeAll} className="h-10 rounded-xl px-4 text-[0.8125rem]">Cancel</Button><Button onClick={handleSaveEdit} className="h-10 rounded-xl px-4 text-[0.8125rem]">Save Changes</Button></>}>
        <FormBody />
      </Dialog>
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Table" message={`Delete table "${tables.find(t => t.id === deleteId)?.name}"? This cannot be undone.`} />
    </div>
  )
}
