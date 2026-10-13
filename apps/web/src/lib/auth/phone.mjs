const arabicDigits = "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹";
const latinDigits = "01234567890123456789";

/** Normalize a phone number for account identity and reject malformed values. */
export function normalizeAccountPhone(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/[٠-٩۰-۹]/g, (digit) => latinDigits[arabicDigits.indexOf(digit)]);
  const compact = normalized.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;
  const phone = compact.startsWith("+") ? compact.slice(1) : compact;
  return phone.length >= 8 && phone.length <= 15 ? phone : null;
}
