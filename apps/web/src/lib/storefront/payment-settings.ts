export type BankTransferDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
};

export function getBankTransferDetails(configuration: unknown): BankTransferDetails | null {
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) return null;
  const nested = (configuration as Record<string, unknown>).bankTransfer;
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return null;
  const values = nested as Record<string, unknown>;
  const details = {
    bankName: typeof values.bankName === "string" ? values.bankName.trim() : "",
    accountName: typeof values.accountName === "string" ? values.accountName.trim() : "",
    accountNumber: typeof values.accountNumber === "string" ? values.accountNumber.trim() : "",
    iban: typeof values.iban === "string" ? values.iban.trim() : "",
  };
  return details.bankName && details.accountName && (details.accountNumber || details.iban) ? details : null;
}
