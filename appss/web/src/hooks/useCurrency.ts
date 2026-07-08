/**
 * useCurrency – returns a money formatter that respects the global settings currency.
 *
 * Usage:
 *   const fmt = useCurrency()
 *   fmt.format(1234)  // "₹1,234" or "$1,234" depending on settings
 */
import { useMemo } from "react"
import { useSettingsStore } from "@/store/settingsStore"
import { buildMoneyFormatter } from "@/utils/currency"

export function useCurrency(): Intl.NumberFormat {
  const settings = useSettingsStore(s => s.settings)
  return useMemo(
    () => buildMoneyFormatter(settings?.currency ?? "INR"),
    [settings?.currency],
  )
}
