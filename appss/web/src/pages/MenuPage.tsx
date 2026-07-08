import { useEffect, useState, useRef } from "react"
import { Trash2, Plus, ToggleLeft, ToggleRight, Check, X, Pencil, Upload, ImageOff } from "lucide-react"
import { Card, Button, Input } from "@/components/ui"
import { Header } from "@/components/layout"
import { cn } from "@/lib/cn"
import { money } from "@/utils/currency"
import { useMenuStore, type ApiMenuItem, type ApiCategory } from "@/store/menuStore"
import { Dialog, ConfirmDialog } from "@/components/admin/Dialog"
import { api } from "@/lib/api"

// ── Sub-components ──────────────────────────────────────────────────
const HeroPanel = ({ totalItems, categories }: { totalItems: number; categories: number }) => (
  <section className="rounded-2xl bg-espresso px-5 py-3 text-white shadow-warm">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary-mid">Menu Control</p>
        <h2 className="mt-0.5 text-[1.5rem] font-black leading-tight text-white">Kitchen catalog</h2>
        <p className="mt-1 max-w-md text-[0.8125rem] font-medium leading-normal opacity-70">
          Fast edits across {categories} categories, quick scanning, live availability.
        </p>
      </div>
      <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center shadow-sm">
        <p className="text-[1.25rem] font-black leading-none">{totalItems}</p>
        <p className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-widest text-white/90">items</p>
      </div>
    </div>
  </section>
)

const StatTile = ({ label, tone = "text-primary-dark", value }: {
  label: string; tone?: string; value: string
}) => (
  <Card className="flex h-[5.5rem] flex-col items-center justify-center gap-1 p-2 text-center transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-[1px] hover:shadow-warm-lg">
    <p className={cn("text-[1.5rem] font-black leading-none tabular-nums", tone)}>{value}</p>
    <p className="text-[0.6875rem] font-bold text-text-sec">{label}</p>
  </Card>
)

// ── Menu Card — clickable to edit ───────────────────────────────────
const MenuCard = ({ item, onEdit, onDelete, onToggle }: {
  item:     ApiMenuItem
  onEdit:   (item: ApiMenuItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string, available: boolean) => void
}) => (
  <article
    onClick={() => onEdit(item)}
    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-warm cursor-pointer transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-warm-lg hover:border-primary/40"
  >
    {/* Fixed-ratio square image area */}
    <div className="relative w-full" style={{ paddingBottom: "100%" }}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-t-3xl bg-panel/50">
        {item.imageUrl ? (
          <img
            alt={item.name}
            className="h-full w-full object-cover"
            src={item.imageUrl}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-border">
            <ImageOff size={32} strokeWidth={1} />
            <span className="text-[0.6875rem] font-medium">No image</span>
          </div>
        )}

        {/* Veg/Non-Veg dot */}
        <span className={cn(
          "absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-sm border-2 border-card shadow-sm",
          item.isVeg ? "bg-green-light" : "bg-danger/10",
        )}>
          <span className={cn("block size-2.5 rounded-full", item.isVeg ? "bg-green" : "bg-danger")} />
        </span>

        {/* Off overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-3xl bg-black/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-danger px-3 py-1 text-[0.75rem] font-black text-white">OFF</span>
          </div>
        )}

        {/* Edit hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100 rounded-t-3xl">
          <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[0.75rem] font-bold text-primary shadow-warm">
            <Pencil size={12} /> Edit
          </div>
        </div>
      </div>
    </div>

    {/* Controls */}
    <div className="flex flex-col gap-0 px-3 pb-3 pt-2.5">
      <h3 className="line-clamp-1 text-[0.875rem] font-black leading-tight text-text">{item.name}</h3>
      <p className="mt-0.5 text-[0.6875rem] text-text-sec">{item.shortCode ? `#${item.shortCode}` : ""}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[1rem] font-black text-primary">{money.format(item.price)}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onToggle(item.id, !item.isAvailable) }}
            className={cn(
              "flex h-6 items-center justify-center gap-1 rounded-full px-2.5 text-[0.625rem] font-bold uppercase tracking-wide transition-colors",
              item.isAvailable ? "bg-green/10 text-green" : "bg-danger/10 text-danger",
            )}
          >
            {item.isAvailable ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
            {item.isAvailable ? "Live" : "Off"}
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(item.id) }}
            className="flex size-6 items-center justify-center rounded-full text-text-sec hover:bg-danger/10 hover:text-danger transition-colors"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  </article>
)

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[0.75rem] font-bold uppercase tracking-wider text-text">{label}</label>
    {children}
    {hint && <p className="text-[0.6875rem] font-medium text-text-sec">{hint}</p>}
  </div>
)

// ── Image uploader widget ───────────────────────────────────────────
function ImageUploader({ imageUrl, onChange }: { imageUrl: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [pendingCrop, setPendingCrop] = useState<{ file: File; img: HTMLImageElement } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setErrorMsg("")
    const formData = new FormData()
    formData.append("image", file)
    try {
      const { data } = await api.post<{ url: string }>("/menu/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onChange(data.url)
    } catch {
      setErrorMsg("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        if (img.width !== img.height) {
          setPendingCrop({ file, img })
        } else {
          uploadFile(file)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmCrop = () => {
    if (!pendingCrop) return
    const { file, img } = pendingCrop

    const size = Math.min(img.width, img.height)
    const sx = (img.width - size) / 2
    const sy = (img.height - size) / 2

    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 600
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600)
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name, { type: file.type })
        uploadFile(croppedFile)
      } else {
        uploadFile(file) // Fallback to original
      }
    }, file.type || "image/jpeg")

    setPendingCrop(null)
  }

  const handleKeepOriginal = () => {
    if (!pendingCrop) return
    uploadFile(pendingCrop.file)
    setPendingCrop(null)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Preview square */}
      <div
        className="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-panel transition-colors hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-border">
            <ImageOff size={20} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[0.75rem] font-bold text-text-sec hover:bg-panel transition-colors",
            uploading && "opacity-60 cursor-not-allowed",
          )}
        >
          <Upload size={13} />
          {uploading ? "Uploading…" : imageUrl ? "Change Image" : "Upload Image"}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-7 rounded-xl border border-danger/40 px-3 text-[0.6875rem] font-bold text-danger hover:bg-danger/5 transition-colors"
          >
            Remove Image
          </button>
        )}
        {imageUrl && (
          <p className="text-[0.625rem] text-green font-bold">✓ Image uploaded</p>
        )}
      </div>

      {/* Crop Dialog Option */}
      <Dialog
        open={pendingCrop !== null}
        onClose={() => setPendingCrop(null)}
        title="Crop Image to Square?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleKeepOriginal}>Keep Original</Button>
            <Button onClick={handleConfirmCrop}>Crop to Square</Button>
          </>
        }
      >
        <p className="text-[0.875rem] text-text-sec">
          The selected image is not square. Would you like to crop it to a square to keep item cards equal in size?
        </p>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorMsg !== ""}
        onClose={() => setErrorMsg("")}
        title="Upload Error"
        size="sm"
        footer={<Button onClick={() => setErrorMsg("")}>OK</Button>}
      >
        <p className="text-[0.875rem] text-text-sec">{errorMsg}</p>
      </Dialog>
    </div>
  )
}

// ── Item form (shared by Add and Edit) ─────────────────────────────
interface ItemFormState {
  name:        string
  price:       string
  category:    string
  isVeg:       boolean
  isAvailable: boolean
  imageUrl:    string
  shortCode:   string
  description: string
}

function ItemForm({
  form,
  setForm,
  categories,
}: {
  form:       ItemFormState
  setForm:    (f: ItemFormState) => void
  categories: ApiCategory[]
}) {
  const set = (patch: Partial<ItemFormState>) => setForm({ ...form, ...patch })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Item Name *">
        <Input
          value={form.name}
          onChange={e => set({ name: e.target.value })}
          placeholder="e.g. Garlic Bread"
          className="h-10 text-[0.8125rem] rounded-xl"
        />
      </Field>
      <Field label="Short Code">
        <Input
          value={form.shortCode}
          onChange={e => set({ shortCode: e.target.value })}
          placeholder="e.g. GB01"
          className="h-10 text-[0.8125rem] rounded-xl"
        />
      </Field>
      <Field label="Price (₹) *">
        <Input
          type="number"
          min={1}
          value={form.price}
          onChange={e => set({ price: e.target.value })}
          placeholder="e.g. 150"
          className="h-10 text-[0.8125rem] rounded-xl"
        />
      </Field>
      <Field label="Category *">
        <select
          value={form.category}
          onChange={e => set({ category: e.target.value })}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[0.8125rem] outline-none transition-[border-color] focus:border-primary"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </Field>

      {/* Image upload — spans both columns */}
      <div className="col-span-2">
        <Field label="Item Image">
          <ImageUploader imageUrl={form.imageUrl} onChange={url => set({ imageUrl: url })} />
        </Field>
      </div>

      <Field label="Dietary Type">
        <div className="flex rounded-xl border border-border bg-panel p-1">
          <button
            type="button"
            onClick={() => set({ isVeg: true })}
            className={cn("flex-1 rounded-lg py-1.5 text-[0.8125rem] font-bold transition-all",
              form.isVeg ? "bg-green-light text-green shadow-sm" : "text-text-sec hover:text-text")}
          >
            🟢 Veg
          </button>
          <button
            type="button"
            onClick={() => set({ isVeg: false })}
            className={cn("flex-1 rounded-lg py-1.5 text-[0.8125rem] font-bold transition-all",
              !form.isVeg ? "bg-danger/10 text-danger shadow-sm" : "text-text-sec hover:text-text")}
          >
            🔴 Non-Veg
          </button>
        </div>
      </Field>

      <Field label="Status">
        <div className="flex rounded-xl border border-border bg-panel p-1">
          <button
            type="button"
            onClick={() => set({ isAvailable: true })}
            className={cn("flex-1 rounded-lg py-1.5 text-[0.8125rem] font-bold transition-all",
              form.isAvailable ? "bg-green-light text-green shadow-sm" : "text-text-sec hover:text-text")}
          >
            ✅ Live
          </button>
          <button
            type="button"
            onClick={() => set({ isAvailable: false })}
            className={cn("flex-1 rounded-lg py-1.5 text-[0.8125rem] font-bold transition-all",
              !form.isAvailable ? "bg-danger/10 text-danger shadow-sm" : "text-text-sec hover:text-text")}
          >
            🔴 Off
          </button>
        </div>
      </Field>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
const BLANK_FORM: ItemFormState = {
  name: "", price: "", category: "", isVeg: true,
  isAvailable: true, imageUrl: "", shortCode: "", description: "",
}

export function MenuPage() {
  const {
    items, categories, loading, fetchMenu, fetchCategories,
    deleteItem, toggleAvailability, addItem, updateItem, addCategory, updateCategory, deleteCategory,
  } = useMenuStore()

  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Modals
  const [addItemOpen,       setAddItemOpen]       = useState(false)
  const [editItem,          setEditItem]           = useState<ApiMenuItem | null>(null)
  const [manageTagsOpen,    setManageTagsOpen]     = useState(false)
  const [deleteTargetId,    setDeleteTargetId]     = useState<string | null>(null)
  const [isSaving,          setIsSaving]           = useState(false)
  const [customAlert, setCustomAlert] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  })

  // Add form state
  const [addForm, setAddForm] = useState<ItemFormState>(BLANK_FORM)

  // Edit form state
  const [editForm, setEditForm] = useState<ItemFormState>(BLANK_FORM)

  // Manage tags
  const [newTagEmoji,    setNewTagEmoji]    = useState("🍽️")
  const [newTagName,     setNewTagName]     = useState("")
  const [editingTagId,   setEditingTagId]   = useState<string | null>(null)
  const [editTagEmoji,   setEditTagEmoji]   = useState("")
  const [editTagName,    setEditTagName]    = useState("")

  useEffect(() => {
    fetchMenu()
    fetchCategories()
  }, [fetchMenu, fetchCategories])

  useEffect(() => {
    if (categories.length > 0 && !addForm.category) {
      setAddForm(prev => ({ ...prev, category: categories[0].id }))
    }
  }, [categories, addForm.category])

  const filtered = activeCategory === "all"
    ? items
    : items.filter(i => i.categoryId === activeCategory)

  const vegCount   = items.filter(i => i.isVeg).length
  const avgPrice   = items.length > 0 ? Math.round(items.reduce((s, i) => s + i.price, 0) / items.length) : 0
  const availCount = items.filter(i => i.isAvailable).length

  // ── Handlers ─────────────────────────────────────────────────────

  const handleOpenAddItem = () => {
    setAddForm({ ...BLANK_FORM, category: categories[0]?.id || "" })
    setAddItemOpen(true)
  }

  const handleSaveNewItem = async () => {
    if (!addForm.name.trim() || !addForm.price || !addForm.category) {
      setCustomAlert({
        open: true,
        title: "Validation Error",
        message: "Please fill in Name, Price, and Category.",
      })
      return
    }
    const priceVal = Number(addForm.price)
    if (isNaN(priceVal) || priceVal <= 0) {
      setCustomAlert({
        open: true,
        title: "Validation Error",
        message: "Price must be a positive number.",
      })
      return
    }
    setIsSaving(true)
    await addItem({
      name:        addForm.name.trim(),
      price:       priceVal,
      categoryId:  addForm.category,
      emoji:       "🍽️",
      isVeg:       addForm.isVeg,
      isAvailable: addForm.isAvailable,
      imageUrl:    addForm.imageUrl,
      shortCode:   addForm.shortCode.trim(),
      description: addForm.description.trim(),
    })
    setIsSaving(false)
    setAddItemOpen(false)
    setAddForm(BLANK_FORM)
  }

  const handleOpenEdit = (item: ApiMenuItem) => {
    setEditForm({
      name:        item.name,
      price:       String(item.price),
      category:    item.categoryId,
      isVeg:       item.isVeg,
      isAvailable: item.isAvailable,
      imageUrl:    item.imageUrl || "",
      shortCode:   item.shortCode || "",
      description: item.description || "",
    })
    setEditItem(item)
  }

  const handleSaveEdit = async () => {
    if (!editItem) return
    if (!editForm.name.trim() || !editForm.price) {
      setCustomAlert({
        open: true,
        title: "Validation Error",
        message: "Name and Price are required.",
      })
      return
    }
    const priceVal = Number(editForm.price)
    if (isNaN(priceVal) || priceVal <= 0) {
      setCustomAlert({
        open: true,
        title: "Validation Error",
        message: "Price must be a positive number.",
      })
      return
    }
    setIsSaving(true)
    await updateItem(editItem.id, {
      name:        editForm.name.trim(),
      price:       priceVal,
      categoryId:  editForm.category,
      isVeg:       editForm.isVeg,
      isAvailable: editForm.isAvailable,
      imageUrl:    editForm.imageUrl,
      shortCode:   editForm.shortCode.trim(),
    })
    setIsSaving(false)
    setEditItem(null)
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    await addCategory({
      id: "c_" + Date.now(), name: newTagName.trim(), icon: newTagEmoji.trim() || "🍽️",
      color: "#F97316", sortOrder: categories.length + 1, section: "restaurant", active: true,
    })
    setNewTagName(""); setNewTagEmoji("🍽️")
  }

  const handleSaveTagEdit = async (cat: ApiCategory) => {
    if (!editTagName.trim()) return
    await updateCategory(cat.id, { name: editTagName.trim(), icon: editTagEmoji.trim() || cat.icon })
    setEditingTagId(null)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <Header eyebrow="MENU CONTROL" title="Kitchen catalog" />
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="mx-auto max-w-[80rem] px-6 py-5">

          <HeroPanel totalItems={items.length} categories={categories.length} />

          {/* Stats */}
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatTile label="Categories" value={String(categories.length)} />
            <StatTile label="Avg price"  value={money.format(avgPrice)} />
            <StatTile label="Veg items"  value={String(vegCount)} />
          </section>

          {/* Category Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.75rem] font-bold transition-colors",
                activeCategory === "all"
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-text-sec hover:bg-primary-light hover:text-primary-dark",
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.75rem] font-bold transition-colors",
                  activeCategory === cat.id
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-text-sec hover:bg-primary-light hover:text-primary-dark",
                )}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Header */}
          <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[1.25rem] font-black leading-tight text-text">Menu Grid</h2>
            <div className="flex items-center gap-3">
              <span className="text-[0.75rem] font-bold text-green">{availCount} available</span>
              <button
                type="button"
                onClick={() => setManageTagsOpen(true)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[0.75rem] font-bold text-text-sec shadow-sm hover:bg-panel transition-colors"
              >
                Manage Categories
              </button>
              <button
                type="button"
                onClick={handleOpenAddItem}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[0.75rem] font-bold text-white shadow-sm hover:bg-primary-dark transition-colors active:scale-[0.97]"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add Item
              </button>
            </div>
          </section>

          {/* Grid */}
          {loading ? (
            <div className="mt-5 text-center text-text-sec py-8">Loading menu…</div>
          ) : filtered.length === 0 ? (
            <div className="mt-5 text-center text-text-sec py-8 border-2 border-dashed border-border rounded-3xl p-8 bg-card">
              {items.length === 0 ? 'No menu items yet. Click "Add Item" to start.' : "No items in this category."}
            </div>
          ) : (
            <section className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
              {filtered.map(item => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTargetId}
                  onToggle={toggleAvailability}
                />
              ))}
            </section>
          )}
        </div>
      </main>

      {/* ── Dialogs ── */}

      {/* 1. Add Item */}
      <Dialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        title="Add Menu Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddItemOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewItem} disabled={isSaving}>{isSaving ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <ItemForm form={addForm} setForm={setAddForm} categories={categories} />
      </Dialog>

      {/* 2. Edit Item */}
      <Dialog
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        title={`Edit — ${editItem?.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>{isSaving ? "Saving…" : "Save Changes"}</Button>
          </>
        }
      >
        <ItemForm form={editForm} setForm={setEditForm} categories={categories} />
      </Dialog>

      {/* 3. Manage Tags / Categories */}
      <Dialog
        open={manageTagsOpen}
        onClose={() => setManageTagsOpen(false)}
        title="Manage Categories"
        footer={<Button variant="secondary" onClick={() => setManageTagsOpen(false)}>Done</Button>}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[0.8125rem] font-bold text-text-sec">Active Categories</p>
          <div className="flex flex-col gap-2 max-h-[12.5rem] overflow-y-auto border border-border bg-panel/30 rounded-2xl p-3" style={{ scrollbarWidth: "thin" }}>
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-3 bg-card border border-border/80 px-3 py-2 rounded-xl shadow-sm">
                {editingTagId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={editTagEmoji} onChange={e => setEditTagEmoji(e.target.value)} placeholder="Emoji" className="h-8 w-12 text-[0.8125rem]" />
                    <Input value={editTagName} onChange={e => setEditTagName(e.target.value)} placeholder="Tag Name" className="h-8 flex-1 text-[0.8125rem]" />
                    <button type="button" onClick={() => handleSaveTagEdit(cat)} className="flex size-7 items-center justify-center rounded-lg bg-green text-white hover:bg-green/90"><Check size={14} /></button>
                    <button type="button" onClick={() => setEditingTagId(null)} className="flex size-7 items-center justify-center rounded-lg bg-panel border border-border text-text-sec"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-[0.875rem] font-bold text-text flex items-center gap-2">
                      <span className="text-[1.25rem]">{cat.icon}</span> {cat.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setEditingTagId(cat.id); setEditTagName(cat.name); setEditTagEmoji(cat.icon) }} className="flex size-8 items-center justify-center rounded-lg text-text-sec hover:bg-primary-light hover:text-primary">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => deleteCategory(cat.id)} className="flex size-8 items-center justify-center rounded-lg text-text-sec hover:bg-danger/10 hover:text-danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-border pt-4 flex flex-col gap-3">
            <p className="text-[0.8125rem] font-bold text-text-sec">Add New Category</p>
            <div className="flex gap-2">
              <Input value={newTagEmoji} onChange={e => setNewTagEmoji(e.target.value)} placeholder="Emoji" className="h-9 w-20 text-[0.8125rem]" />
              <Input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Category Name" className="h-9 flex-1 text-[0.8125rem]" />
            </div>
            <Button onClick={handleCreateTag} className="h-10 text-[0.8125rem]">+ Add Category</Button>
          </div>
        </div>
      </Dialog>

      {/* 4. Delete Confirm */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => { if (deleteTargetId) { await deleteItem(deleteTargetId); setDeleteTargetId(null) } }}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action is permanent."
      />

      {/* Custom Alert Dialog */}
      <Dialog
        open={customAlert.open}
        onClose={() => setCustomAlert(prev => ({ ...prev, open: false }))}
        title={customAlert.title}
        size="sm"
        footer={<Button onClick={() => setCustomAlert(prev => ({ ...prev, open: false }))}>OK</Button>}
      >
        <p className="text-[0.875rem] text-text-sec">{customAlert.message}</p>
      </Dialog>
    </div>
  )
}
