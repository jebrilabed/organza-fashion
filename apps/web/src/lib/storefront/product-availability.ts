import { ProductAvailability } from "@/generated/prisma/enums";
import { storefrontMessages as messages } from "@/lib/storefront/messages";

export function productAvailabilityLabel(stockQuantity: number, availability: ProductAvailability, shippingDurationDays: number | null, showDuration = false) {
  if (stockQuantity <= 0) return messages.ar.soldOut;
  if (availability !== ProductAvailability.IN_TRANSIT) return messages.ar.inStock;
  if (!showDuration || shippingDurationDays === null) return messages.ar.inTransit;

  const duration = shippingDurationDays === 1
    ? "يوم واحد"
    : shippingDurationDays === 2
      ? "يومان"
      : shippingDurationDays !== null && shippingDurationDays <= 10
        ? `${shippingDurationDays} أيام`
        : shippingDurationDays !== null
            ? `${shippingDurationDays} يومًا`
            : "";
          return `${messages.ar.inTransit} · ${messages.ar.shippingDuration}: ${duration}`;
}

export function productAvailabilityVariant(stockQuantity: number, availability: ProductAvailability) {
  if (stockQuantity <= 0) return "error" as const;
  return availability === ProductAvailability.IN_TRANSIT ? "warning" as const : "success" as const;
}