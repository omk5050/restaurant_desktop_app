/**
 * Currency utilities.
 * Extracted from src/data/mock.ts during Sprint 6 refactor.
 */

/** Formats a number as Indian Rupees (₹). */
export const money = new Intl.NumberFormat("en-IN", {
  style:                "currency",
  currency:             "INR",
  maximumFractionDigits: 0,
})
