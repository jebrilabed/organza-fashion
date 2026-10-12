const transitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedOrderTransitions(status) {
  return transitions[status] ?? [];
}

export function canTransitionOrder(from, to) {
  return allowedOrderTransitions(from).includes(to);
}

export function availableAdminOrderStatuses(status) {
  if (!Object.hasOwn(transitions, status)) return [];
  return Object.keys(transitions).filter((nextStatus) =>
    nextStatus !== status && !(nextStatus === "CANCELLED" && ["SHIPPED", "DELIVERED"].includes(status))
  );
}

export function canAdminSetOrderStatus(from, to) {
  return availableAdminOrderStatuses(from).includes(to);
}

export function parseCheckoutInput(formData) {
  const readText = (field) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };
  const raw = {
    contactName: readText("contactName"),
    contactEmail: readText("contactEmail").toLowerCase(),
    contactPhone: readText("contactPhone"),
    address: readText("address"),
    city: readText("city"),
    deliveryZoneName: readText("deliveryZoneName"),
    customerNote: readText("customerNote"),
  };
  const paymentMethod = readText("paymentMethod");
  const errors = {};
  if (!raw.contactName || raw.contactName.length > 200) errors.contactName = "validationName";
  if (raw.contactEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.contactEmail) || raw.contactEmail.length > 254)) errors.contactEmail = "validationEmail";
  const digitCount = raw.contactPhone.replace(/\D/g, "").length;
  if (raw.contactPhone.length > 20 || digitCount < 8 || digitCount > 16 || !/^\+?\d[()\d\s.-]*$/.test(raw.contactPhone)) errors.contactPhone = "validationPhone";
  if (!raw.address || raw.address.length > 500) errors.address = "validationAddress";
  if (!raw.city || raw.city.length > 120) errors.city = "validationCity";
  if (!raw.deliveryZoneName || raw.deliveryZoneName.length > 120) errors.deliveryZoneName = "validationDeliveryZone";
  if (!["CASH_ON_DELIVERY", "BANK_TRANSFER"].includes(paymentMethod)) errors.paymentMethod = "validationPaymentMethod";
  if (paymentMethod === "BANK_TRANSFER") {
    const receipt = formData.get("paymentReceipt");
    if (!(typeof File !== "undefined" && receipt instanceof File && receipt.size > 0)) errors.paymentReceipt = "validationPaymentReceipt";
  }
  if (raw.customerNote.length > 2000) errors.customerNote = "validationNote";
  if (Object.keys(errors).length) return { ok: false, errors, values: raw };
  return { ok: true, value: { ...raw, paymentMethod } };
}

export function parseCartQuantity(value) {
  const quantity = typeof value === "string" && /^\d{1,10}$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(quantity) && quantity > 0 ? { ok: true, quantity } : { ok: false };
}
