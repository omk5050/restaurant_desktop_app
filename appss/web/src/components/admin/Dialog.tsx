import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui"

interface DialogProps {
  open:         boolean
  onClose:      () => void
  title:        string
  description?: string
  children:     ReactNode
  footer?:      ReactNode
  size?:        "sm" | "md" | "lg"
}

export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else      document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={cn("flex w-full flex-col rounded-2xl bg-card shadow-warm-lg", maxW)}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-[1.25rem] font-black text-text">{title}</h2>
            {description && <p className="mt-0.5 text-[0.8125rem] text-text-sec">{description}</p>}
          </div>
          <button
            aria-label="Close dialog"
            className="ml-4 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-text-sec transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Convenience confirm-delete dialog
interface ConfirmDialogProps {
  open:       boolean
  onClose:    () => void
  onConfirm:  () => void
  title?:     string
  message:    string
  danger?:    boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, message,
  title = "Are you sure?", danger = true,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            className={danger ? "bg-danger hover:bg-danger/90" : ""}
            onClick={() => { onConfirm(); onClose() }}
          >
            {danger ? "Delete" : "Confirm"}
          </Button>
        </>
      }
    >
      <p className="text-[0.875rem] text-text-sec">{message}</p>
    </Dialog>
  )
}
