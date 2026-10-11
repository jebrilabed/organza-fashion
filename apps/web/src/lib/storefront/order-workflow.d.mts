export function allowedOrderTransitions(status: string): string[];
export function canTransitionOrder(from: string, to: string): boolean;
export function parseCheckoutInput(formData: FormData):
  | { ok: true; value: { contactName: string; contactEmail: string; contactPhone: string; address: string; city: string; customerNote: string; paymentMethod: "CASH_ON_DELIVERY" | "BANK_TRANSFER" } }
  | { ok: false; errors: Record<string, string>; values: { contactName: string; contactEmail: string; contactPhone: string; address: string; city: string; customerNote: string } };
export function parseCartQuantity(value: unknown): { ok: true; quantity: number } | { ok: false };
