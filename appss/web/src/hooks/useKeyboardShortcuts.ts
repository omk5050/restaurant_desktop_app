import { useEffect } from "react"

export interface Shortcut {
  key:     string
  ctrl?:   boolean
  shift?:  boolean
  action:  () => void
  enabled?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], active = true) {
  useEffect(() => {
    if (!active) return

    const handler = (e: KeyboardEvent) => {
      // Don't fire inside inputs/textareas (except Escape)
      const tag = (e.target as HTMLElement)?.tagName
      const inInput = tag === "INPUT" || tag === "TEXTAREA"

      for (const s of shortcuts) {
        if (s.enabled === false) continue
        const ctrlOk  = s.ctrl  ? (e.ctrlKey || e.metaKey)  : !(e.ctrlKey || e.metaKey)
        const shiftOk = s.shift ? e.shiftKey                 : !e.shiftKey
        const keyOk   = e.key.toLowerCase() === s.key.toLowerCase()

        if (keyOk && ctrlOk && shiftOk) {
          // Allow Escape anywhere; block Ctrl+F etc. inside inputs
          if (inInput && s.key !== "Escape") continue
          e.preventDefault()
          s.action()
          break
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcuts, active])
}
