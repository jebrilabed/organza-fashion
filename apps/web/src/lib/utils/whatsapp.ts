/**
 * Converts a phone number to a WhatsApp wa.me link.
 * Strips spaces, dashes, parentheses, and leading zeros.
 * Adds country code if not present (defaults to 972 for Palestine/Israel).
 */
export function whatsappUrl(phone: string, message?: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If starts with 00, replace with nothing (strip the international prefix)
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // If starts with 0, it's a local number — remove the leading 0
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If it doesn't already start with a country code (more than 10 digits = already has code),
  // we leave it as-is since the user can enter the full number including country code.
  const url = `https://wa.me/${digits}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
