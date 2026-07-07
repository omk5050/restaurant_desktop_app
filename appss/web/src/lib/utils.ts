/**
 * Sprint 2 compatibility shim.
 * Antigravity uses `@/lib/cn`; Sprint 2 components use `@/lib/utils`.
 * This re-export keeps both import paths working.
 */
export { cn } from './cn'
