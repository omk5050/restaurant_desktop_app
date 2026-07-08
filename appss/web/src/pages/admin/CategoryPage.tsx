import React, { useState, useMemo, useEffect, type ReactNode } from "react"
import {
  GripVertical, Pencil, Plus, Tag, Trash2, Search,
  Filter, MoreHorizontal, CheckCircle2, XCircle, LayoutGrid, PackageOpen
} from "lucide-react"
import { Button, Card, Input } from "@/components/ui"
import { cn } from "@/lib/cn"
import { Dialog, ConfirmDialog } from "@/components/admin/Dialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { useMenuStore, type ApiCategory } from "@/store/menuStore"
import type { Category } from "@/mocks"

const PRESET_COLORS = [
  "#F97316","#EF4444","#16A34A","#2563EB","#7C3AED",
  "#F59E0B","#0EA5E9","#EC4899","#65A30D","#92400E",
  "#DC2626","#D97706","#22C55E","#3B82F6","#A855F7",
]

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[0.8125rem] font-bold text-text">{label}</label>
    {children}
  </div>
)

const BLANK = { name: "", color: "#F97316", sortOrder: 1, active: true, itemCount: 0, icon: "🍽️" }

// ── FormBody extracted OUTSIDE CategoryPage to prevent cursor-jumping ──
// When defined inside a component, React creates a new component type each render
// causing unmount/remount and loss of focus after every keystroke.
interface FormBodyProps {
  form: Omit<import("@/mocks").Category, "id">
  setForm: React.Dispatch<React.SetStateAction<Omit<import("@/mocks").Category, "id">>>
}

function FormBody({ form, setForm }: FormBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Category Name *">
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Biryani" className="h-10 rounded-xl text-[0.8125rem]" />
      </Field>
      <Field label="Display Color">
        <div className="mt-1 flex flex-wrap gap-2">
          {PRESET_COLORS.map(color => (
            <button key={color} type="button" aria-label={`Color ${color}`}
              className={cn("size-8 rounded-full border-2 transition-transform hover:scale-110", form.color === color ? "scale-110 border-text shadow-sm" : "border-transparent")}
              style={{ backgroundColor: color }}
              onClick={() => setForm(p => ({ ...p, color }))}
            />
          ))}
        </div>
      </Field>
      <Field label="Emoji Icon">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-panel text-[1.5rem]">
            {form.icon || "🍽️"}
          </span>
          <Input
            value={form.icon}
            onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
            placeholder="Paste an emoji, e.g. 🍛"
            className="h-10 rounded-xl text-[0.8125rem] flex-1"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sort Order">
          <Input type="number" min={1} value={form.sortOrder} className="h-10 rounded-xl text-[0.8125rem]"
            onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
        </Field>
        <Field label="Status">
          <button type="button" onClick={() => setForm(p => ({ ...p, active: !p.active }))}
            className={cn("flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-[0.8125rem] font-bold transition-colors", form.active ? "border-green bg-green/10 text-green" : "border-border bg-panel text-text-sec")}>
            {form.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {form.active ? "Active" : "Inactive"}
          </button>
        </Field>
      </div>
    </div>
  )
}

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

export function CategoryPage() {
  const { categories, fetchCategories, items, fetchMenu, addCategory, updateCategory, deleteCategory } = useMenuStore()
  const cats = categories

  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editCat, setEditCat] = useState<ApiCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Category, "id">>(BLANK)

  useEffect(() => {
    fetchCategories()
    fetchMenu()
  }, [fetchCategories, fetchMenu])

  const filteredCats = useMemo(() => cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.sortOrder - b.sortOrder), [cats, search])

  const openAdd = () => { setForm({ ...BLANK, sortOrder: cats.length + 1 }); setAddOpen(true) }
  const openEdit = (c: ApiCategory) => { setEditCat(c); setForm({ name: c.name, color: c.color, icon: c.icon || "🍽️", sortOrder: c.sortOrder, active: c.active, itemCount: 0 }) }
  const closeAll = () => { setAddOpen(false); setEditCat(null); setDeleteId(null) }

  const handleSaveNew = async () => { if (!form.name.trim()) return; await addCategory({ name: form.name, color: form.color, icon: form.icon || "🍽️", sortOrder: form.sortOrder, active: form.active }); closeAll() }
  const handleSaveEdit = async () => { if (!editCat || !form.name.trim()) return; await updateCategory(editCat.id, { name: form.name, color: form.color, icon: form.icon || "🍽️", sortOrder: form.sortOrder, active: form.active }); closeAll() }
  const handleDelete = async () => { if (!deleteId) return; await deleteCategory(deleteId); setDeleteId(null) }
  const toggleActive = async (cat: ApiCategory) => { await updateCategory(cat.id, { active: !cat.active }) }


  const totalItems = items.length

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      {/* Header */}
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card dark:bg-bg px-6">
        <div>
          <h1 className="text-[1.25rem] font-black text-text">Categories</h1>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Manage menu categories</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-border bg-card pl-9 pr-3 text-[0.8125rem] text-text outline-none transition-[border-color] focus:border-primary"
            />
          </div>
          <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[0.8125rem] font-bold text-text transition-[border-color,transform] duration-150 hover:border-primary/40 hover:bg-panel active:scale-[0.97]">
            <Filter size={16} className="text-text-sec" />
            Filter
          </button>
          <button onClick={openAdd} type="button" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[0.8125rem] font-bold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-dark active:scale-[0.97]">
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem]">
          {/* KPI Cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total Categories" value={cats.length} icon={LayoutGrid} tone="orange" />
            <StatTile label="Active Categories" value={cats.filter(c => c.active).length} icon={CheckCircle2} tone="green" />
            <StatTile label="Inactive Categories" value={cats.filter(c => !c.active).length} icon={XCircle} tone="gray" />
            <StatTile label="Total Menu Items" value={totalItems} icon={PackageOpen} tone="blue" />
          </section>

          {/* List */}
          {cats.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={<Tag size={48} strokeWidth={1} />} title="No categories yet"
                description="Add your first category to organize the menu"
                action={<Button onClick={openAdd}><Plus size={16} /> Add Category</Button>} />
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCats.map(cat => (
                <div key={cat.id} className="group flex h-[4.5rem] items-center gap-3 rounded-2xl border border-border bg-card px-3 shadow-sm transition-[box-shadow,transform] duration-150 hover:-translate-y-[2px] hover:shadow-warm sm:gap-4 sm:px-4">
                  {/* Left */}
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <button type="button" aria-label="Drag to reorder" className="cursor-grab text-border transition-colors hover:text-text-sec">
                      <GripVertical size={18} />
                    </button>
                    <span className="size-3 shrink-0 rounded-full shadow-sm sm:size-4" style={{ backgroundColor: cat.color }} />
                    <div className="hidden size-9 items-center justify-center rounded-full bg-panel text-text-sec sm:flex">
                      <Tag size={16} strokeWidth={2} />
                    </div>
                  </div>
                  
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h3 className={cn("truncate text-[0.875rem] font-bold text-text sm:text-[0.9375rem]", !cat.active && "text-text-sec line-through opacity-70")}>{cat.name}</h3>
                    <p className="mt-0.5 text-[0.6875rem] font-medium text-text-sec sm:text-[0.75rem]">Order #{cat.sortOrder}</p>
                  </div>

                  {/* Center */}
                  <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <span className="tabular-nums text-[0.8125rem] font-bold text-text sm:text-[0.875rem]">{items.filter(i => i.categoryId === cat.id).length}</span>
                      <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-text-sec sm:text-[0.625rem]">Items</span>
                    </div>
                    <button onClick={() => toggleActive(cat)} type="button"
                      className={cn("rounded-full px-2 py-1 text-[0.5625rem] font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 sm:text-[0.625rem]",
                        cat.active ? "bg-green-light text-green hover:bg-green hover:text-white" : "bg-panel text-text-sec hover:bg-slate hover:text-white")}>
                      {cat.active ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Right */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openEdit(cat)} type="button" aria-label={`Edit ${cat.name}`}
                      className="flex size-8 items-center justify-center rounded-xl text-text-sec transition-[background-color,color,transform] duration-150 hover:bg-primary-light hover:text-primary active:scale-95 sm:size-10">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)} type="button" aria-label={`Delete ${cat.name}`}
                      className="flex size-8 items-center justify-center rounded-xl text-text-sec transition-[background-color,color,transform] duration-150 hover:bg-danger/10 hover:text-danger active:scale-95 sm:size-10">
                      <Trash2 size={16} />
                    </button>
                    <button type="button" aria-label="More actions"
                      className="hidden size-10 items-center justify-center rounded-xl text-text-sec transition-[background-color,color,transform] duration-150 hover:bg-panel hover:text-text active:scale-95 sm:flex">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={addOpen} onClose={closeAll} title="Add Category"
        footer={<><Button variant="secondary" onClick={closeAll} className="h-10 rounded-xl px-4 text-[0.8125rem]">Cancel</Button><Button onClick={handleSaveNew} className="h-10 rounded-xl px-4 text-[0.8125rem]">Save Category</Button></>}>
        <FormBody form={form} setForm={setForm} />
      </Dialog>
      <Dialog open={!!editCat} onClose={closeAll} title="Edit Category"
        footer={<><Button variant="secondary" onClick={closeAll} className="h-10 rounded-xl px-4 text-[0.8125rem]">Cancel</Button><Button onClick={handleSaveEdit} className="h-10 rounded-xl px-4 text-[0.8125rem]">Save Changes</Button></>}>
        <FormBody form={form} setForm={setForm} />
      </Dialog>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${cats.find(c => c.id === deleteId)?.name}"? Items in this category will not be deleted.`} />
    </div>
  )
}
