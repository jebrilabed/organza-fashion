export type CheckoutPricedLine = { unitPrice: string; quantity: number };
export function calculateCheckoutAmounts(items: CheckoutPricedLine[]): {
  lineSubtotals: string[];
  subtotal: string;
  shipping: string;
  total: string;
} | null;
