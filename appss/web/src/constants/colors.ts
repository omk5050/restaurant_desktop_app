/**
 * RESTAURANT POS — Color Constants
 * Values match the CSS tokens declared in src/styles/tokens.css @theme block.
 * Used for TypeScript references and any JS-side colour logic.
 *
 * Sprint 2 note: token names were updated to align with Antigravity's
 * Tailwind v4 @theme definitions. Do NOT diverge from tokens.css values.
 */
export const COLORS = {
  // ── Brand ──────────────────────────────────────────────
  primary:       '#F97316',
  primaryDark:   '#C2410C',
  primaryLight:  '#FFF7ED',
  primaryMid:    '#FDBA74',

  // ── Backgrounds ────────────────────────────────────────
  bg:            '#F4F1EA',
  panel:         '#FBFAF7',
  warmLine:      '#E7DED2',
  espresso:      '#2B2118',

  // ── Typography ─────────────────────────────────────────
  text:          '#111827',
  textSec:       '#667085',
  border:        '#E6E0D8',

  // ── Status / Functional ────────────────────────────────
  blue:          '#2563EB',
  blueLight:     '#EFF6FF',
  green:         '#16A34A',
  greenLight:    '#ECFDF3',
  gray:          '#94A3B8',
  grayLight:     '#F8FAFC',
  purple:        '#7C3AED',
  purpleLight:   '#F5F3FF',
  yellow:        '#F59E0B',
  yellowLight:   '#FFFBEB',
  danger:        '#EF4444',
  slate:         '#475569',
  ink:           '#111827',
} as const

export type ColorKey   = keyof typeof COLORS
export type ColorValue = (typeof COLORS)[ColorKey]

export default COLORS
