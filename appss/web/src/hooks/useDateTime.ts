/**
 * useDateTime – returns helpers for formatting dates/times in the settings timezone.
 *
 * Usage:
 *   const { formatDate, formatTime, formatDateTime } = useDateTime()
 *   formatDate(new Date())   // "08 Jul 2026"
 *   formatTime(new Date())   // "07:32 pm"
 */
import { useMemo } from "react"
import { useSettingsStore } from "@/store/settingsStore"

export function useDateTime() {
  const settings = useSettingsStore(s => s.settings)
  const tz = settings?.timezone ?? "Asia/Kolkata"

  return useMemo(() => {
    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: tz,
      })

    const formatTime = (d: Date) =>
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      })

    const formatDateTime = (d: Date) =>
      `${formatDate(d)}, ${formatTime(d)}`

    return { formatDate, formatTime, formatDateTime, timezone: tz }
  }, [tz])
}
