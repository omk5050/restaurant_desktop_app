/**
 * Currency utilities.
 * Supports dynamic currency based on app settings.
 */
import { useSettingsStore } from "@/store/settingsStore"

/** Map from settings currency string (e.g. "INR") to Intl locale currency code */
const CURRENCY_MAP: Record<string, { code: string; locale: string }> = {
  INR: { code: "INR", locale: "en-IN" },
  USD: { code: "USD", locale: "en-US" },
  EUR: { code: "EUR", locale: "de-DE" },
  GBP: { code: "GBP", locale: "en-GB" },
  AED: { code: "AED", locale: "ar-AE" },
}

/** Extract the ISO 4217 code from a settings value like "INR (₹)" or "INR" */
function parseCurrencyCode(raw: string): string {
  const clean = raw.split(" ")[0].trim()
  return CURRENCY_MAP[clean]?.code ?? "INR"
}

function parseCurrencyLocale(raw: string): string {
  const clean = raw.split(" ")[0].trim()
  return CURRENCY_MAP[clean]?.locale ?? "en-IN"
}

/** Build an Intl.NumberFormat for the given settings currency string. */
export function buildMoneyFormatter(currencyRaw: string): Intl.NumberFormat {
  const code   = parseCurrencyCode(currencyRaw)
  const locale = parseCurrencyLocale(currencyRaw)
  return new Intl.NumberFormat(locale, {
    style:                "currency",
    currency:             code,
    maximumFractionDigits: 0,
  })
}

/**
 * Dynamic money formatter – always reads the current settings currency.
 * This is a Proxy so that `money.format(n)` always respects the latest settings.
 * Use this in components/subcomponents that cannot call React hooks.
 */
export const money = new Proxy({} as Intl.NumberFormat, {
  get(_target, prop: string) {
    const settings = useSettingsStore.getState().settings
    const fmt = buildMoneyFormatter(settings?.currency ?? "INR")
    return (fmt as any)[prop]?.bind(fmt)
  },
})
